import { ExportEndpointResponse } from "@typings/responses";
import { v4 as uuid } from "uuid";
import { importTBXFile } from "@tests/helpers";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";


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
    const termbaseUUID = await importTBXFile(testApiClient);

    const { status: exportStatus, body: exportBody } = (
      await testApiClient
        .get(`/export/${termbaseUUID}`) 
        .set("Cookie", TEST_API_CLIENT_COOKIES)
    ) as { status: number, body: ExportEndpointResponse };

    expect(exportStatus).toBe(202);
    expect(exportBody.sessionId).toBeDefined();
  });
});