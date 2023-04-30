import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { ValidationEndpointResponse } from "@typings/responses";
import { APP_ROOT } from "@constants";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;

describe("tests Validation controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a response indicating a valid tbx file", async () => {
    const { status, body } = (
      await requestClient
        .post("/validate")
        .attach("tbxFile", `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`)
    ) as { status: number, body: ValidationEndpointResponse };


    expect(status).toBe(200); 
    expect(body.tbx).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await requestClient
      .post("/validate")
      .attach("tbxFile", `${APP_ROOT}/example-tbx/tbx-core-no-header.tbx`);

    expect(status).toBe(400);
    expect(body.error).toBe("TBX File is invalid: \nlxml.etree.DocumentInvalid: Did not expect element text there, line 4");
  });

  test("should return a response indicating an invalid body", async () => {
    const { status, body } = await requestClient
      .post("/validate");

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});