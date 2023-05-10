import { fetchMockTermbaseData, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

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
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
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

  test("should return a successful response and produce a 404 when requesting the entry", async () => {
    const { status: deleteEntryStatus } = await testApiClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
	
    expect(deleteEntryStatus).toBe(204);
	
    const { status: getEntryStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.entryUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
	
    expect(getEntryStatus).toBe(404);
  });
});