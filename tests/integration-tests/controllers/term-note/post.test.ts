import { PostTermNoteEndpointResponse } from "@typings/responses";
import { generateTestData } from "@tests/helpers";
import errorMessages from "@messages/errors";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PostTermNote controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });


  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/termNote`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term note", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/termNote`)
      .field({
        termUUID: testData.term.uuid,
        value: "Test",
        type: "Test",
        isGrp: false,
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});