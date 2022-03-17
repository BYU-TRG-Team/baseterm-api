import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "../helpers";
import { UUID } from "../../src/types";
import { describe } from "../../src/utils";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteTerm controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
    );

    const {
    	termUUID
    } = await fetchMockTermbaseData(
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
	})
});

test("should return a successful response and produce a 404 when requesting the term", async () => {
	const { status: deleteTermStatus } = await requestClient
		.delete(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.termUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(deleteTermStatus).toBe(204);

	const { status: getTermStatus } = await requestClient
	  .get(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.termUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(getTermStatus).toBe(404);
});