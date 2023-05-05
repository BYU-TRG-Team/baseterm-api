import  constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    entryUUID: UUID,
) => `/termbase/${termbaseUUID}/entry/${entryUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteEntry controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      requestClient
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
	})

	test("should return a successful response and produce a 404 when requesting the entry", async () => {
		const { status: deleteEntryStatus } = await requestClient
			.delete(
				endpointConstructor(
					mockData.termbaseUUID,
					mockData.entryUUID
				)
			)
			.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
	
		expect(deleteEntryStatus).toBe(204);
	
		const { status: getEntryStatus } = await requestClient
			.get(
				endpointConstructor(
					mockData.termbaseUUID,
					mockData.entryUUID
				)
			)
			.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
	
		expect(getEntryStatus).toBe(404);
	});
});