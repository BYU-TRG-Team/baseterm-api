import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { generateJWT, importFile } from "../../../helpers";
import { Role } from "@byu-trg/express-user-management";

let handleShutDown: () => Promise<void>;
let requestClient: SuperAgentTest;
const jwt = generateJWT(
	Role.Admin
);

describe("tests DeleteTermbase controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	})

  test("should return a response with no content and remove termbase from DB", async () => {
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient,
    );

    // ensure that termbase exists
    const termbaseRetrievalResponse = await requestClient
      .get(`/termbase/${termbaseUUID}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(termbaseRetrievalResponse.status).toBe(200);
    expect(termbaseRetrievalResponse.body.termbaseUUID).toBeDefined();

    const deleteTermbaseResponse = await requestClient
      .delete(`/termbase/${termbaseUUID}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(deleteTermbaseResponse.status).toBe(204);

    // ensure that termbase is deleted
    const termbasePostDeletionRetrievalResponse = await requestClient
      .get(`/termbase/${termbaseUUID}`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(termbasePostDeletionRetrievalResponse.status).toBe(404);

  });
});