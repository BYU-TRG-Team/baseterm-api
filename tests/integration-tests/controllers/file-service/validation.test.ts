import { ValidationEndpointResponse } from "@typings/responses";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";
import { getTestAPIClient } from "@tests/helpers";

let testApiClient: TestAPIClient;

describe("tests Validation controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a response indicating a valid tbx file", async () => {
    const { status, body } = (
      await testApiClient.requestClient
        .post("/validate")
        .attach("tbxFile", `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`)
    ) as { status: number, body: ValidationEndpointResponse };


    expect(status).toBe(200); 
    expect(body.tbx).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await testApiClient.requestClient
      .post("/validate")
      .attach("tbxFile", `${APP_ROOT}/example-tbx/tbx-core-no-header.tbx`);

    expect(status).toBe(400);
    expect(body.error).toBe("TBX File is invalid: \nlxml.etree.DocumentInvalid: Did not expect element text there, line 4");
  });

  test("should return a response indicating an invalid body", async () => {
    const { status, body } = await testApiClient.requestClient
      .post("/validate");

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});