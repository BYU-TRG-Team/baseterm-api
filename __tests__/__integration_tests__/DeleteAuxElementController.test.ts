import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockAuxElement, generateJWT, importFile } from "../helpers";
import { AuxElement, UUID } from "../../src/types";
import { describe } from "../../src/utils";
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

describe("tests DeleteAuxElement controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
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

  afterAll(async () => {
		await handleShutDown();
	});
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