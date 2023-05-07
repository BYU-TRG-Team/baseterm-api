import { v4 as uuid } from "uuid";
import { fetchMockTermbaseData, generateJWT, importFile } from "@tests/helpers";
import { PatchEntryEndpointResponse } from "@typings/responses";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";

const personId = uuid();
const jwt = generateJWT(
  Role.Staff,
  personId,
);
let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};


describe("tests PatchEntry controller", () => {
  beforeAll(async () => { 
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient,
      uuid(),
      personId,
    );

    const { entryUUID } = await fetchMockTermbaseData(
      termbaseUUID,
      testApiClient,
    );

    mockData = {
      termbaseUUID,
      entryUUID,
    };
  });

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/testtt`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a 404 for random uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${uuid()}`)
      .field({
        id: "TEST"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`)
      .field({
        id: "TEST",
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.termbaseUUID).toBeDefined();
    expect(body.uuid).toBeDefined();
  });
});