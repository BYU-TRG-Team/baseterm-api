import { generateTestData } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import errorMessages from "@messages/errors";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PostTerm controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/term`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/term`)
      .field({
        langSecUUID: testData.langSec.uuid,
        value: "TEST"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostLangSecEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
