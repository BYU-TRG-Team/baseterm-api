import { generateTestData } from "@tests/helpers";
import { GetLanguageSectionEndpointResponse } from "@typings/responses";
import testApiClient, { TEST_API_CLIENT_COOKIES }  from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests LanguageSection controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 404 response for malformed langSecUUID", async () => {      
    const { status } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/langSec/TEST`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/langSec/${testData.langSec.uuid}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetLanguageSectionEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.conceptEntry).toBeDefined();
    expect(body.xmlLang).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.auxElements).toBeDefined();
    expect(body.terms).toBeDefined();
  });
});