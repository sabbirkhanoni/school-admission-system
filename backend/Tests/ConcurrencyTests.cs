using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using SchoolAdmissionSystem.DTOs;
using Xunit;

namespace SchoolAdmissionSystem.Tests;

public class ConcurrencyTests : IClassFixture<TestFactory>
{
    private readonly HttpClient _client;

    public ConcurrencyTests(TestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HeavyConcurrentHoldRequests_MustNeverOverAllocateSeats()
    {
        const int totalSeats = 5;
        const int totalConcurrentApplicants = 25;

        // 1. Create a class with strictly 5 seats
        var createRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - Limited High Demand", totalSeats));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(created);
        var classId = created.Id;

        // 2. Prepare 25 distinct students
        var responses = new ConcurrentBag<HttpResponseMessage>();
        var applicantIds = Enumerable.Range(1000, totalConcurrentApplicants)
            .Select(i => $"2015269000000{i}")
            .ToList();

        // 3. Fire all 25 requests simultaneously
        var tasks = applicantIds.Select(async studentId =>
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", studentId);
            var res = await _client.SendAsync(req);
            responses.Add(res);
        });

        await Task.WhenAll(tasks);

        // 4. Assert: Exactly 5 succeed (201 Created), 20 fail with 409 Conflict
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(totalSeats, successCount);
        Assert.Equal(totalConcurrentApplicants - totalSeats, conflictCount);

        // 5. Final database verification: held + confirmed must be strictly totalSeats (5)
        var detail = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{classId}");
        Assert.NotNull(detail);
        Assert.Equal(totalSeats, detail.HeldSeats + detail.ConfirmedSeats);
        Assert.Equal(0, detail.AvailableSeats);
    }
}

