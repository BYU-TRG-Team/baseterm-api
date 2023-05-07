import { 
  fetchMockTermbaseData, 
  generateJWT, 
  importFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE} from "@tests/constants";
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
) => `/termbase/${termbaseUUID}/langSec`;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests PostLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
      uuid(),
      personId
    );

    const {
      entryUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      entryUUID,
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
  });
  
  test("should return a 200 response for successful creation of a lang sec", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        entryUUID: mockData.entryUUID,
        langCode: VALID_LANGUAGE_CODE,
        initialTerm: "Test"
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      SuperAgentResponse<PostLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});