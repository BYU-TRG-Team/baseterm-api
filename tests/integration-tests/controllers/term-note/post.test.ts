import { PostTermNoteEndpointResponse } from "@typings/responses";
import { fetchMockTermbaseData, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

const endpointConstructor = (
  termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/termNote`;
const jwt = generateJWT(
  Role.Staff
);

let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostTermNote controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const {
      termUUID
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });
  
  test("should return a 200 response for successful creation of a term note", async () => {
    const { status, body } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        termUUID: mockData.termUUID,
        value: "Test",
        type: "Test",
        isGrp: false,
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      SuperAgentResponse<PostTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});