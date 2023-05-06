import { fetchMockAuxElement, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { AuxElement, UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const endpointConstructor = (
  termbaseUUID: UUID,
  auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests DeleteAuxElement controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  beforeEach(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const auxElement = await fetchMockAuxElement(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      auxElement,
    };
  });

  test("should return a successful response and produce a 404 when requesting the aux element", async () => {
    const { status: deleteAuxElementStatus } = await testApiClient.requestClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid,
        )
      )
      .field({
        elementType: mockData.auxElement.elementType,
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteAuxElementStatus).toBe(204);
	
    const { status: getAuxElementStatus } = await testApiClient.requestClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid
        )
      );
	
    expect(getAuxElementStatus).toBe(404);
  });
});