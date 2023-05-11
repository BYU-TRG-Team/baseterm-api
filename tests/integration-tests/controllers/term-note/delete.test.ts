import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteTermNote controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response and produce a 404 when requesting the term note", async () => {
    const { status: deleteTermNoteStatus } = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}/termNote/${testData.termNote.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteTermNoteStatus).toBe(204);
	
    const { status: getTermNoteStatus } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/termNote/${testData.termNote.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getTermNoteStatus).toBe(404);
  });
});