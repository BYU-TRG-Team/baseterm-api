import { GetTermbasesEndpointResponse } from "@typings/responses";
import { generateJWT, getTestAPIClient } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { TestAPIClient } from "@tests/types";

const jwt = generateJWT(
  Role.User
);
let testApiClient: TestAPIClient;

describe("tests GetTermbases controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 400 for invalid query params", async () => {
    const { status, body } = await testApiClient.requestClient
      .get("/termbases")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of termbases", async () => {
    const { status, body } = (
      await testApiClient.requestClient
        .get("/termbases?page=1")
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: GetTermbasesEndpointResponse };

    expect(status).toBe(200);
    expect(body.termbases).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(Array.isArray(body.termbases)).toBeTruthy();
  });
});