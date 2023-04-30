import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE} from "@tests/constants";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { uuid } from "uuidv4";
import { APP_ROOT } from "@constants";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

const personId = uuid();
const endpointConstructor = (
    termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec`;
const jwt = generateJWT(
	Role.Staff,
  personId
);

describe("tests PostLangSec controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      requestClient,
      uuid(),
      personId
    );

    const {
    	entryUUID
    } = await fetchMockTermbaseData(
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

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
  });
  
  test("should return a 200 response for successful creation of a lang sec", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        entryUUID: mockData.entryUUID,
        langCode: VALID_LANGUAGE_CODE,
        initialTerm: "Test"
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      SuperAgentResponse<PostLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});