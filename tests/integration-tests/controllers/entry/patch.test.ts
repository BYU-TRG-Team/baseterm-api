import { v4 as uuid } from "uuid";
import { generateTestData } from "@tests/helpers";
import { PatchEntryEndpointResponse } from "@typings/responses";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests PatchEntry controller", () => {
  beforeAll(async () => { 
    testData = await generateTestData();
  });

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/entry/testtt`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a 404 for random uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/entry/${uuid()}`)
      .field({
        id: "TEST"
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/entry/${testData.conceptEntry.uuid}`)
      .field({
        id: "TEST",
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PatchEntryEndpointResponse>;

    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.termbaseUUID).toBeDefined();
    expect(body.uuid).toBeDefined();
  });
});