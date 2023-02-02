import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "../helpers";
import { PatchLangSecEndpointResponse } from "../../src/types/responses";
import { VALID_LANGUAGE_CODE } from "../constants";
import { UUID } from "../../src/types";
import { describe } from "../../src/utils";
import { SuperAgentResponse } from "../types";
import { Role } from "@byu-trg/express-user-management";
import { uuid } from "uuidv4";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

const personId = uuid();
const endpointConstructor = (
    termbaseUUID: UUID,
    langSecUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec/${langSecUUID}`;
const jwt = generateJWT(
	Role.Staff,
  personId
);

describe("tests PatchLangSec controller", async () => {
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

    const {
    	langSecUUID
    } = await fetchMockTermbaseData(
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
});

test("should return a 200 response for successful patch of term", async () => {
	const { status, body } = await requestClient
		.patch(
      endpointConstructor(
        mockData.termbaseUUID,
        mockData.langSecUUID
      )
    )
    .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
    .field({
      langCode: VALID_LANGUAGE_CODE,
      order: 100
    }) as SuperAgentResponse<PatchLangSecEndpointResponse>;

    expect(status).toBe(200);
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
});