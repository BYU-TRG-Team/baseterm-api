import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteEntry controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response and produce a 404 when requesting the entry", async () => {
    const { status: deleteEntryStatus } = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}/entry/${testData.conceptEntry.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteEntryStatus).toBe(204);
	
    const { status: getEntryStatus } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/entry/${testData.conceptEntry.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getEntryStatus).toBe(404);
  });
});