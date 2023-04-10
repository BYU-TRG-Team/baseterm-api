import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockAuxElement, generateJWT, importFile } from "../../../helpers";
import { PatchAuxElementEndpointResponse } from "../../../../src/types/responses";
import { AuxElement, UUID } from "../../../../src/types";
import { SuperAgentResponse } from "../../../types";
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

describe("tests PatchAuxElement controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
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

  test("should return a successful response for successful patch of an aux element", async () => {
    const { status, body } = await requestClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid,
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        elementType: mockData.auxElement.elementType,
        id: "Test",
        order: 100,
      }) as SuperAgentResponse<PatchAuxElementEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("Test");
    expect(body.order).toBe(100);
  });
});