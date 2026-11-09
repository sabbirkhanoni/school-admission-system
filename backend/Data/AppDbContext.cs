using Microsoft.EntityFrameworkCore;
using SchoolAdmissionSystem.Models;

namespace SchoolAdmissionSystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ClassEntity> Classes => Set<ClassEntity>();
    public DbSet<HoldEntity> Holds => Set<HoldEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ClassEntity>(entity =>
        {
            entity.ToTable("classes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(c => c.Name).HasColumnName("name").IsRequired().HasMaxLength(255);
            entity.Property(c => c.TotalSeats).HasColumnName("total_seats").IsRequired();

            entity.HasMany(c => c.Holds)
                .WithOne(h => h.Class)
                .HasForeignKey(h => h.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HoldEntity>(entity =>
        {
            entity.ToTable("holds");
            entity.HasKey(h => h.HoldId);
            entity.Property(h => h.HoldId).HasColumnName("hold_id").HasMaxLength(64);
            entity.Property(h => h.ClassId).HasColumnName("class_id").IsRequired().HasMaxLength(64);
            entity.Property(h => h.StudentId).HasColumnName("student_id").IsRequired().HasMaxLength(32);
            entity.Property(h => h.Status).HasColumnName("status").IsRequired().HasMaxLength(20);
            entity.Property(h => h.ExpiresAt).HasColumnName("expires_at").IsRequired();
            entity.Property(h => h.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasIndex(h => new { h.ClassId, h.Status, h.ExpiresAt });
            entity.HasIndex(h => new { h.StudentId, h.ClassId });
            entity.HasIndex(h => h.ExpiresAt);
        });
    }
}

