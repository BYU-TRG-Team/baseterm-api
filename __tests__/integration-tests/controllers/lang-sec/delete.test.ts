import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "../../../helpers";
import { UUID } from "../../../../src/types";
import { describe } from "../../../../src/utils";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    langSecUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec/${langSecUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteLangSec controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
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

test("should return a successful response and produce a 404 when requesting the lang sec", async () => {
	const { status: deleteLangSecStatus } = await requestClient
		.delete(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.langSecUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(deleteLangSecStatus).toBe(204);

	const { status: getLangSecStatus } = await requestClient
	  .get(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.langSecUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(getLangSecStatus).toBe(404);
});