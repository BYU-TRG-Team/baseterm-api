import {
  ExportEndpointResponse,
  GetTermbaseTermsEndpointResponse,
  GetTermEndpointResponse,
  ImportEndpointResponse,
  SessionSSEEndpointResponse
} from "@typings/responses";
import { v4 as uuid } from "uuid";
import { SuperAgentTest } from "supertest";
import { UUID } from "@typings";
import EventSource from "eventsource";
import { EXAMPLE_TBX_FILE, TEST_API_CLIENT_COOKIES, TEST_API_CLIENT_ENDPOINT, TEST_AUTH_TOKEN, TEST_USER_ID } from "@tests/constants";

export const postPersonObjectRef = async (
  jwt: string,
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
  personId: UUID,
) => {
  await requestClient
    .post(
      `/termbase/${termbaseUUID}/personRefObject`
    )
    .field({
      name: "Test",
      email: "Test",
      role: "Test",
      id: personId,
    })
    .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
};

export const importTBXFile = async (
  requestClient: SuperAgentTest, 
  options: {
    filePath?: string
    name?: string,
    createPersonRefObject?: boolean
  } = {}
) => {
  const {
    filePath = EXAMPLE_TBX_FILE,
    name = uuid(),
    createPersonRefObject = true
  } = options;

  const { body: importResponseBody } = await requestClient
    .post("/import")
    .attach("tbxFile", filePath)
    .field({ name }) 
    .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
      body: ImportEndpointResponse 
    };

  await new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${importResponseBody.sessionId}`,
      { 
        withCredentials: true,
        headers: {
          "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
        }
      }
    );
  
    eventSource.onmessage = (event) => {
      const fileSession = JSON.parse(event.data) as SessionSSEEndpointResponse;

      if (fileSession.status === "completed") {
        eventSource.close();
        resolve(fileSession);
      }

      if (fileSession.error !== undefined) {
        eventSource.close();
        reject(fileSession.errorCode);
      }
    };
  });

  if (createPersonRefObject) {
    await postPersonObjectRef(
      TEST_AUTH_TOKEN,
      importResponseBody.termbaseUUID,
      requestClient,
      TEST_USER_ID
    );
  }

  return importResponseBody.termbaseUUID;
};

export const exportTBXFile = async (
  requestClient: SuperAgentTest, 
  termbaseUUID: UUID,
) => {
  const { body: exportResponseBody } = await requestClient
    .get(`/export/${termbaseUUID}`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as { 
      body: ExportEndpointResponse 
    };

  const exportedTbxFile = await new Promise<string>((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${exportResponseBody.sessionId}`,
      { 
        withCredentials: true,
        headers: {
          "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
        }
      }
    );
  
    eventSource.onmessage = (event) => {
      const fileSession = JSON.parse(event.data) as SessionSSEEndpointResponse;

      if (fileSession.status === "completed") {
        eventSource.close();
        resolve(fileSession.data as string);
      }

      if (fileSession.error !== undefined) {
        eventSource.close();
        reject(fileSession.errorCode);
      }
    };
  });

  return exportedTbxFile;
};

export const fetchMockTermbaseData = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
) => {
  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as
    { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
        { body: GetTermEndpointResponse };

    if (termResponse.synonyms.length !== 0) {
      return {
        entryUUID: termResponse.conceptEntry.uuid,
        langSecUUID: termResponse.languageSection.uuid,
        termUUID: termResponse.uuid,
        termbaseUUID,
      };
    }
  }

  throw new Error("Failed to find an appropriate term");
};

export const fetchMockTermNote = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest
) => {
  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`) 
    .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
      { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
        { body: GetTermEndpointResponse };

    if (termResponse.termNotes.length !== 0) {
      return termResponse.termNotes[0];
    }
  }

  throw new Error("Failed to fetch term note");
};

export const fetchMockAuxElement = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest
) => {
  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
      { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termReponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`]) as 
        { body: GetTermEndpointResponse };

    if (termReponse.auxElements.length !== 0) {
      return termReponse.auxElements[0];
    }
  }

  throw new Error("Failed to fetch aux element");
};
