import { importTBXFile } from "@tests/helpers";
import { PostEntryEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

let mockData: {
  termbaseUUID: UUID
};

describe("tests PostEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importTBXFile();

    mockData = {
      termbaseUUID,
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient
      .post("/termbase/randommmmmmmm/entry")
      .set("Cookie", TEST_API_CLIENT_COOKIES);
    
    expect(status).toBe(400);
  });

  test("should return a 404 response for malformed termbaseUUID", async () => {  
    const { status } = await testApiClient
      .post("/termbase/randommmmmmmm/entry")
      .send({
        entryId: "test",
        initialLanguageSection: VALID_LANGUAGE_CODE,
        initialTerm: "test",
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
  });

  test("should return a 409 response for duplicate concept entry id", async () => {    
    const { status } = await testApiClient
      .post(`/termbase/${mockData.termbaseUUID}/entry`)
      .send({
        entryId: "c5", 
        initialLanguageSection: VALID_LANGUAGE_CODE,
        initialTerm: "test",
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(409);
  });

  test("should return a successfull response with an entry id", async () => {  
    const { status, body } = await testApiClient
      .post(`/termbase/${mockData.termbaseUUID}/entry`)
      .send({
        entryId: "c0293409", 
        initialLanguageSection: VALID_LANGUAGE_CODE,
        initialTerm: "test",
      }) 
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<PostEntryEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});