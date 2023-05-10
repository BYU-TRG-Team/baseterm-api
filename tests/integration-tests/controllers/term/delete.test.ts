import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests DeleteTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile({
      createPersonRefObject: false
    });

    const {
      termUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  test("should return a successful response and produce a 404 when requesting the term", async () => {
    const { status: deleteTermStatus } = await testApiClient
      .delete(`/termbase/${mockData.termbaseUUID}/term/${mockData.termUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteTermStatus).toBe(204);
	
    const { status: getTermStatus } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/term/${mockData.termUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getTermStatus).toBe(404);
  });
});