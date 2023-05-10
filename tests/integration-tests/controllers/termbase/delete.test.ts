import { importTBXFile } from "@tests/helpers";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

describe("tests DeleteTermbase controller", () => {
  test("should return a response with no content and remove termbase from DB", async () => {
    const termbaseUUID = await importTBXFile();

    // ensure that termbase exists
    const termbaseRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
    
    expect(termbaseRetrievalResponse.status).toBe(200);
    expect(termbaseRetrievalResponse.body.termbaseUUID).toBeDefined();

    const deleteTermbaseResponse = await testApiClient
      .delete(`/termbase/${termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(deleteTermbaseResponse.status).toBe(204);

    // ensure that termbase is deleted
    const termbasePostDeletionRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
    
    expect(termbasePostDeletionRetrievalResponse.status).toBe(404);

  });
});