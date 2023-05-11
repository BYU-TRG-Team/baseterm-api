import { generateTestData } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { TbxElement } from "@typings";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 200 response for successful post of aux element", async () => {
    const { status } = await testApiClient
      .post(`/termbase/${testData.termbaseUUID}/auxElement`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        parentUUID: testData.term.uuid,
        parentElementType: TbxElement.Term,
        value: "Test",
        elementType: TbxElement.Note,
      }) as TestAPIClientResponse<PostAuxElementEndpointResponse>;
      
    expect(status).toBe(200);
  });
});