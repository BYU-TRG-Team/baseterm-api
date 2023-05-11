import { generateTestData } from "@tests/helpers";
import { PatchTermNoteEndpointResponse } from "@typings/responses";
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
        id: "TEST",
        type: "TEST",
        value: "TEST",
        grpId: "FOO",
        datatype: "TEST",
        langCode: "en-US",
        order: 0,
      }) as TestAPIClientResponse<PatchTermNoteEndpointResponse>;
  
    expect(status).toBe(200);
    expect(body.type).toBe("TEST");
    expect(body.value).toBe("TEST");
    expect(body.xmlLang).toBe("en-US");
    expect(body.order).toBe(0);
  });
});