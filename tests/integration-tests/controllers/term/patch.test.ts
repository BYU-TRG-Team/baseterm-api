import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PatchTermEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const personId = uuid();
const endpointConstructor = (
  termbaseUUID: UUID,
  termUUID: UUID,
) => `/termbase/${termbaseUUID}/term/${termUUID}`;
const jwt = generateJWT(
  Role.Staff,
  personId,
);
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PatchTerm controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
      uuid(),
      personId,
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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
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