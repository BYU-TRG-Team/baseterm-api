import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { fetchMockTermbaseData, generateJWT, importFile } from "../../../helpers";
import { PatchEntryEndpointResponse } from "../../../../src/types/responses";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "../../../../src/types";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

const personId = uuid();
const jwt = generateJWT(
	Role.Staff,
  personId,
);

describe("tests PatchEntry controller", () => {
  beforeAll(async () => { 
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient,
      uuid(),
      personId,
    );

    const { entryUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      requestClient,
    );

		mockData = {
			termbaseUUID,
			entryUUID,
		};
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/testtt`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a 404 for random uuid", async () => {
    const { status } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${uuid()}`)
      .field({
        id: "TEST"
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {
    const { status, body } = await requestClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`)
      .field({
        id: "TEST",
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.termbaseUUID).toBeDefined();
    expect(body.uuid).toBeDefined();
  });
});