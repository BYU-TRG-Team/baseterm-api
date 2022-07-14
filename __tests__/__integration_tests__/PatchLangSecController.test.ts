import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "../helpers";
import { PatchLangSecEndpointResponse } from "../../src/types/responses";
import { UUID } from "../../src/types";
import { describe } from "../../src/utils";
import { SuperAgentResponse } from "../types";
import { Role } from "@byu-trg/express-user-management";

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
	Role.Staff
);

describe("tests PatchLangSec controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
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
      langCode: "test",
      order: 100
    }) as SuperAgentResponse<PatchLangSecEndpointResponse>;

    expect(status).toBe(200);
    expect(body.xmlLang).toBe("test");
    expect(body.order).toBe(100);
});