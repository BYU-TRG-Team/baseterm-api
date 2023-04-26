import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockAuxElement, generateJWT, importFile } from "@tests/helpers";
import { AuxElement, UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteAuxElement controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    const auxElement = await fetchMockAuxElement(
			termbaseUUID,
			requestClient,
		);

		mockData = {
			termbaseUUID,
			auxElement,
		};
  });

	test("should return a successful response and produce a 404 when requesting the aux element", async () => {
		const { status: deleteAuxElementStatus } = await requestClient
			.delete(
				endpointConstructor(
					mockData.termbaseUUID,
					mockData.auxElement.uuid,
				)
			)
			.field({
				elementType: mockData.auxElement.elementType,
			})
			.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
	
		expect(deleteAuxElementStatus).toBe(204);
	
		const { status: getAuxElementStatus } = await requestClient
			.get(
				endpointConstructor(
					mockData.termbaseUUID,
					mockData.auxElement.uuid
				)
			);
	
		expect(getAuxElementStatus).toBe(404);
	});

  afterAll(async () => {
		await handleShutDown();
	});
});