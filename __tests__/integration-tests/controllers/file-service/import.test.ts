import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { ImportEndpointResponse } from "@typings/responses";
import { generateJWT } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
const jwt = generateJWT(
	Role.Staff
);

describe("tests Import controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a response indicating a tbx file has successfully started importing", async () => {
    const { status, body } = (
      await requestClient
        .post("/import")
        .attach("tbxFile", `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`)
        .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
        .field({ name: uuid()})

    ) as { status: number, body: ImportEndpointResponse };

    expect(status).toBe(202);
    expect(body.sessionId).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await requestClient
      .post("/import")
      .attach("tbxFile", `${process.env.APP_DIR}/example-tbx/tbx-core-no-header.tbx`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({ name: uuid()});

    expect(status).toBe(400);
    expect(body.error).toBe("TBX File is invalid: \nlxml.etree.DocumentInvalid: Did not expect element text there, line 4"); 
  });

  test("should return a response indicating an invalid body (no name field supplied)", async () => {
    const { status } = await requestClient
      .post("/import")
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .attach("tbxFile", `${process.env.APP_DIR}/example-tbx/tbx-core-no-header.tbx`);

    expect(status).toBe(400);
  });

  test("should return a response indicating an invalid body (no tbxFile supplied)", async () => {
    const { status, body } = await requestClient
      .post("/import")
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({ name: uuid()});

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});