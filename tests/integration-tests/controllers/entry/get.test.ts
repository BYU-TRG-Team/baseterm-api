import {  generateTestData } from "@tests/helpers";
import { GetEntryEndpointResponse, } from "@typings/responses";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests GetEntry controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 404 response for malformed entryUUID", async () => {      
    const { status } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/entry/randommmm`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/entry/${testData.entry.uuid}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetEntryEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.languageSections).toBeDefined(),
    expect(body.auxElements).toBeDefined();
  });
});