import { v4 as uuid } from "uuid";
import { fetchMockTermbaseData, importTBXFile } from "@tests/helpers";
import { PatchEntryEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_AUTH_TOKEN } from "@tests/constants";

let mockData: {
  termbaseUUID: UUID,
  entryUUID: UUID,
};


describe("tests PatchEntry controller", () => {
  beforeAll(async () => { 
    const termbaseUUID = await importTBXFile(testApiClient);

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
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);

    expect(status).toBe(404);
  });

  test("should return a 404 for random uuid", async () => {
    const { status } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${uuid()}`)
      .field({
        id: "TEST"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response", async () => {
    const { status, body } = await testApiClient
      .patch(`/termbase/${mockData.termbaseUUID}/entry/${mockData.entryUUID}`)
      .field({
        id: "TEST",
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
      { body: PatchEntryEndpointResponse, status: number };

    expect(status).toBe(200);
    expect(body.id).toBe("TEST");
    expect(body.termbaseUUID).toBeDefined();
    expect(body.uuid).toBeDefined();
  });
});