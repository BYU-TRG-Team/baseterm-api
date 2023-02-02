import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { GetTermEndpointResponse } from "../../src/types/responses";
import { fetchMockTermbaseData, generateJWT, importFile } from "../helpers";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "../../src/types";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
}
const jwt = generateJWT(
	Role.User
);

describe("tests GetTerm controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
    );

    const { termUUID } = await fetchMockTermbaseData(
			termbaseUUID,
			requestClient,
		);

		mockData = {
			termbaseUUID,
			termUUID,
		};
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/${uuid()}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
   
    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });


  test("should return a 404 response for invalid uuid (malformed uuid)", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/randommmm`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a successful response", async () => {
    const termResponse = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/${mockData.termUUID}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as
      { status: number; body: GetTermEndpointResponse};

    expect(termResponse.status).toBe(200);
    expect(termResponse.body.uuid).toBeDefined();
    expect(termResponse.body.id).toBeDefined();
    expect(termResponse.body.value).toBeDefined();
    expect(termResponse.body.language).toBeDefined();
    expect(termResponse.body.termSecId).toBeDefined();
    expect(termResponse.body.termbaseUUID).toBeDefined();
    expect(termResponse.body.synonyms).toBeDefined();
    expect(termResponse.body.conceptId).toBeDefined();
    expect(termResponse.body.translations).toBeDefined();
    expect(termResponse.body.customers).toBeDefined();
    expect(termResponse.body.partOfSpeech).toBeDefined();
    expect(termResponse.body.approvalStatus).toBeDefined();
    expect(termResponse.body.subjectField).toBeDefined();
    expect(termResponse.body.conceptEntry).toBeDefined();
    expect(termResponse.body.languageSection).toBeDefined();
    expect(termResponse.body.auxElements).toBeDefined();
    expect(termResponse.body.termNotes).toBeDefined();
  });
});