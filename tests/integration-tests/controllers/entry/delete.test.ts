import { fetchMockTermbaseData, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const endpointConstructor = (
  termbaseUUID: UUID,
  entryUUID: UUID,
) => `/termbase/${termbaseUUID}/entry/${entryUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests DeleteEntry controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
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

  test("should return a successful response and produce a 404 when requesting the entry", async () => {
    const { status: deleteEntryStatus } = await testApiClient.requestClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteEntryStatus).toBe(204);
	
    const { status: getEntryStatus } = await testApiClient.requestClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(getEntryStatus).toBe(404);
  });
});