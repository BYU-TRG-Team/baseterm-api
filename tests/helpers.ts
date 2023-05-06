import {
  GetTermbaseTermsEndpointResponse,
  GetTermEndpointResponse,
  ImportEndpointResponse,
  SessionSSEEndpointResponse
} from "@typings/responses";
import { v4 as uuid } from "uuid";
import supertest, { SuperAgentTest } from "supertest";
import { UUID } from "@typings";
import EventSource from "eventsource";
import jwt from "jsonwebtoken";
import { Role } from "@byu-trg/express-user-management";
import express from "express";
import constructServer from "@app";
import { TestAPIClient } from "@tests/types";

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

export const importFile = async (
  filePath: string,
  requestClient: SuperAgentTest,
  name: string = uuid(),
  personId = uuid(),
) => {
  const { url } = requestClient.get("/");
  const jwt = generateJWT(
    Role.Staff,
    personId,
  );

  const { body: importBody } = (
      await requestClient
        .post("/import")
        .attach("tbxFile", filePath)
        .field({ name }) 
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { body: ImportEndpointResponse };

  await (async function(){
    await new Promise((resolve, reject) => {
      const es = new EventSource(
        `${url}session/${importBody.sessionId}`,
        { 
          withCredentials: true,
          headers: {
            "Cookie": `TRG_AUTH_TOKEN=${jwt}`
          }
        }
      );
    
      es.onmessage = (e) => {
        const fileSession = JSON.parse(e.data) as SessionSSEEndpointResponse;

        if (fileSession.status === "completed") {
          es.close();
          resolve(fileSession);
        }

        if (fileSession.error !== undefined) {
          es.close();
          reject(fileSession.errorCode);
        }
      };
    });
  }
  )();

  await postPersonObjectRef(
    jwt,
    importBody.termbaseUUID,
    requestClient,
    personId,
  );

  return importBody.termbaseUUID as UUID;
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

export const generateJWT = (
  role: Role,
  personId: UUID = uuid(),
) => {
  return (
    jwt.sign({
      id: personId, 
      role, 
      verified: true, 
      username: "test",
    }, process.env.AUTH_SECRET as string)
  );
};

export const getTestAPIClient = async (): Promise<TestAPIClient> => {
  const app = express();
  const tearDown = await constructServer(app);
  const requestClient = supertest.agent(app);
  return {
    tearDown,
    requestClient,
  };
};