import { 
  fetchMockTermbaseData, 
  generateJWT, 
  getTestAPIClient, 
  importFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE} from "@tests/constants";
import { UUID } from "@typings";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";

const personId = uuid();
const jwt = generateJWT(
  Role.Staff,
  personId
);
const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/langSec`;
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests PostLangSec controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient,
      uuid(),
      personId
    );

    const {
      entryUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      entryUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
  });
  
  test("should return a 200 response for successful creation of a lang sec", async () => {
    const { status, body } = await testApiClient.requestClient
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