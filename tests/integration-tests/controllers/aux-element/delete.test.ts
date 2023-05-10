import { fetchMockAuxElement, importTBXFile } from "@tests/helpers";
import { AuxElement, UUID } from "@typings";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

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
    const termbaseUUID = await importTBXFile(testApiClient);

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
	
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