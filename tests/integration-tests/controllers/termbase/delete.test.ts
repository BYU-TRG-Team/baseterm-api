import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteTermbase controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a response with no content and remove termbase from DB", async () => {
    // ensure that termbase exists
    const termbaseRetrievalResponse = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
    
    expect(termbaseRetrievalResponse.status).toBe(200);
    expect(termbaseRetrievalResponse.body.termbaseUUID).toBeDefined();

    const deleteTermbaseResponse = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(deleteTermbaseResponse.status).toBe(204);

    // ensure that termbase is deleted
    const termbasePostDeletionRetrievalResponse = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
    
    expect(termbasePostDeletionRetrievalResponse.status).toBe(404);

  });
});