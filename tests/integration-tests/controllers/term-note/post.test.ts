import { PostTermNoteEndpointResponse } from "@typings/responses";
import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { TestAPIClientResponse } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

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
      .post(`/termbase/${mockData.termbaseUUID}/termNote`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term note", async () => {
    const { status, body } = await testApiClient
      .post(`/termbase/${mockData.termbaseUUID}/termNote`)
      .field({
        termUUID: mockData.termUUID,
        value: "Test",
        type: "Test",
        isGrp: false,
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});