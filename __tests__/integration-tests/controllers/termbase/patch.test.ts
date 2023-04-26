import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { generateJWT, importFile } from "../../../helpers";
import {
  GetTermbaseEndpointResponse,
  PatchTermbaseEndpointResponse
} from "../../../../src/types/responses";
import { UUID } from "../../../../src/types";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
};
const jwt = generateJWT(
	Role.Staff
);

describe("tests PatchTermbase controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    mockData = {
      termbaseUUID,
    }
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await requestClient
      .patch("/termbase/randommmmm")
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a 404 due to random uuid", async () => {
    const { status } = await requestClient
      .patch(`/termbase/${uuid()}`)
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response with no updates", async () => {
    const { body: termbaseResponse } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };
      
    const { body: updatedTermbaseResponse } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(termbaseResponse.name);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should return a successful response with an updated name", async () => {
    const { body: termbaseResponse } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };

    const updatedTermbaseName = uuid();

    const { body: updatedTermbaseResponse } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .field({
        name: updatedTermbaseName,
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(updatedTermbaseName);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should disable enforcement of TBX-Basic, only update dialect if enforcement is disabled, and not allow reversion", async () => {
    const { body: updatedTermbaseResponse } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: false,
        type: "Test",
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(updatedTermbaseResponse.type).toBe("TBX-Basic");

    const { body: secondUpdatedTermbaseResponse } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: true,
        type: "Test"
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(secondUpdatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(secondUpdatedTermbaseResponse.type).toBe("Test");
  });

  test("should return a 409 for duplicate name", async () => {
    const firstTermbaseName = uuid();
    await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient,
      firstTermbaseName,
    );

    await requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };


    const { status } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        name: firstTermbaseName,
      });

    expect(status).toBe(409);
  });
});