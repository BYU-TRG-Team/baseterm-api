import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  entryUUID: UUID,
) => `/termbase/${termbaseUUID}/entry/${entryUUID}`;
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};

describe("tests DeleteEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

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

  test("should return a successful response and produce a 404 when requesting the entry", async () => {
    const { status: deleteEntryStatus } = await testApiClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteEntryStatus).toBe(204);
	
    const { status: getEntryStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(getEntryStatus).toBe(404);
  });
});