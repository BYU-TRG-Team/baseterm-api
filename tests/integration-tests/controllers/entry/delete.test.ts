import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests DeleteEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();
    const {
      entryUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      entryUUID,
    };
  });

  test("should return a successful response and produce a 404 when requesting the entry", async () => {
    const { status: deleteEntryStatus } = await testApiClient
      .delete(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteEntryStatus).toBe(204);
	
    const { status: getEntryStatus } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getEntryStatus).toBe(404);
  });
});