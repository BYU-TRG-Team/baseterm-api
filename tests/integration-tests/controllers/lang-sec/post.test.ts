import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE} from "@tests/constants";
import { UUID } from "@typings";
import { TestAPIClientResponse } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests PostLangSec controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();
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
      .post(`/termbase/${mockData.termbaseUUID}/langSec`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
  });
  
  test("should return a 200 response for successful creation of a lang sec", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${mockData.termbaseUUID}/langSec`)
      .field({
        entryUUID: mockData.entryUUID,
        langCode: VALID_LANGUAGE_CODE,
        initialTerm: "Test"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostLangSecEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});