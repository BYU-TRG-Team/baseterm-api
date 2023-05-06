import { 
  generateJWT, 
  getTestAPIClient, 
  importFile 
} from "@tests/helpers";
import { PostPersonRefObjectEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";

let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID
};
const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/personRefObject`;
const userId = uuid();
const jwt = generateJWT(
  Role.User,
  userId
);

describe("tests PostPersonRefObject controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    mockData = {
      termbaseUUID
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });

  test("should return a 400 response for user id mismatch", async () => {
    const { status, body } = await testApiClient.requestClient
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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.userIdMismatch);
  });
  
  test("should return a 200 response for successful creation of a person object", async () => {
    const { status, body } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: userId
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as
      SuperAgentResponse<PostPersonRefObjectEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
