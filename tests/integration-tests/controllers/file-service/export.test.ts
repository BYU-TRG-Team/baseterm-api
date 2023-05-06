import { ExportEndpointResponse } from "@typings/responses";
import { v4 as uuid } from "uuid";
import { generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;

describe("tests Export controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a response indicating no termbase resource (supplying unknown uuid)", async () => {
    const { status, body } = await testApiClient.requestClient
      .get(`/export/${uuid()}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating no termbase resource (supplying malformed UUID)", async () => {
    const { status, body } = await testApiClient.requestClient
      .get("/export/randommmmmmmm")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating a successful export request", async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient,
    );

    const { status: exportStatus, body: exportBody } = (
      await testApiClient.requestClient
        .get(`/export/${termbaseUUID}`) 
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: ExportEndpointResponse };

    expect(exportStatus).toBe(202);
    expect(exportBody.sessionId).toBeDefined();
  });
});