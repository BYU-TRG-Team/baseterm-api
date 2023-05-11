import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteLangSec controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response and produce a 404 when requesting the lang sec", async () => {
    const { status: deleteLangSecStatus } = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}/langSec/${testData.langSec.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteLangSecStatus).toBe(204);
	
    const { status: getLangSecStatus } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/langSec/${testData.langSec.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getLangSecStatus).toBe(404);
  });
});