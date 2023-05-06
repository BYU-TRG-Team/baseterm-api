import { fetchMockTermNote, generateJWT, getTestAPIClient, importFile } from "@tests/helpers";
import { UUID } from "@typings";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";
import { TestAPIClient } from "@tests/types";

const endpointConstructor = (
  termbaseUUID: UUID,
  termNoteUUID: UUID,
) => `/termbase/${termbaseUUID}/termNote/${termNoteUUID}`;
const jwt = generateJWT(
  Role.Staff
);
let testApiClient: TestAPIClient;
let mockData: {
  termbaseUUID: UUID,
  termNoteUUID: UUID,
};

describe("tests DeleteTermNote controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      testApiClient.requestClient
    );

    const termNote = await fetchMockTermNote(
      termbaseUUID,
      testApiClient.requestClient,
    );

    mockData = {
      termbaseUUID,
      termNoteUUID: termNote.uuid
    };
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a successful response and produce a 404 when requesting the term note", async () => {
    const { status: deleteTermNoteStatus } = await testApiClient.requestClient
      .delete(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNoteUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(deleteTermNoteStatus).toBe(204);
	
    const { status: getTermNoteStatus } = await testApiClient.requestClient
      .get(
        endpointConstructor(
          mockData.termbaseUUID,
          mockData.termNoteUUID
        )
      )
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
	
    expect(getTermNoteStatus).toBe(404);
  });
});