import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PatchLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import { TestAPIClientResponse } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests PatchLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    const {
      langSecUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      langSecUUID,
    };
  });

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/langSec/${mockData.langSecUUID}`)
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