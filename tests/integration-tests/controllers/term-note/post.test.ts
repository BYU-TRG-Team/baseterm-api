import { PostTermNoteEndpointResponse } from "@typings/responses";
import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/termNote`;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostTermNote controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    const {
      termUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      termUUID,
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
  
  test("should return a 200 response for successful creation of a term note", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        termUUID: mockData.termUUID,
        value: "Test",
        type: "Test",
        isGrp: false,
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      SuperAgentResponse<PostTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});