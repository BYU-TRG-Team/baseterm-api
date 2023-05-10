import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PatchLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  langSecUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec/${langSecUUID}`;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests PatchLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

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
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.langSecUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
      .field({
        langCode: VALID_LANGUAGE_CODE,
        order: 100
      }) as SuperAgentResponse<PatchLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
  });
});