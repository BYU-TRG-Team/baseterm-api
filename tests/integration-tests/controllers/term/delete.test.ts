import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteTerm controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response and produce a 404 when requesting the term", async () => {
    const { status: deleteTermStatus } = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}/term/${testData.term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteTermStatus).toBe(204);
	
    const { status: getTermStatus } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/term/${testData.term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getTermStatus).toBe(404);
  });
});