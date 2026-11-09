using System.Net;
using System.Net.Http.Json;
using SchoolAdmissionSystem.DTOs;
using Xunit;

namespace SchoolAdmissionSystem.Tests;

public class ApiContractTests : IClassFixture<TestFactory>
{
    private readonly HttpClient _client;

    public ApiContractTests(TestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ApiEndpoints_MustMatchContractSpecifications()
    {
        // 1. POST /classes
        var createRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 6 - Morning Shift", 120));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(created);
        Assert.False(string.IsNullOrWhiteSpace(created.Id));
        Assert.Equal("Class 6 - Morning Shift", created.Name);
        Assert.Equal(120, created.TotalSeats);

        // 2. GET /classes
        var listRes = await _client.GetFromJsonAsync<List<ClassDetailResponse>>("/classes");
        Assert.NotNull(listRes);
        Assert.Contains(listRes, c => c.Id == created.Id);

        // 3. GET /classes/{classId}
        var singleRes = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{created.Id}");
        Assert.NotNull(singleRes);
        Assert.Equal(created.Id, singleRes.Id);
        Assert.Equal(120, singleRes.TotalSeats);
        Assert.Equal(0, singleRes.HeldSeats);
        Assert.Equal(0, singleRes.ConfirmedSeats);
        Assert.Equal(120, singleRes.AvailableSeats);

        // 4. POST /classes/{classId}/holds
        var studentId = "20152691234567890";
        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdRes = await _client.SendAsync(holdReq);
        Assert.Equal(HttpStatusCode.Created, holdRes.StatusCode);
        var holdData = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(holdData);
        Assert.False(string.IsNullOrWhiteSpace(holdData.HoldId));
        Assert.Equal(created.Id, holdData.ClassId);
        Assert.Equal(studentId, holdData.StudentId);
        Assert.Equal("HELD", holdData.Status);
        Assert.True(holdData.ExpiresAt > DateTime.UtcNow);

        // 5. GET /holds/{holdId}
        var getHoldRes = await _client.GetFromJsonAsync<HoldResponse>($"/holds/{holdData.HoldId}");
        Assert.NotNull(getHoldRes);
        Assert.Equal(holdData.HoldId, getHoldRes.HoldId);
        Assert.Equal(created.Id, getHoldRes.ClassId);
        Assert.Equal("HELD", getHoldRes.Status);

        // 6. POST /holds/{holdId}/confirm
        var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdData.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", studentId);
        var confirmRes = await _client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        var confirmData = await confirmRes.Content.ReadFromJsonAsync<ConfirmResponse>();
        Assert.NotNull(confirmData);
        Assert.Equal(holdData.HoldId, confirmData.HoldId);
        Assert.Equal("CONFIRMED", confirmData.Status);

        // 7. GET /me/holds
        var meReq = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        meReq.Headers.Add("X-Student-Id", studentId);
        var meRes = await _client.SendAsync(meReq);
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);
        var myHolds = await meRes.Content.ReadFromJsonAsync<List<StudentHoldResponse>>();
        Assert.NotNull(myHolds);
        Assert.Single(myHolds);
        Assert.Equal("CONFIRMED", myHolds[0].Status);
        Assert.Equal("Class 6 - Morning Shift", myHolds[0].ClassName);

        // 8. DELETE /holds/{holdId}
        var student2 = "20152699999999999";
        var hold2Req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        hold2Req.Headers.Add("X-Student-Id", student2);
        var hold2Res = await _client.SendAsync(hold2Req);
        var hold2Data = await hold2Res.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(hold2Data);

        var delReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{hold2Data.HoldId}");
        delReq.Headers.Add("X-Student-Id", student2);
        var delRes = await _client.SendAsync(delReq);
        Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);
    }
}

