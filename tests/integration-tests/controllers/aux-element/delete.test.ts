import { fetchMockAuxElement, importTBXFile } from "@tests/helpers";
import { AuxElement, UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

const endpointConstructor = (
  termbaseUUID: UUID,
  auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests DeleteAuxElement controller", () => {
  beforeEach(async () => {
    const termbaseUUID = await importTBXFile();

    const auxElement = await fetchMockAuxElement(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      auxElement,
    };
  });

  test("should return a successful response and produce a 404 when requesting the aux element", async () => {
    const { status: deleteAuxElementStatus } = await testApiClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid,
        )
      )
      .field({
        elementType: mockData.auxElement.elementType,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteAuxElementStatus).toBe(204);
	
    const { status: getAuxElementStatus } = await testApiClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid
        )
      );
	
    expect(getAuxElementStatus).toBe(404);
  });
});