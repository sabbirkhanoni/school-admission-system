using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmissionSystem.DTOs;
using SchoolAdmissionSystem.Services;

namespace SchoolAdmissionSystem.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private static readonly Regex StudentIdRegex = new(@"^\d{17}$", RegexOptions.Compiled);
    private readonly AdmissionService _admissionService;

    public MeController(AdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("holds")]
    public async Task<ActionResult<IReadOnlyList<StudentHoldResponse>>> GetMyHolds(
        CancellationToken cancellationToken)
    {
        if (!Request.Headers.TryGetValue("X-Student-Id", out var studentIdValues) || string.IsNullOrWhiteSpace(studentIdValues))
        {
            return BadRequest(new { message = "Missing required 'X-Student-Id' header." });
        }

        var studentId = studentIdValues.ToString().Trim();
        if (!StudentIdRegex.IsMatch(studentId))
        {
            return BadRequest(new { message = "Invalid 'X-Student-Id'. It must be a 17-digit numeric string." });
        }

        var response = await _admissionService.GetHoldsByStudentAsync(studentId, cancellationToken);
        return Ok(response);
    }
}
