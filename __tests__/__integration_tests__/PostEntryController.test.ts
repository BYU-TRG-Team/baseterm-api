import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { generateJWT, importFile } from "../helpers";
import { PostEntryEndpointResponse } from "../../src/types/responses";
import { UUID } from "../../src/types";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID
};
const jwt = generateJWT(
	Role.Staff
);

describe("tests PostEntry controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
    );

    mockData = {
      termbaseUUID,
    }
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 400 response for invalid body", async () => {
    const { status } = await requestClient
      .post("/termbase/randommmmmmmm/entry")
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(status).toBe(400);
  });

  test("should return a 404 response for malformed termbaseUUID", async () => {  
    const { status } = await requestClient
      .post("/termbase/randommmmmmmm/entry")
      .send({
        entryId: "test",
        initialLanguageSection: "test",
        initialTerm: "test",
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a 409 response for duplicate concept entry id", async () => {    
    const { status } = await requestClient
      .post(`/termbase/${mockData.termbaseUUID}/entry`)
      .send({
        entryId: "c5", 
        initialLanguageSection: "test",
        initialTerm: "test",
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(409);
  });

  test("should return a successfull response with an entry id", async () => {  
    const { status, body } = await requestClient
      .post(`/termbase/${mockData.termbaseUUID}/entry`)
      .send({
        entryId: "c0293409", 
        initialLanguageSection: "test",
        initialTerm: "test",
      }) 
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PostEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});