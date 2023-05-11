import { generateTestData } from "@tests/helpers";
import { PostPersonRefObjectEndpointResponse } from "@typings/responses";
import errorMessages from "@messages/errors";
import { TestAPIClientResponse, TestData } from "@tests/types";
import { v4 as uuid } from "uuid";
import testApiClient, { TEST_API_CLIENT_COOKIES, TEST_USER_ID } from "@tests/test-api-client";

let testData: TestData;

describe("tests PostPersonRefObject controller", () => {
  beforeAll(async () => {
    testData = await generateTestData({
      createPersonRefObject: false
    });
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/personRefObject`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });

  test("should return a 400 response for user id mismatch", async () => {
    const userId = uuid();
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/personRefObject`)
      .field({
        name: "TEST",
        email: "TEST",
        role: "TEST",
        id: userId,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.userIdMismatch);
  });
  
  test("should return a 200 response for successful creation of a person object", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/personRefObject`)
      .field({
        name: "TEST",
        email: "TEST",
        role: "TEST",
        id: TEST_USER_ID
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostPersonRefObjectEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
