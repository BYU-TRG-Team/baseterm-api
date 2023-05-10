import { fetchMockTermbaseData, importFile } from "@tests/helpers";
import { PatchTermEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PatchTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
    );

    const { termUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      termUUID
    };
  });

  test("should return a 200 response for successful patch of term", async () => {
    const { status, body} = await testApiClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
      .field({
        value: "Test",
        id: "Test",
        termSecId: "Test1",
        order: 100,
      }) as SuperAgentResponse<PatchTermEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.id).toBe("Test");
    expect(body.value).toBe("Test");
    expect(body.termSecId).toBe("Test1");
    expect(body.order).toBe(100);
  });
});