import { v4 as uuid } from "uuid";
import { importTBXFile } from "@tests/helpers";
import {
  GetTermbaseEndpointResponse,
  PatchTermbaseEndpointResponse
} from "@typings/responses";
import { UUID } from "@typings";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

let mockData: {
  termbaseUUID: UUID,
};

describe("tests PatchTermbase controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

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
    const { body: termbaseResponse } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: GetTermbaseEndpointResponse };
      
    const { body: updatedTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(termbaseResponse.name);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should return a successful response with an updated name", async () => {
    const { body: termbaseResponse } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: GetTermbaseEndpointResponse };

    const updatedTermbaseName = uuid();

    const { body: updatedTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .field({
        name: updatedTermbaseName,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(updatedTermbaseName);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should disable enforcement of TBX-Basic, only update dialect if enforcement is disabled, and not allow reversion", async () => {
    const { body: updatedTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: false,
        type: "Test",
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(updatedTermbaseResponse.type).toBe("TBX-Basic");

    const { body: secondUpdatedTermbaseResponse } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: true,
        type: "Test"
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as 
      { body: PatchTermbaseEndpointResponse };

    expect(secondUpdatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(secondUpdatedTermbaseResponse.type).toBe("Test");
  });

  test("should return a 409 for duplicate name", async () => {
    const termbaseName = uuid();
    await importTBXFile(testApiClient, {
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