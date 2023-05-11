import { generateTestData } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PostLangSec controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/langSec`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
  });
  
  test("should return a 200 response for successful creation of a lang sec", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/langSec`)
      .field({
        entryUUID: testData.conceptEntry.uuid,
        langCode: "en-US",
        initialTerm: "TEST"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});