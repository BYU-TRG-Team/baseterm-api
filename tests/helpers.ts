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
import jwt from "jsonwebtoken";
import { Role } from "@byu-trg/express-user-management";
import { TEST_API_CLIENT_ENDPOINT, HTTP_COOKIE_NAME, TEST_API_AUTH_SECRET, RANDOM_STRING } from "@tests/constants";
import { FileServiceSession } from "@typings/sessions";

export const generateJWT = (
  role: Role,
  personId: UUID = uuid(),
) => {
  return (
    jwt.sign({
      id: personId, 
      role, 
      verified: true, 
      username: RANDOM_STRING,
    }, TEST_API_AUTH_SECRET)
  );
};

export const importFile = async (
  filePath: string,
  requestClient: SuperAgentTest,
  name: string = uuid(),
  personId = uuid(),
  createPersonRef = true
) => {
  const jwt = generateJWT(
    Role.Admin,
    personId,
  );

  const { body: importBody } = await requestClient
    .post("/import")
    .attach("tbxFile", filePath)
    .field({ name }) 
    .set("Cookie", [`${HTTP_COOKIE_NAME}=${jwt}`]) as { 
      body: ImportEndpointResponse 
    };

  await new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${importBody.sessionId}`,
      { 
        withCredentials: true,
        headers: {
          "Cookie": `${HTTP_COOKIE_NAME}=${jwt}`
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

  if (!createPersonRef) {
    await postPersonObjectRef(
      jwt,
      importBody.termbaseUUID,
      requestClient,
      personId,
    );
  }

  return importBody.termbaseUUID;
};

export const exportFile = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
) => {
  const jwt = generateJWT(
    Role.Admin,
    uuid(),
  );

  const { body: exportBody } = await requestClient
    .get(`/export/${termbaseUUID}`)
    .set("Cookie", [`${HTTP_COOKIE_NAME}=${jwt}`]) as { 
      body: ExportEndpointResponse 
    };

  const exportedTbxFile = await new Promise<string>((resolve, reject) => {
    const eventSource = new EventSource(
      `${TEST_API_CLIENT_ENDPOINT}/session/${exportBody.sessionId}`,
      {
        withCredentials: true,
        headers: {
          "Cookie": `${HTTP_COOKIE_NAME}=${jwt}`
        }
      }
    );

    eventSource.onmessage = (event) => {
      const fileSession = JSON.parse(event.data) as FileServiceSession;
        
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
      name: RANDOM_STRING,
      email: RANDOM_STRING,
      role: RANDOM_STRING,
      id: personId,
    })
    .set("Cookie", [`${HTTP_COOKIE_NAME}=${jwt}`]);
};

export const fetchMockTermbaseData = async (
  termbaseUUID: UUID,
  requestClient: SuperAgentTest,
) => {
  const jwt = generateJWT(
    Role.User
  );

  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as
    { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
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
  const jwt = generateJWT(
    Role.User
  );
  
  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`) 
    .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termResponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
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
  const jwt = generateJWT(
    Role.User
  );

  const { body: termbaseCreationResponse } = await requestClient
    .get(`/termbase/${termbaseUUID}/terms?page=1`)
    .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
      { body: GetTermbaseTermsEndpointResponse };

  for (const term of termbaseCreationResponse.terms) {
    const { body: termReponse } = await requestClient
      .get(`/termbase/${termbaseUUID}/term/${term.uuid}`)
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]) as 
        { body: GetTermEndpointResponse };

    if (termReponse.auxElements.length !== 0) {
      return termReponse.auxElements[0];
    }
  }

  throw new Error("Failed to fetch aux element");
};
