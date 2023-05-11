import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { UUID, TbxElement } from "@typings";
import { TestAPIClientResponse } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();
    const {
      termUUID,
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  test("should return a 200 response for successful post of aux element", async () => {
    const { status } = await testApiClient
      .post(`/termbase/${mockData.termbaseUUID}/auxElement`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        parentUUID: mockData.termUUID,
        parentElementType: TbxElement.Term,
        value: "Test",
        elementType: TbxElement.Note,
      }) as TestAPIClientResponse<PostAuxElementEndpointResponse>;
      
    expect(status).toBe(200);
  });
});