import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestData } from "@tests/types";

let testData: TestData;

describe("tests DeleteAuxElement controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response and produce a 404 when requesting the aux element", async () => {
    const { status: deleteAuxElementStatus } = await testApiClient
      .delete(`/termbase/${testData.termbaseUUID}/auxElement/${testData.auxElement.uuid}`)
      .field({
        elementType: testData.auxElement.elementType,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
	
    expect(deleteAuxElementStatus).toBe(204);
	
    const { status: getAuxElementStatus } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/auxElement/${testData.auxElement.uuid}`);
	
    expect(getAuxElementStatus).toBe(404);
  });
});