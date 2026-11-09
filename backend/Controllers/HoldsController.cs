using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmissionSystem.DTOs;
using SchoolAdmissionSystem.Services;

namespace SchoolAdmissionSystem.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private static readonly Regex StudentIdRegex = new(@"^\d{17}$", RegexOptions.Compiled);
    private readonly AdmissionService _admissionService;

    public HoldsController(AdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("{holdId}")]
    public async Task<ActionResult<HoldResponse>> GetHoldById(
        string holdId,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _admissionService.GetHoldByIdAsync(holdId, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{holdId}/confirm")]
    public async Task<ActionResult<ConfirmResponse>> ConfirmHold(
        string holdId,
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
            var response = await _admissionService.ConfirmHoldAsync(holdId, studentId, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{holdId}")]
    public async Task<IActionResult> CancelHold(
        string holdId,
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
            await _admissionService.CancelHoldAsync(holdId, studentId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }
}

