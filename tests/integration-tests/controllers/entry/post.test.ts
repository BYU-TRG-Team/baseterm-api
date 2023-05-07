import { generateJWT, importFile } from "@tests/helpers";
import { PostEntryEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const personId = uuid();
const jwt = generateJWT(
  Role.Staff,
  personId
);
let mockData: {
  termbaseUUID: UUID
};

describe("tests PostEntry controller", () => {
  beforeAll(async () => {
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
      uuid(),
      personId
    );

    mockData = {
      termbaseUUID,
    };
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient
      .post("/termbase/randommmmmmmm/entry")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
    
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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PostEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});