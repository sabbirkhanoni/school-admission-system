using System.Net;
using System.Net.Http.Json;
using SchoolAdmissionSystem.DTOs;
using Xunit;

namespace SchoolAdmissionSystem.Tests;

public class UnitTests : IClassFixture<TestFactory>
{
    private readonly HttpClient _client;

    public UnitTests(TestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task StudentIdValidation_MissingOrInvalid_ReturnsBadRequest()
    {
        // 1. Missing X-Student-Id header
        var requestWithoutHeader = new HttpRequestMessage(HttpMethod.Post, "/classes/c_test/holds");
        var responseWithoutHeader = await _client.SendAsync(requestWithoutHeader);
        Assert.Equal(HttpStatusCode.BadRequest, responseWithoutHeader.StatusCode);

        // 2. Invalid X-Student-Id (not 17 digits)
        var requestInvalidHeader = new HttpRequestMessage(HttpMethod.Post, "/classes/c_test/holds");
        requestInvalidHeader.Headers.Add("X-Student-Id", "12345");
        var responseInvalidHeader = await _client.SendAsync(requestInvalidHeader);
        Assert.Equal(HttpStatusCode.BadRequest, responseInvalidHeader.StatusCode);
    }

    [Fact]
    public async Task DuplicateActiveHold_SameStudentAndClass_ReturnsBadRequest()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 1 - Morning", 10));
        var createdClass = await classRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(createdClass);

        var studentId = "20152690000000001";

        // First hold succeeds
        var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        req1.Headers.Add("X-Student-Id", studentId);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Second hold by same student must fail with 400 Bad Request
        var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        req2.Headers.Add("X-Student-Id", studentId);
        var res2 = await _client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }

    [Fact]
    public async Task ConfirmHold_BelongingToAnotherStudent_ReturnsForbidden()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 2 - Day", 10));
        var createdClass = await classRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(createdClass);

        var student1 = "20152691111111111";
        var student2 = "20152692222222222";

        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", student1);
        var holdRes = await _client.SendAsync(holdReq);
        var holdData = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(holdData);

        // Student 2 tries to confirm student 1's hold
        var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdData.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", student2);
        var confirmRes = await _client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }

    [Fact]
    public async Task IdempotentConfirm_RepeatedCalls_KeepConfirmedSeatsCountUnchanged()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 3 - Evening", 10));
        var createdClass = await classRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(createdClass);

        var studentId = "20152693333333333";
        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdRes = await _client.SendAsync(holdReq);
        var holdData = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(holdData);

        // Confirm 1
        var confirmReq1 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdData.HoldId}/confirm");
        confirmReq1.Headers.Add("X-Student-Id", studentId);
        var confirmRes1 = await _client.SendAsync(confirmReq1);
        Assert.Equal(HttpStatusCode.OK, confirmRes1.StatusCode);

        // Confirm 2
        var confirmReq2 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdData.HoldId}/confirm");
        confirmReq2.Headers.Add("X-Student-Id", studentId);
        var confirmRes2 = await _client.SendAsync(confirmReq2);
        Assert.Equal(HttpStatusCode.OK, confirmRes2.StatusCode);

        // Verify seats in class: confirmed must be 1, not 2
        var classDetail = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{createdClass.Id}");
        Assert.NotNull(classDetail);
        Assert.Equal(1, classDetail.ConfirmedSeats);
        Assert.Equal(0, classDetail.HeldSeats);
    }

    [Fact]
    public async Task CancelHold_BelongingToAnotherStudent_ReturnsForbidden()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 4 - Security Test", 10));
        var createdClass = await classRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(createdClass);

        var student1 = "20152694444444444";
        var student2 = "20152695555555555";

        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", student1);
        var holdRes = await _client.SendAsync(holdReq);
        var holdData = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(holdData);

        // Student 2 tries to cancel student 1's hold
        var cancelReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{holdData.HoldId}");
        cancelReq.Headers.Add("X-Student-Id", student2);
        var cancelRes = await _client.SendAsync(cancelReq);
        Assert.Equal(HttpStatusCode.Forbidden, cancelRes.StatusCode);
    }
}

