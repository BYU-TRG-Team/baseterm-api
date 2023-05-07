import { generateJWT, importFile } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const jwt = generateJWT(
  Role.Admin
);

describe("tests DeleteTermbase controller", () => {
  test("should return a response with no content and remove termbase from DB", async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
    );

    // ensure that termbase exists
    const termbaseRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(termbaseRetrievalResponse.status).toBe(200);
    expect(termbaseRetrievalResponse.body.termbaseUUID).toBeDefined();

    const deleteTermbaseResponse = await testApiClient
      .delete(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(deleteTermbaseResponse.status).toBe(204);

    // ensure that termbase is deleted
    const termbasePostDeletionRetrievalResponse = await testApiClient
      .get(`/termbase/${termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(termbasePostDeletionRetrievalResponse.status).toBe(404);

  });
});