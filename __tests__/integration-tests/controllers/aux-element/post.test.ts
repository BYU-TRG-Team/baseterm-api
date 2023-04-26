import "dotenv/config";
import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { UUID, TbxElement } from "@typings";
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
) => `/termbase/${termbaseUUID}/auxElement`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    const {
      termUUID,
    } = await fetchMockTermbaseData(
      termbaseUUID,
      requestClient
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 200 response for successful post of aux element", async () => {
    const { status } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        parentUUID: mockData.termUUID,
        parentElementType: TbxElement.Term,
        value: "Test",
        elementType: TbxElement.Note,
      }) as SuperAgentResponse<PostAuxElementEndpointResponse>;
      
      expect(status).toBe(200);
  });
});