import { ExportEndpointResponse } from "@typings/responses";
import { v4 as uuid } from "uuid";
import { importTBXFile } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

describe("tests Export controller", () => {
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
    const termbaseUUID = await importTBXFile();

    const { status, body } = await testApiClient
      .get(`/export/${termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<ExportEndpointResponse>;

    expect(status).toBe(202);
    expect(body.sessionId).toBeDefined();
  });
});