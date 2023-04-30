import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockAuxElement, generateJWT, importFile } from "@tests/helpers";
import { PatchAuxElementEndpointResponse } from "@typings/responses";
import { AuxElement, UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

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
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
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