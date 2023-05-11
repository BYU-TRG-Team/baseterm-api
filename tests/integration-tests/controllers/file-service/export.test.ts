import { ExportEndpointResponse } from "@typings/responses";
import { v4 as uuid } from "uuid";
import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests Export controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });
  
  test("should return a response indicating no termbase resource (supplying unknown uuid)", async () => {
    const { status, body } = await testApiClient
      .get(`/export/${uuid()}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating no termbase resource (supplying malformed UUID)", async () => {
    const { status, body } = await testApiClient
      .get("/export/randommmmmmmm")
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating a successful export request", async () => {
    const { status, body } = await testApiClient
      .get(`/export/${testData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<ExportEndpointResponse>;

    expect(status).toBe(202);
    expect(body.sessionId).toBeDefined();
  });
});