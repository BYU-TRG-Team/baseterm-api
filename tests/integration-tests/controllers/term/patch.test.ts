import { generateTestData } from "@tests/helpers";
import { PatchTermEndpointResponse } from "@typings/responses";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PatchTerm controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body} = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/term/${testData.term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        value: "TEST",
        id: "TEST",
        termSecId: "FOO",
        order: 0,
      }) as TestAPIClientResponse<PatchTermEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.value).toBe("TEST");
    expect(body.termSecId).toBe("FOO");
    expect(body.order).toBe(0);
  });
});