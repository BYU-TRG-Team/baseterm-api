import { GetTermbasesEndpointResponse } from "@typings/responses";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

describe("tests GetTermbases controller", () => {
  test("should return a 400 for invalid query params", async () => {
    const { status, body } = await testApiClient
      .get("/termbases")
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of termbases", async () => {
    const { status, body } = await testApiClient
      .get("/termbases?page=1")
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbasesEndpointResponse>;

    expect(status).toBe(200);
    expect(body.termbases).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(Array.isArray(body.termbases)).toBeTruthy();
  });
});