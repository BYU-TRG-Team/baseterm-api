import { v4 as uuid } from "uuid";
import { GetTermbaseEndpointResponse } from "@typings/responses";
import { generateJWT, importFile } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const jwt = generateJWT(
  Role.User
);
let mockData: {
  termbaseUUID: UUID
};

describe("tests GetTermbase controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient
    );

    mockData = {
      termbaseUUID,
    };
  });

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${uuid()}?page=1`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of 8 terms", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${mockData.termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
    const responseBody = body as GetTermbaseEndpointResponse;
    expect(status).toBe(200);
    expect(responseBody.metadata.languages).toStrictEqual([ "de", "en", "fr" ]);
    expect(responseBody.metadata.partsOfSpeech).toStrictEqual([ "noun", "verb" ]);
    expect(responseBody.metadata.customers).toStrictEqual([ "IBM", "SAX Manufacturing" ]);
    expect(responseBody.metadata.subjectFields).toStrictEqual([ "manufacturing" ]);
    expect(responseBody.metadata.conceptIds).toStrictEqual( [ "c1", "c2", "c5", "c6", "c7" ]);
    expect(responseBody.metadata.approvalStatuses).toStrictEqual([
      "admittedTerm-admn-sts",
      "deprecatedTerm-admn-sts",
      "preferredTerm-admn-sts",
      "supersededTerm-admn-sts"
    ]);
    expect(responseBody.metadata.personRefs).toBeDefined();
    expect(responseBody.termbaseUUID).toBeDefined();
    expect(responseBody.type).toBeDefined();
    expect(responseBody.style).toBeDefined();
    expect(responseBody.xmlLang).toBeDefined();
    expect(responseBody.xmlns).toBeDefined();
    expect(responseBody.name).toBeDefined();
  });
});

