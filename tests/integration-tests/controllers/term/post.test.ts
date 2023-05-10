import { fetchMockTermbaseData, importFile } from "@tests/helpers";
import { PostLangSecEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

const personId = uuid();
const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/term`;
let mockData: {
  termbaseUUID: UUID,
  langSecUUID: UUID,
};

describe("tests PostTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
    );

    const {
      langSecUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      langSecUUID,
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term", async () => {
    const { status, body } = await testApiClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        langSecUUID: mockData.langSecUUID,
        value: "Test"
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
      SuperAgentResponse<PostLangSecEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
