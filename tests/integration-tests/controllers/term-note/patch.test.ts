import { fetchMockTermNote, importTBXFile } from "@tests/helpers";
import { PatchTermNoteEndpointResponse } from "@typings/responses";
import { TermNote, UUID } from "@typings";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { SuperAgentResponse } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/constants";

const endpointConstructor = (
  termbaseUUID: UUID,
  termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
let mockData: {
  termbaseUUID: UUID,
  termNote: TermNote,
};

describe("tests PatchTermNote controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile(testApiClient);

    const termNote = await fetchMockTermNote(
      termbaseUUID,
      testApiClient
    );

    mockData = {
      termbaseUUID,
      termNote,
    };
  });

  test("should return a 200 response for successful patch of term note", async () => {
    const { status, body} = await testApiClient
      .patch(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNote.uuid
        )
      )
      .set("Cookie", TEST_API_CLIENT_COOKIES)
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