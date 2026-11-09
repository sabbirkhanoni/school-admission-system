using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SchoolAdmissionSystem.Data;
using SchoolAdmissionSystem.DTOs;
using SchoolAdmissionSystem.Models;

namespace SchoolAdmissionSystem.Services;

public class AdmissionService
{
    private static readonly SemaphoreSlim _fallbackLock = new(1, 1);
    private readonly AppDbContext _dbContext;
    private readonly int _holdDurationSeconds;

    public AdmissionService(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        var envSeconds = configuration.GetValue<int?>("HOLD_DURATION_SECONDS")
                         ?? configuration.GetValue<int?>("HoldDurationSeconds");
        _holdDurationSeconds = envSeconds is > 0 ? envSeconds.Value : 600;
    }

    public async Task<ClassResponse> CreateClassAsync(CreateClassRequest request, CancellationToken cancellationToken = default)
    {
        var classId = "c_" + Guid.NewGuid().ToString("N")[..8];
        var entity = new ClassEntity
        {
            Id = classId,
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats
        };

        _dbContext.Classes.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ClassResponse(entity.Id, entity.Name, entity.TotalSeats);
    }

    public async Task<IReadOnlyList<ClassDetailResponse>> GetAllClassesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var classes = await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var classIds = classes.Select(c => c.Id).ToList();

        // Lazy Expiration: Only consider active holds (CONFIRMED or HELD that have not expired)
        var activeHolds = await _dbContext.Holds
            .AsNoTracking()
            .Where(h => classIds.Contains(h.ClassId) && (h.Status == "CONFIRMED" || (h.Status == "HELD" && h.ExpiresAt > now)))
            .ToListAsync(cancellationToken);

        var holdsByClass = activeHolds.GroupBy(h => h.ClassId).ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<ClassDetailResponse>();
        foreach (var cls in classes)
        {
            holdsByClass.TryGetValue(cls.Id, out var classHolds);
            classHolds ??= new List<HoldEntity>();

            var confirmed = classHolds.Count(h => h.Status == "CONFIRMED");
            var held = classHolds.Count(h => h.Status == "HELD" && h.ExpiresAt > now);
            var available = Math.Max(0, cls.TotalSeats - (confirmed + held));

            result.Add(new ClassDetailResponse(cls.Id, cls.Name, cls.TotalSeats, held, confirmed, available));
        }

        return result;
    }

    public async Task<ClassDetailResponse> GetClassByIdAsync(string classId, CancellationToken cancellationToken = default)
    {
        var cls = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (cls == null)
        {
            throw new KeyNotFoundException($"Class '{classId}' not found.");
        }

        var now = DateTime.UtcNow;
        var activeHolds = await _dbContext.Holds
            .AsNoTracking()
            .Where(h => h.ClassId == classId && (h.Status == "CONFIRMED" || (h.Status == "HELD" && h.ExpiresAt > now)))
            .ToListAsync(cancellationToken);

        var confirmed = activeHolds.Count(h => h.Status == "CONFIRMED");
        var held = activeHolds.Count(h => h.Status == "HELD" && h.ExpiresAt > now);
        var available = Math.Max(0, cls.TotalSeats - (confirmed + held));

        return new ClassDetailResponse(cls.Id, cls.Name, cls.TotalSeats, held, confirmed, available);
    }

    public async Task<CreateHoldResponse> CreateHoldAsync(string classId, string studentId, CancellationToken cancellationToken = default)
    {
        var isPostgres = _dbContext.Database.IsRelational() && _dbContext.Database.ProviderName?.Contains("Npgsql") == true;
        var isRelational = _dbContext.Database.IsRelational();

        if (!isPostgres)
        {
            await _fallbackLock.WaitAsync(cancellationToken);
        }

        IDbContextTransaction? transaction = null;
        if (isRelational)
        {
            transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        }

        try
        {
            ClassEntity? schoolClass;
            if (isPostgres)
            {
                // Concurrency control: Row-level lock on the class row in PostgreSQL
                schoolClass = await _dbContext.Classes
                    .FromSqlInterpolated($"SELECT * FROM classes WHERE id = {classId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                schoolClass = await _dbContext.Classes
                    .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
            }

            if (schoolClass == null)
            {
                throw new KeyNotFoundException($"Class '{classId}' not found.");
            }

            var now = DateTime.UtcNow;

            // Rule 3: Single active hold or confirmed admission per student in the same class
            var hasActiveOrConfirmed = await _dbContext.Holds
                .AnyAsync(h => h.ClassId == classId 
                            && h.StudentId == studentId 
                            && (h.Status == "CONFIRMED" || (h.Status == "HELD" && h.ExpiresAt > now)),
                          cancellationToken);

            if (hasActiveOrConfirmed)
            {
                throw new InvalidOperationException("Student already has an active hold or confirmed admission in this class.");
            }

            // Real-time seat counts with Lazy Expiration
            var confirmedCount = await _dbContext.Holds
                .CountAsync(h => h.ClassId == classId && h.Status == "CONFIRMED", cancellationToken);

            var heldCount = await _dbContext.Holds
                .CountAsync(h => h.ClassId == classId && h.Status == "HELD" && h.ExpiresAt > now, cancellationToken);

            // Rule 1: held + confirmed must NEVER exceed totalSeats
            if (heldCount + confirmedCount >= schoolClass.TotalSeats)
            {
                throw new SeatFullException("No seats available in this class.");
            }

            var holdId = "h_" + Guid.NewGuid().ToString("N")[..8];
            var newHold = new HoldEntity
            {
                HoldId = holdId,
                ClassId = classId,
                StudentId = studentId,
                Status = "HELD",
                ExpiresAt = now.AddSeconds(_holdDurationSeconds),
                CreatedAt = now
            };

            _dbContext.Holds.Add(newHold);
            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return new CreateHoldResponse(
                newHold.HoldId,
                newHold.ClassId,
                newHold.StudentId,
                newHold.Status,
                newHold.ExpiresAt
            );
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }

            if (!isPostgres)
            {
                _fallbackLock.Release();
            }
        }
    }

    public async Task<HoldResponse> GetHoldByIdAsync(string holdId, CancellationToken cancellationToken = default)
    {
        var hold = await _dbContext.Holds
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.HoldId == holdId, cancellationToken);

        if (hold == null)
        {
            throw new KeyNotFoundException($"Hold '{holdId}' not found.");
        }

        // Lazy Expiration on read
        var status = hold.Status;
        if (status == "HELD" && hold.ExpiresAt <= DateTime.UtcNow)
        {
            status = "EXPIRED";
        }

        return new HoldResponse(hold.HoldId, hold.ClassId, status, hold.ExpiresAt);
    }

    public async Task<ConfirmResponse> ConfirmHoldAsync(string holdId, string studentId, CancellationToken cancellationToken = default)
    {
        var isPostgres = _dbContext.Database.IsRelational() && _dbContext.Database.ProviderName?.Contains("Npgsql") == true;
        var isRelational = _dbContext.Database.IsRelational();

        IDbContextTransaction? transaction = null;
        if (isRelational)
        {
            transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        }

        try
        {
            HoldEntity? hold;
            if (isPostgres)
            {
                hold = await _dbContext.Holds
                    .FromSqlInterpolated($"SELECT * FROM holds WHERE hold_id = {holdId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                hold = await _dbContext.Holds
                    .FirstOrDefaultAsync(h => h.HoldId == holdId, cancellationToken);
            }

            if (hold == null)
            {
                throw new KeyNotFoundException($"Hold '{holdId}' not found.");
            }

            // Rule 4: Only student can confirm their own hold
            if (hold.StudentId != studentId)
            {
                throw new UnauthorizedAccessException("Cannot confirm hold belonging to another student.");
            }

            // Rule 5: Idempotency
            if (hold.Status == "CONFIRMED")
            {
                return new ConfirmResponse(hold.HoldId, "CONFIRMED");
            }

            if (hold.Status == "CANCELLED")
            {
                throw new InvalidOperationException("Hold has been cancelled.");
            }

            // Lazy Expiration check
            if (hold.Status == "EXPIRED" || hold.ExpiresAt <= DateTime.UtcNow)
            {
                hold.Status = "EXPIRED";
                await _dbContext.SaveChangesAsync(cancellationToken);
                if (transaction != null) await transaction.CommitAsync(cancellationToken);

                throw new InvalidOperationException("Hold has expired and cannot be confirmed.");
            }

            hold.Status = "CONFIRMED";
            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return new ConfirmResponse(hold.HoldId, "CONFIRMED");
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    public async Task CancelHoldAsync(string holdId, string studentId, CancellationToken cancellationToken = default)
    {
        var hold = await _dbContext.Holds
            .FirstOrDefaultAsync(h => h.HoldId == holdId, cancellationToken);

        if (hold == null)
        {
            throw new KeyNotFoundException($"Hold '{holdId}' not found.");
        }

        if (hold.StudentId != studentId)
        {
            throw new UnauthorizedAccessException("Cannot cancel hold belonging to another student.");
        }

        if (hold.Status == "HELD")
        {
            hold.Status = "CANCELLED";
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<StudentHoldResponse>> GetHoldsByStudentAsync(string studentId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var holds = await _dbContext.Holds
            .AsNoTracking()
            .Include(h => h.Class)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<StudentHoldResponse>();
        foreach (var hold in holds)
        {
            var status = hold.Status;
            if (status == "HELD" && hold.ExpiresAt <= now)
            {
                status = "EXPIRED";
            }

            result.Add(new StudentHoldResponse(
                hold.HoldId,
                hold.ClassId,
                hold.Class?.Name ?? string.Empty,
                status,
                hold.ExpiresAt
            ));
        }

        return result;
    }
}

public class SeatFullException : Exception
{
    public SeatFullException(string message) : base(message) { }
}

