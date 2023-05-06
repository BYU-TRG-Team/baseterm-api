import { fetchMockTermbaseData, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const endpointConstructor = (
  termbaseUUID: UUID,
  termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests DeleteTerm controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const {
      termUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a successful response and produce a 404 when requesting the term", async () => {
    const { status: deleteTermStatus } = await testApiClient.requestClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteTermStatus).toBe(204);
	
    const { status: getTermStatus } = await testApiClient.requestClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(getTermStatus).toBe(404);
  });
});