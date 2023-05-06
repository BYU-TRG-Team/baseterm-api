import { v4 as uuid } from "uuid";
import { ImportEndpointResponse } from "@typings/responses";
import { generateJWT, getTestAPIClient } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

let testApiClient: TestAPIClient;
const jwt = generateJWT(
  Role.Staff
);

describe("tests Import controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a response indicating a tbx file has successfully started importing", async () => {
    const { status, body } = (
      await testApiClient.requestClient
        .post("/import")
        .attach("tbxFile", `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`)
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
        .field({ name: uuid()})

    ) as { status: number, body: ImportEndpointResponse };

    expect(status).toBe(202);
    expect(body.sessionId).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await testApiClient.requestClient
      .post("/import")
      .attach("tbxFile", `${APP_ROOT}/example-tbx/tbx-core-no-header.tbx`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({ name: uuid()});

    expect(status).toBe(400);
    expect(body.error).toBe("TBX File is invalid: \nlxml.etree.DocumentInvalid: Did not expect element text there, line 4"); 
  });

  test("should return a response indicating an invalid body (no name field supplied)", async () => {
    const { status } = await testApiClient.requestClient
      .post("/import")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .attach("tbxFile", `${APP_ROOT}/example-tbx/tbx-core-no-header.tbx`);

    expect(status).toBe(400);
  });

  test("should return a response indicating an invalid body (no tbxFile supplied)", async () => {
    const { status, body } = await testApiClient.requestClient
      .post("/import")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({ name: uuid()});

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});