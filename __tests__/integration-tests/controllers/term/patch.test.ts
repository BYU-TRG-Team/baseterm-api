import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PatchTermEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { uuid } from "uuidv4";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

const personId = uuid();
const endpointConstructor = (
    termbaseUUID: UUID,
    termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
const jwt = generateJWT(
	Role.Staff,
  personId,
);

describe("tests PatchTerm controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient,
      uuid(),
      personId,
    );

    const { termUUID } = await fetchMockTermbaseData(
			termbaseUUID,
			requestClient,
		);

		mockData = {
			termbaseUUID,
			termUUID
		};
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body} = await requestClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termUUID
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        value: "Test",
        id: "Test",
        termSecId: "Test1",
        order: 100,
      }) as SuperAgentResponse<PatchTermEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("Test");
    expect(body.value).toBe("Test");
    expect(body.termSecId).toBe("Test1");
    expect(body.order).toBe(100);
  });
});