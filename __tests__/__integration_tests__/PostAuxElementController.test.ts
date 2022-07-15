import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockAuxElement, fetchMockTermbaseData, fetchMockTermNote, generateJWT, importFile } from "../helpers";
import { PostAuxElementEndpointResponse } from "../../src/types/responses";
import { UUID, TbxElement, AuxElement } from "../../src/types";
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
    termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/auxElement`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests PostAuxElement controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
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