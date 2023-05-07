import { fetchMockTermNote, generateJWT, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const endpointConstructor = (
  termbaseUUID: UUID,
  termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let mockData: {
  termbaseUUID: UUID,
  termNoteUUID: UUID,
};

describe("tests DeleteTermNote controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

    const termNote = await fetchMockTermNote(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      termNoteUUID: termNote.uuid
    };
  });

  test("should return a successful response and produce a 404 when requesting the term note", async () => {
    const { status: deleteTermNoteStatus } = await testApiClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNoteUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteTermNoteStatus).toBe(204);
	
    const { status: getTermNoteStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNoteUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(getTermNoteStatus).toBe(404);
  });
});