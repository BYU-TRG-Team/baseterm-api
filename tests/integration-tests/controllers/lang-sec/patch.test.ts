import { generateTestData } from "@tests/helpers";
import { PatchLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PatchLangSec controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/langSec/${testData.langSec.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        langCode: VALID_LANGUAGE_CODE,
        order: 100
      }) as TestAPIClientResponse<PatchLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
  });
});