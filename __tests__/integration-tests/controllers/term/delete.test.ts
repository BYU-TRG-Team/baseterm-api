import constructServer from "@app";
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
  termUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteTerm controller", () => {
  beforeAll(async () => {
    const app = express();
		handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
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
});