namespace SchoolAdmissionSystem.Models;

public class HoldEntity
{
    public string HoldId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = "HELD";
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ClassEntity? Class { get; set; }
}
