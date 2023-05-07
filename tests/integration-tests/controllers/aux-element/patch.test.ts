import { fetchMockAuxElement, generateJWT, importFile } from "@tests/helpers";
import { PatchAuxElementEndpointResponse } from "@typings/responses";
import { AuxElement, UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const endpointConstructor = (
  termbaseUUID: UUID,
  auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests PatchAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

    const auxElement = await fetchMockAuxElement(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      auxElement,
    };
  });

  test("should return a successful response for successful patch of an aux element", async () => {
    const { status, body } = await testApiClient
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