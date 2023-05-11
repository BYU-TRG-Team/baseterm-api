import { v4 as uuid } from "uuid";
import { GetTermbaseEndpointResponse } from "@typings/responses";
import { importTBXFile } from "@tests/helpers";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

let mockData: {
  termbaseUUID: UUID
};

describe("tests GetTermbase controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    mockData = {
      termbaseUUID,
    };
  });

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${uuid()}?page=1`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of 8 terms", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseEndpointResponse>;

    expect(status).toBe(200);
    expect(body.metadata.languages).toStrictEqual([ "de", "en", "fr" ]);
    expect(body.metadata.partsOfSpeech).toStrictEqual([ "noun", "verb" ]);
    expect(body.metadata.customers).toStrictEqual([ "IBM", "SAX Manufacturing" ]);
    expect(body.metadata.subjectFields).toStrictEqual([ "manufacturing" ]);
    expect(body.metadata.conceptIds).toStrictEqual( [ "c1", "c2", "c5", "c6", "c7" ]);
    expect(body.metadata.approvalStatuses).toStrictEqual([
      "admittedTerm-admn-sts",
      "deprecatedTerm-admn-sts",
      "preferredTerm-admn-sts",
      "supersededTerm-admn-sts"
    ]);
    expect(body.metadata.personRefs).toBeDefined();
    expect(body.termbaseUUID).toBeDefined();
    expect(body.type).toBeDefined();
    expect(body.style).toBeDefined();
    expect(body.xmlLang).toBeDefined();
    expect(body.xmlns).toBeDefined();
    expect(body.name).toBeDefined();
  });
});

