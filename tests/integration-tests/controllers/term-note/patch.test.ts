import { generateTestData } from "@tests/helpers";
import { PatchTermNoteEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { TestAPIClientResponse, TestData } from "@tests/types";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";

let testData: TestData;

describe("tests PatchTermNote controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 200 response for successful patch of term note", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${testData.termbaseUUID}/termNote/${testData.termNote.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES)
      .field({
        id: "Test",
        type: "Test",
        value: "Test",
        grpId: "Test1",
        datatype: "Test",
        langCode: VALID_LANGUAGE_CODE,
        order: 100,
      }) as TestAPIClientResponse<PatchTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.type).toBe("Test");
    expect(body.value).toBe("Test");
    expect(body.xmlLang).toBe(VALID_LANGUAGE_CODE);
    expect(body.order).toBe(100);
  });
});