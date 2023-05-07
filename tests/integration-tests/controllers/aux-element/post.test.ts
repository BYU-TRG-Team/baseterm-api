import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { UUID, TbxElement } from "@typings";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const endpointConstructor = (
  termbaseUUID: UUID
) => `/termbase/${termbaseUUID}/auxElement`;
const jwt = generateJWT(
  Role.Staff
);
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests PostAuxElement controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

    const {
      termUUID,
    } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  test("should return a 200 response for successful post of aux element", async () => {
    const { status } = await testApiClient
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