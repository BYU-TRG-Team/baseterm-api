import { importTBXFile } from "@tests/helpers";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

describe("tests DeleteTermbase controller", () => {
  test("should return a response with no content and remove termbase from DB", async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

    // ensure that termbase exists
    const termbaseRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
    
    expect(termbaseRetrievalResponse.status).toBe(200);
    expect(termbaseRetrievalResponse.body.termbaseUUID).toBeDefined();

    const deleteTermbaseResponse = await testApiClient
      .delete(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);

    expect(deleteTermbaseResponse.status).toBe(204);

    // ensure that termbase is deleted
    const termbasePostDeletionRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
    
    expect(termbasePostDeletionRetrievalResponse.status).toBe(404);

  });
});