import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/term`;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests PostTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

    const {
      langSecUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      langSecUUID,
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        langSecUUID: mockData.langSecUUID,
        value: "Test"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      SuperAgentResponse<PostLangSecEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
