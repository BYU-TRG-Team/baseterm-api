import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { UUID, TbxElement } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES} from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/auxElement`;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

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
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        parentUUID: mockData.termUUID,
        parentElementType: TbxElement.Term,
        value: "Test",
        elementType: TbxElement.Note,
      }) as SuperAgentResponse<PostAuxElementEndpointResponse>;
      
    expect(status).toBe(200);
  });
});