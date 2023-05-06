import { fetchMockAuxElement, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { PatchAuxElementEndpointResponse } from "@typings/responses";
import { AuxElement, UUID } from "@typings";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests PatchAuxElement controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const auxElement = await fetchMockAuxElement(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      auxElement,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a successful response for successful patch of an aux element", async () => {
    const { status, body } = await testApiClient.requestClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.auxElement.uuid,
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        elementType: mockData.auxElement.elementType,
        id: "Test",
        order: 100,
      }) as SuperAgentResponse<PatchAuxElementEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("Test");
    expect(body.order).toBe(100);
  });
});