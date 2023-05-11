import { v4 as uuid } from "uuid";
import { generateTestData, importTBXFile } from "@tests/helpers";
import { GetTermbaseEndpointResponse, PatchTermbaseEndpointResponse } from "@typings/responses";
import testApiClient, { TEST_API_CLIENT_COOKIES }  from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";
import { PRIMARY_TEST_TBX_FILE } from "@tests/constants";

let testData: TestData;

describe("tests PatchTermbase controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await testApiClient
      .patch("/termbase/TEST")
      .field({
        lang: "en-US"
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a 404 due to random uuid", async () => {
    const termbaseUUID = uuid();

    const { status } = await testApiClient
      .patch(`/termbase/${termbaseUUID}`)
      .field({
        lang: "en-US"
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response with no updates", async () => {
    const { body: getTermbaseResponse } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseEndpointResponse>;
      
    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PatchTermbaseEndpointResponse>;

    expect(patchTermbaseResponse.name).toBe(getTermbaseResponse.name);
    expect(patchTermbaseResponse.type).toBe(getTermbaseResponse.type);
  });

  test("should return a successful response with an updated name", async () => {
    const { body: getTermbaseResponse } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseEndpointResponse>;

    const updatedTermbaseName = uuid();

    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}`)
      .field({
        name: updatedTermbaseName,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PatchTermbaseEndpointResponse>;

    expect(patchTermbaseResponse.name).toBe(updatedTermbaseName);
    expect(patchTermbaseResponse.type).toBe(getTermbaseResponse.type);
  });

  test("should disable enforcement of TBX-Basic, only update dialect if enforcement is disabled, and not allow reversion", async () => {
    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}`)
      .send({
        enforceBasicDialect: false,
        type: "TEST",
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
        body: PatchTermbaseEndpointResponse 
      };

    expect(patchTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(patchTermbaseResponse.type).toBe("TBX-Basic");

    const { body: nextPatchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}`)
      .send({
        enforceBasicDialect: true,
        type: "TEST"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
        body: PatchTermbaseEndpointResponse 
      };

    expect(nextPatchTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(nextPatchTermbaseResponse.type).toBe("TEST");
  });

  test("should return a 409 for duplicate name", async () => {
    const termbaseName = uuid();
    await importTBXFile({
      filePath: PRIMARY_TEST_TBX_FILE,
      name: termbaseName
    });

    const { status } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        name: termbaseName,
      });

    expect(status).toBe(409);
  });
});