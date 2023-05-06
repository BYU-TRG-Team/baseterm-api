import { v4 as uuid } from "uuid";
import { GetTermEndpointResponse } from "@typings/responses";
import { fetchMockTermbaseData, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const jwt = generateJWT(
  Role.User
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termUUID: UUID,
};

describe("tests GetTerm controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();

    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const { termUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      termUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    
    const { status, body } = await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/${uuid()}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
   
    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });


  test("should return a 404 response for invalid uuid (malformed uuid)", async () => {
    const { status, body } = await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/randommmm`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a successful response", async () => {
    const termResponse = await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}/term/${mockData.termUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as
      { status: number; body: GetTermEndpointResponse};

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