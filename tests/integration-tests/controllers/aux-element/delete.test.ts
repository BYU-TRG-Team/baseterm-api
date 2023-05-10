import { fetchMockAuxElement, importTBXFile } from "@tests/helpers";
import { AuxElement, UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests DeleteAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();
    const auxElement = await fetchMockAuxElement(
      termbaseUUID,
      testApiClient,
    );

    mockData = Object.freeze({
      termbaseUUID,
      auxElement,
    });
  });

  test("should return a successful response and produce a 404 when requesting the aux element", async () => {
    const { status: deleteAuxElementStatus } = await testApiClient
      .delete(`/termbase/${mockData.termbaseUUID}/auxElement/${mockData.auxElement.uuid}`)
      .field({
        elementType: mockData.auxElement.elementType,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteAuxElementStatus).toBe(204);
	
    const { status: getAuxElementStatus } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}/auxElement/${mockData.auxElement.uuid}`);
	
    expect(getAuxElementStatus).toBe(404);
  });
});