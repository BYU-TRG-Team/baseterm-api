import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { 
  fetchMockTermbaseData, 
  generateJWT, 
  importFile 
} from "@tests/helpers";
import { GetLanguageSectionEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};
const jwt = generateJWT(
	Role.User
);

describe("tests LanguageSection controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    const { langSecUUID } = await fetchMockTermbaseData(
			termbaseUUID,
			requestClient,
		);

		mockData = {
			termbaseUUID,
			langSecUUID,
		};
  });

  afterAll(async () => {
    await handleShutDown();
  });

  test("should return a 404 response for malformed langSecUUID", async () => {      
    const { status } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/langSec/randommmm`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/langSec/${mockData.langSecUUID}`) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as
      { body: GetLanguageSectionEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.conceptEntry).toBeDefined();
    expect(body.xmlLang).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.auxElements).toBeDefined();
    expect(body.terms).toBeDefined();
  });
});