import { GetTermbasesEndpointResponse } from "@typings/responses";
import { generateJWT } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import testApiClient from "@tests/test-api-client";

const jwt = generateJWT(
  Role.User
);

describe("tests GetTermbases controller", () => {
  test("should return a 400 for invalid query params", async () => {
    const { status, body } = await testApiClient
      .get("/termbases")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of termbases", async () => {
    const { status, body } = (
      await testApiClient
        .get("/termbases?page=1")
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: GetTermbasesEndpointResponse };

    expect(status).toBe(200);
    expect(body.termbases).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(Array.isArray(body.termbases)).toBeTruthy();
  });
});