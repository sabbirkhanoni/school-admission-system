namespace SchoolAdmissionSystem.DTOs;

public record CreateHoldResponse(
    string HoldId,
    string ClassId,
    string StudentId,
    string Status,
    DateTime ExpiresAt
);

public record HoldResponse(
    string HoldId,
    string ClassId,
    string Status,
    DateTime ExpiresAt
);

public record ConfirmResponse(
    string HoldId,
    string Status
);

public record StudentHoldResponse(
    string HoldId,
    string ClassId,
    string ClassName,
    string Status,
    DateTime ExpiresAt
);
