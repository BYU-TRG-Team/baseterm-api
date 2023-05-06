import { fetchMockTermNote, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { PatchTermNoteEndpointResponse } from "@typings/responses";
import { TermNote, UUID } from "@typings";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { SuperAgentResponse, TestAPIClient } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termNote: TermNote,
};

describe("tests PatchTermNote controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const termNote = await fetchMockTermNote(
      termbaseUUID,
      testApiClient.requestClient
    );

    mockData = {
      termbaseUUID,
      termNote,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 200 response for successful patch of term note", async () => {
    const { status, body} = await testApiClient.requestClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNote.uuid
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        id: "Test",
        type: "Test",
        value: "Test",
        grpId: "Test1",
        datatype: "Test",
        langCode: VALID_LANGUAGE_CODE,
        order: 100,
      }) as SuperAgentResponse<PatchTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.type).toBe("Test");
    expect(body.value).toBe("Test");
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
  });
});