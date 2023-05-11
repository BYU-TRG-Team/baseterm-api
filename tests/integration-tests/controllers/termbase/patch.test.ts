import { v4 as uuid } from "uuid";
import { importTBXFile } from "@tests/helpers";
import { GetTermbaseEndpointResponse, PatchTermbaseEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES }  from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

let mockData: {
  termbaseUUID: UUID,
};

describe("tests PatchTermbase controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    mockData = {
      termbaseUUID,
    };
  });

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await testApiClient
      .patch("/termbase/randommmmm")
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a 404 due to random uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${uuid()}`)
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a successful response with no updates", async () => {
    const { body: getTermbaseResponse } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseEndpointResponse>;
      
    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PatchTermbaseEndpointResponse>;

    expect(patchTermbaseResponse.name).toBe(getTermbaseResponse.name);
    expect(patchTermbaseResponse.type).toBe(getTermbaseResponse.type);
  });

  test("should return a successful response with an updated name", async () => {
    const { body: getTermbaseResponse } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseEndpointResponse>;

    const updatedTermbaseName = uuid();

    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .field({
        name: updatedTermbaseName,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PatchTermbaseEndpointResponse>;

    expect(patchTermbaseResponse.name).toBe(updatedTermbaseName);
    expect(patchTermbaseResponse.type).toBe(getTermbaseResponse.type);
  });

  test("should disable enforcement of TBX-Basic, only update dialect if enforcement is disabled, and not allow reversion", async () => {
    const { body: patchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: false,
        type: "Test",
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
        body: PatchTermbaseEndpointResponse 
      };

    expect(patchTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(patchTermbaseResponse.type).toBe("TBX-Basic");

    const { body: nextPatchTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: true,
        type: "Test"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
        body: PatchTermbaseEndpointResponse 
      };

    expect(nextPatchTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(nextPatchTermbaseResponse.type).toBe("Test");
  });

  test("should return a 409 for duplicate name", async () => {
    const termbaseName = uuid();
    await importTBXFile({
      name: termbaseName
    });

    const { status } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        name: termbaseName,
      });

    expect(status).toBe(409);
  });
});