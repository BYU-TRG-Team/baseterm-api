import { PatchAuxElementEndpointResponse } from "@typings/responses";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { generateTestData } from "@tests/helpers";

let testData: TestData;

describe("tests PatchAuxElement controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a successful response for successful patch of an aux element", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/auxElement/${testData.auxElement.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        elementType: testData.auxElement.elementType,
        id: "TEST",
        order: 100,
      }) as TestAPIClientResponse<PatchAuxElementEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.order).toBe(100);
  });
});