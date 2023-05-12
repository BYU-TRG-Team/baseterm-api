import {
  ExportEndpointResponse,
  GetTermbaseTermsEndpointResponse,
  GetTermEndpointResponse,
  ImportEndpointResponse,
  SessionSSEEndpointResponse
} from "@typings/responses";
import { v4 as uuid } from "uuid";
import { UUID } from "@typings";
import EventSource from "eventsource";
import { PRIMARY_TEST_TBX_FILE, PRIMARY_TEST_TBX_FILE_TESTABLE_TERM } from "@tests/constants";
import testApiClient, { TEST_API_CLIENT_COOKIES, TEST_API_CLIENT_ENDPOINT, TEST_USER_ID } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

/**
 * Generates TBX related data useful for testing. 
 * 
 * This method imports the PRIMARY_TEST_TBX_FILE using the test API client and collates test data based on the PRIMARY_TEST_TBX_FILE_TESTABLE_TERM. 
 * See @tests/constants for more details.
 */
export const generateTestData = async (
  options: {
    createPersonRefObject?: boolean
  } = {}
): Promise<TestData> => {
  const { createPersonRefObject = true }  = options;
  const termbaseUUID = await importTBXFile({
    filePath: PRIMARY_TEST_TBX_FILE,
    createPersonRefObject,
  });

  const { body: getTermbaseTermsResponse } = await testApiClient
    .get(`/termbase/${termbaseUUID}/terms?page=1&term=${PRIMARY_TEST_TBX_FILE_TESTABLE_TERM}`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

  if (getTermbaseTermsResponse.terms.length !== 1) {
    throw new Error("Failed to fetch test data.");
  }

  const term = getTermbaseTermsResponse.terms[0];

  const { body: getTermResponse } = await testApiClient
    .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
    .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermEndpointResponse>;

  return {
    termbaseUUID,
    conceptEntry: getTermResponse.conceptEntry,
    langSec: getTermResponse.languageSection,
    term: getTermResponse,
    auxElement: getTermResponse.auxElements[0],
    termNote: getTermResponse.termNotes[0],
  };
};

/**
 * Imports a TBX file.
 * 
 * This method imports a TBX file using the test API client.
 */
export const importTBXFile = async (
  options: {
    filePath: string
    name?: string,
    createPersonRefObject?: boolean
  }
) => {
  const {
    filePath,
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
    await testApiClient
      .post(`/termbase/${importResponse.termbaseUUID}/personRefObject`)
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: TEST_USER_ID,
      })
      .set("Cookie", TEST_API_CLIENT_COOKIES);
  }

  return importResponse.termbaseUUID;
};

/**
 * Exports a TBX file.
 * 
 * This method exports a TBX file using the test API client.
 */
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

