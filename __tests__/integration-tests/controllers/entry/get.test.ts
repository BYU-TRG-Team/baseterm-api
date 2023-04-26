import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { GetEntryEndpointResponse, } from "@typings/responses";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";

let handleShutDown: () => Promise<void>;
let requestClient: SuperAgentTest;
const jwt = generateJWT(
	Role.User
);
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};


describe("tests GetEntry controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient
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

  test("should return a 404 response for malformed entryUUID", async () => {      
    const { status } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/randommmm`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.languageSections).toBeDefined(),
    expect(body.auxElements).toBeDefined();
  });
});