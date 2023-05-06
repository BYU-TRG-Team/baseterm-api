import { fetchMockTermbaseData, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { UUID, TbxElement } from "@typings";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

const endpointConstructor = (
  termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/auxElement`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const {
      termUUID,
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient.requestClient
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 200 response for successful post of aux element", async () => {
    const { status } = await testApiClient.requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        parentUUID: mockData.termUUID,
        parentElementType: TbxElement.Term,
        value: "Test",
        elementType: TbxElement.Note,
      }) as SuperAgentResponse<PostAuxElementEndpointResponse>;
      
    expect(status).toBe(200);
  });
});