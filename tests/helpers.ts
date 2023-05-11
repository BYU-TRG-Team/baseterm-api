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
import { EXAMPLE_TBX_FILE } from "@tests/constants";
import testApiClient, { TEST_API_CLIENT_COOKIES, TEST_API_CLIENT_ENDPOINT, TEST_AUTH_TOKEN, TEST_USER_ID } from "@tests/test-api-client";
import { TestAPIClientResponse } from "@tests/types";

export const importTBXFile = async (
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

  const { body: importResponse } = await testApiClient
    .post("/import")
    .attach("tbxFile", filePath)
    .field({ name }) 
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<ImportEndpointResponse>;

  await new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${importResponse.sessionId}`,
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
      importResponse.termbaseUUID,
      testApiClient,
      TEST_USER_ID
    );
  }

  return importResponse.termbaseUUID;
};

export const exportTBXFile = async (termbaseUUID: UUID) => {
  const { body: exportResponse } = await testApiClient
    .get(`/export/${termbaseUUID}`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<ExportEndpointResponse>;

  const exportedTbxFile = await new Promise<string>((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${exportResponse.sessionId}`,
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

export const postPersonObjectRef = async (
  jwt: string,
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
  personId: UUID,
) => {
  await requestClient
    .post(`/termbase/${termbaseUUID}/personRefObject`)
    .field({
      name: "Test",
      email: "Test",
      role: "Test",
      id: personId,
    })
    .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);
};

export const fetchMockTermbaseData = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
) => {
  const { body: getTermbaseTermsResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

  for (const term of getTermbaseTermsResponse.terms) {
    const { body: getTermResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermEndpointResponse>;

    if (getTermResponse.synonyms.length !== 0) {
      return {
        entryUUID: getTermResponse.conceptEntry.uuid,
        langSecUUID: getTermResponse.languageSection.uuid,
        termUUID: getTermResponse.uuid,
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
  const { body: getTermbaseTermsResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`) 
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

  for (const term of getTermbaseTermsResponse.terms) {
    const { body: getTermResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermEndpointResponse>;

    if (getTermResponse.termNotes.length !== 0) {
      return getTermResponse.termNotes[0];
    }
  }

  throw new Error("Failed to fetch term note");
};

export const fetchMockAuxElement = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest
) => {
  const { body: getTermbaseTermsResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

  for (const term of getTermbaseTermsResponse.terms) {
    const { body: getTermResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermEndpointResponse>;

    if (getTermResponse.auxElements.length !== 0) {
      return getTermResponse.auxElements[0];
    }
  }

  throw new Error("Failed to fetch aux element");
};
