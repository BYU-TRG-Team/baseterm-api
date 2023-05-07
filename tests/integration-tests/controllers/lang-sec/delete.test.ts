import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const endpointConstructor = (
  termbaseUUID: UUID,
  langSecUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec/${langSecUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests DeleteLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteLangSecStatus).toBe(204);
	
    const { status: getLangSecStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.langSecUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(getLangSecStatus).toBe(404);
  });
});