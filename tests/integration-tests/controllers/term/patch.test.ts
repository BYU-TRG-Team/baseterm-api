import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PatchTermEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PatchTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    const { termUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      termUUID
    };
  });

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body} = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/term/${mockData.termUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        value: "Test",
        id: "Test",
        termSecId: "Test1",
        order: 100,
      }) as SuperAgentResponse<PatchTermEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("Test");
    expect(body.value).toBe("Test");
    expect(body.termSecId).toBe("Test1");
    expect(body.order).toBe(100);
  });
});