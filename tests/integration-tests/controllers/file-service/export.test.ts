import supertest, { SuperAgentTest } from "supertest";
import { ExportEndpointResponse } from "@typings/responses";
import express from "express";
import { v4 as uuid } from "uuid";
import { generateJWT, importFile } from "@tests/helpers";
import constructServer from "@app";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

let handleShutDown: () => Promise<void>;
let requestClient: SuperAgentTest;
const jwt = generateJWT(
	Role.Staff
);

describe("tests Export controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a response indicating no termbase resource (supplying unknown uuid)", async () => {
    const { status, body } = await requestClient
      .get(`/export/${uuid()}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating no termbase resource (supplying malformed UUID)", async () => {
    const { status, body } = await requestClient
      .get("/export/randommmmmmmm")
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response indicating a successful export request", async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      requestClient,
    );

    const { status: exportStatus, body: exportBody } = (
      await requestClient
        .get(`/export/${termbaseUUID}`) 
        .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: ExportEndpointResponse };

    expect(exportStatus).toBe(202);
    expect(exportBody.sessionId).toBeDefined();
  });
});