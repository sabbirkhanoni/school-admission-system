using System.ComponentModel.DataAnnotations;

namespace SchoolAdmissionSystem.DTOs;

public record CreateClassRequest(
    [Required(ErrorMessage = "Class name is required.")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters.")]
    string Name,

    [Range(1, 100000, ErrorMessage = "Total seats must be at least 1.")]
    int TotalSeats
);

public record ClassResponse(
    string Id,
    string Name,
    int TotalSeats
);

public record ClassDetailResponse(
    string Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats
);
