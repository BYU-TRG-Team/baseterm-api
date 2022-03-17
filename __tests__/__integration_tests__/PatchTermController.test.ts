import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "../helpers";
import { PatchTermEndpointResponse } from "../../src/types/responses";
import { UUID } from "../../src/types";
import { describe } from "../../src/utils";
import { SuperAgentResponse } from "../types";
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

describe("tests PatchTerm controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
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