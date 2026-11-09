using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmissionSystem.DTOs;
using SchoolAdmissionSystem.Services;

namespace SchoolAdmissionSystem.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private static readonly Regex StudentIdRegex = new(@"^\d{17}$", RegexOptions.Compiled);
    private readonly AdmissionService _admissionService;

    public ClassesController(AdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpPost]
    public async Task<ActionResult<ClassResponse>> CreateClass(
        [FromBody] CreateClassRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _admissionService.CreateClassAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClassDetailResponse>>> GetAllClasses(
        CancellationToken cancellationToken)
    {
        var response = await _admissionService.GetAllClassesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{classId}")]
    public async Task<ActionResult<ClassDetailResponse>> GetClassById(
        string classId,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _admissionService.GetClassByIdAsync(classId, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{classId}/holds")]
    public async Task<ActionResult<CreateHoldResponse>> CreateHold(
        string classId,
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

        try
        {
            var response = await _admissionService.CreateHoldAsync(classId, studentId, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (SeatFullException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
