import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { SessionSSEEndpointResponse } from "../../src/types/responses";
import EventSource from "eventsource";
import { generateJWT } from "../helpers";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
const jwt = generateJWT(
	Role.Staff
);

describe("tests Session controller", () => {
  beforeAll(() => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a response indicating an undefined session", async () => {
    const { url } = requestClient.get("/");

    await (async function(){
      await new Promise((resolve) => {
        const es = new EventSource(
          `${url}session/${uuid()}`,
          { 
            withCredentials: true,
            headers: {
              "Cookie": `TRG_AUTH_TOKEN=${jwt}`,
            }
          }
        );
    
        es.onmessage = (e) => {
          const fileSession = JSON.parse(e.data) as SessionSSEEndpointResponse;

          expect(fileSession.errorCode).toBe(404);
          es.close();
          resolve(fileSession);
        };
      });
    }
    )();
  });
});