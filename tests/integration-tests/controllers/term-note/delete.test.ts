import { fetchMockTermNote, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  termNoteUUID: UUID,
};

describe("tests DeleteTermNote controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

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
      .delete(`/termbase/${mockData.termbaseUUID}/termNote/${mockData.termNoteUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteTermNoteStatus).toBe(204);
	
    const { status: getTermNoteStatus } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/termNote/${mockData.termNoteUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getTermNoteStatus).toBe(404);
  });
});