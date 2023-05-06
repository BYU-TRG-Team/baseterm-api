import { v4 as uuid } from "uuid";
import { SessionSSEEndpointResponse } from "@typings/responses";
import EventSource from "eventsource";
import { generateJWT, getTestAPIClient } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { TestAPIClient } from "@tests/types";

let testApiClient: TestAPIClient;
const jwt = generateJWT(
  Role.Staff
);

describe("tests Session controller", () => {
  beforeAll(async () => {
    testApiClient = await getTestAPIClient();
  });

  afterAll(async () => {
    await testApiClient.tearDown();
  });

  test("should return a response indicating an undefined session", async () => {
    const { url } = testApiClient.requestClient.get("/");

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