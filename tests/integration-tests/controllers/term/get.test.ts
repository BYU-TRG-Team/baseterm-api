import { v4 as uuid } from "uuid";
import { GetTermEndpointResponse } from "@typings/responses";
import { generateTestData } from "@tests/helpers";
import testApiClient,  { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests GetTerm controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => { 
    const termUUID = uuid();
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/term/${termUUID}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);
   
    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });


  test("should return a 404 response for invalid uuid (malformed uuid)", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/term/randommmm`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a successful response", async () => {
    const termResponse = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/term/${testData.term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermEndpointResponse>;

    expect(termResponse.status).toBe(200);
    expect(termResponse.body.uuid).toBeDefined();
    expect(termResponse.body.id).toBeDefined();
    expect(termResponse.body.value).toBeDefined();
    expect(termResponse.body.language).toBeDefined();
    expect(termResponse.body.termSecId).toBeDefined();
    expect(termResponse.body.termbaseUUID).toBeDefined();
    expect(termResponse.body.synonyms).toBeDefined();
    expect(termResponse.body.conceptId).toBeDefined();
    expect(termResponse.body.translations).toBeDefined();
    expect(termResponse.body.customers).toBeDefined();
    expect(termResponse.body.partOfSpeech).toBeDefined();
    expect(termResponse.body.approvalStatus).toBeDefined();
    expect(termResponse.body.subjectField).toBeDefined();
    expect(termResponse.body.conceptEntry).toBeDefined();
    expect(termResponse.body.languageSection).toBeDefined();
    expect(termResponse.body.auxElements).toBeDefined();
    expect(termResponse.body.termNotes).toBeDefined();
  });
});