import { v4 as uuid } from "uuid";
import { generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import {
  GetTermbaseEndpointResponse,
  PatchTermbaseEndpointResponse
} from "@typings/responses";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
};

describe("tests PatchTermbase controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();

    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    mockData = {
      termbaseUUID,
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a 404 due to malformed uuid", async () => {
    const { status } = await testApiClient.requestClient
      .patch("/termbase/randommmmm")
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a 404 due to random uuid", async () => {
    const { status } = await testApiClient.requestClient
      .patch(`/termbase/${uuid()}`)
      .field({
        name: uuid(),
        lang: "en-US"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
  });

  test("should return a successful response with no updates", async () => {
    const { body: termbaseResponse } = await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };
      
    const { body: updatedTermbaseResponse } = await testApiClient.requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(termbaseResponse.name);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should return a successful response with an updated name", async () => {
    const { body: termbaseResponse } = await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };

    const updatedTermbaseName = uuid();

    const { body: updatedTermbaseResponse } = await testApiClient.requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .field({
        name: updatedTermbaseName,
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.name).toBe(updatedTermbaseName);
    expect(updatedTermbaseResponse.type).toBe(termbaseResponse.type);
  });

  test("should disable enforcement of TBX-Basic, only update dialect if enforcement is disabled, and not allow reversion", async () => {
    const { body: updatedTermbaseResponse } = await testApiClient.requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: false,
        type: "Test",
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(updatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(updatedTermbaseResponse.type).toBe("TBX-Basic");

    const { body: secondUpdatedTermbaseResponse } = await testApiClient.requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .send({
        enforceBasicDialect: true,
        type: "Test"
      }) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: PatchTermbaseEndpointResponse };

    expect(secondUpdatedTermbaseResponse.enforceBasicDialect).toBe(false);
    expect(secondUpdatedTermbaseResponse.type).toBe("Test");
  });

  test("should return a 409 for duplicate name", async () => {
    const firstTermbaseName = uuid();
    await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient,
      firstTermbaseName,
    );

    await testApiClient.requestClient
      .get(`/termbase/${mockData.termbaseUUID}`) 
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseEndpointResponse };


    const { status } = await testApiClient.requestClient
      .patch(`/termbase/${mockData.termbaseUUID}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
      .field({
        name: firstTermbaseName,
      });

    expect(status).toBe(409);
  });
});