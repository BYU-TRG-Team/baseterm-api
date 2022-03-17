import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { ValidationEndpointResponse } from "../../src/types/responses";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;

describe("tests Validation controller", () => {
  beforeAll(() => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a response indicating a valid tbx file", async () => {
    const { status, body } = (
      await requestClient
        .post("/validate")
        .attach("tbxFile", `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`)
    ) as { status: number, body: ValidationEndpointResponse };


    expect(status).toBe(200); 
    expect(body.tbx).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await requestClient
      .post("/validate")
      .attach("tbxFile", `${process.env.APP_DIR}/example_tbx/tbx_core_no_header.tbx`);

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