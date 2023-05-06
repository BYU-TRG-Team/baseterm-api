import { generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { PostEntryEndpointResponse } from "@typings/responses";
import { VALID_LANGUAGE_CODE } from "@tests/constants";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { v4 as uuid } from "uuid";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const personId = uuid();
const jwt = generateJWT(
  Role.Staff,
  personId
);

let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID
};

describe("tests PostEntry controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();

    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient,
      uuid(),
      personId
    );

    mockData = {
      termbaseUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status } = await testApiClient.requestClient
      .post("/termbase/randommmmmmmm/entry")
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
    
    expect(status).toBe(400);
  });

  test("should return a 404 response for malformed termbaseUUID", async () => {  
    const { status } = await testApiClient.requestClient
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
    const { status } = await testApiClient.requestClient
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
    const { status, body } = await testApiClient.requestClient
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