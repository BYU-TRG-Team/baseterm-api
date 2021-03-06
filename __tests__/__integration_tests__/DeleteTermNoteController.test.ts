import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import {  fetchMockTermNote, generateJWT, importFile } from "../helpers";
import { UUID } from "../../src/types";
import { describe } from "../../src/utils";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termNoteUUID: UUID,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests DeleteTermNote controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
    );

    const termNote = await fetchMockTermNote(
			termbaseUUID,
			requestClient,
		);

		mockData = {
			termbaseUUID,
			termNoteUUID: termNote.uuid
		};
  });

  afterAll(async () => {
		await handleShutDown();
	});
});

test("should return a successful response and produce a 404 when requesting the term note", async () => {
	const { status: deleteTermNoteStatus } = await requestClient
		.delete(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.termNoteUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(deleteTermNoteStatus).toBe(204);

	const { status: getTermNoteStatus } = await requestClient
	  .get(
			endpointConstructor(
				mockData.termbaseUUID,
				mockData.termNoteUUID
			)
		)
		.set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

	expect(getTermNoteStatus).toBe(404);
});