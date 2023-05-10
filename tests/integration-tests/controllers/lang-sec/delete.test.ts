import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests DeleteLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();
    const {
      langSecUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      langSecUUID,
    };
  });

  test("should return a successful response and produce a 404 when requesting the lang sec", async () => {
    const { status: deleteLangSecStatus } = await testApiClient
      .delete(`/termbase/${mockData.termbaseUUID}/langSec/${mockData.langSecUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteLangSecStatus).toBe(204);
	
    const { status: getLangSecStatus } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/langSec/${mockData.langSecUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getLangSecStatus).toBe(404);
  });
});