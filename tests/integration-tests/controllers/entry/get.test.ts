import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { GetEntryEndpointResponse, } from "@typings/responses";
import { UUID } from "@typings";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests GetEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

    const { entryUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      entryUUID,
    };
  });

  test("should return a 404 response for malformed entryUUID", async () => {      
    const { status } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/randommmm`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: GetEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.languageSections).toBeDefined(),
    expect(body.auxElements).toBeDefined();
  });
});