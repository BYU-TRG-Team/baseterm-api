import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
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

describe("tests DeleteLangSec controller", () => {
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

  test("should return a successful response and produce a 404 when requesting the lang sec", async () => {
    const { status: deleteLangSecStatus } = await testApiClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.langSecUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
	
    expect(deleteLangSecStatus).toBe(204);
	
    const { status: getLangSecStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.langSecUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
	
    expect(getLangSecStatus).toBe(404);
  });
});