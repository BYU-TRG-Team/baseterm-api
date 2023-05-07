import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { GetEntryEndpointResponse, } from "@typings/responses";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const jwt = generateJWT(
  Role.User
);
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests GetEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {  
    const { status, body } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.languageSections).toBeDefined(),
    expect(body.auxElements).toBeDefined();
  });
});