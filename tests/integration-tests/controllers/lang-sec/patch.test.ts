import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PatchLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const personId = uuid();
const jwt = generateJWT(
  Role.Staff,
  personId
);
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
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
      uuid(),
      personId,
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

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body } = await testApiClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.langSecUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        langCode: VALID_LANGUAGE_CODE,
        order: 100
      }) as SuperAgentResponse<PatchLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
  });
});