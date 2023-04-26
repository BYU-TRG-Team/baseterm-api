import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { PostTermNoteEndpointResponse } from "@typings/responses";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/termNote`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests PostTermNote controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
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
	});

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term note", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        termUUID: mockData.termUUID,
        value: "Test",
        type: "Test",
        isGrp: false,
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      SuperAgentResponse<PostTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  })
});