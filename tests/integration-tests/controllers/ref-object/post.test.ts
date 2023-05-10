import { importTBXFile } from "@tests/helpers";
import { PostPersonRefObjectEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import { v4 as uuid } from "uuid";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES, TEST_USER_ID } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/personRefObject`;
let mockData: {
  termbaseUUID: UUID
};

describe("tests PostPersonRefObject controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile({
      createPersonRefObject: false
    });

    mockData = {
      termbaseUUID
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });

  test("should return a 400 response for user id mismatch", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: uuid()
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.userIdMismatch);
  });
  
  test("should return a 200 response for successful creation of a person object", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: TEST_USER_ID
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES) as
      SuperAgentResponse<PostPersonRefObjectEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
