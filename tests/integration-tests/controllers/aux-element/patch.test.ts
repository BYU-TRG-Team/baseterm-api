import { fetchMockAuxElement, importTBXFile } from "@tests/helpers";
import { PatchAuxElementEndpointResponse } from "@typings/responses";
import { AuxElement, UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  auxElementUUID: UUID,
) => `/termbase/${termbaseUUID}/auxElement/${auxElementUUID}`;
let mockData: {
  termbaseUUID: UUID,
  auxElement: AuxElement,
};

describe("tests PatchAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

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
      .set("Cookie", TEST_API_CLIENT_COOKIES)
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