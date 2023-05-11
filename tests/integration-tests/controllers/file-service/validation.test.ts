import { ValidationEndpointResponse } from "@typings/responses";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";
import { INVALID_TEST_TBX_FILE } from "@tests/constants";

describe("tests Validation controller", () => {
  test("should return a response indicating a valid tbx file", async () => {
    const { status, body } = await testApiClient
      .post("/validate")
      .attach("tbxFile", `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`) as TestAPIClientResponse<ValidationEndpointResponse>;


    expect(status).toBe(200); 
    expect(body.tbx).toBeDefined();
  });

  test("should return a response indicating an invalid tbx (no header)", async () => {
    const { status, body } = await testApiClient
      .post("/validate")
      .attach("tbxFile", INVALID_TEST_TBX_FILE);

    expect(status).toBe(400);
    expect(body.error).toBe("TBX File is invalid: \nlxml.etree.DocumentInvalid: Did not expect element text there, line 4");
  });

  test("should return a response indicating an invalid body", async () => {
    const { status, body } = await testApiClient
      .post("/validate");

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});