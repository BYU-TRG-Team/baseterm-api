import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { fetchMockTermNote, generateJWT, importFile } from "../../../helpers";
import { PatchTermNoteEndpointResponse } from "../../../../src/types/responses";
import { TermNote, UUID } from "../../../../src/types";
import { VALID_LANGUAGE_CODE } from "../../../constants";
import { describe } from "../../../../src/utils";
import { SuperAgentResponse } from "../../../types";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
  termNote: TermNote,
};

const endpointConstructor = (
    termbaseUUID: UUID,
    termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
const jwt = generateJWT(
	Role.Staff
);

describe("tests PatchTermNote controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    const termNote = await fetchMockTermNote(
      termbaseUUID,
      requestClient
    );

    mockData = {
      termbaseUUID,
      termNote,
    };
  });

  afterAll(async () => {
		await handleShutDown();
	});
});

test("should return a 200 response for successful patch of term note", async () => {
	const { status, body} = await requestClient
    .patch(
      endpointConstructor(
        mockData.termbaseUUID,
        mockData.termNote.uuid
      )
    )
    .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
    .field({
      id: "Test",
      type: "Test",
      value: "Test",
      grpId: "Test1",
      datatype: "Test",
      langCode: VALID_LANGUAGE_CODE,
      order: 100,
    }) as SuperAgentResponse<PatchTermNoteEndpointResponse>;

  expect(status).toBe(200);
  expect(body.type).toBe("Test");
  expect(body.value).toBe("Test");
  expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
  expect(body.order).toBe(100);
});