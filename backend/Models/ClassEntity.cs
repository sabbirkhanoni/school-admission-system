namespace SchoolAdmissionSystem.Models;

public class ClassEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }

    public ICollection<HoldEntity> Holds { get; set; } = new List<HoldEntity>();
}
