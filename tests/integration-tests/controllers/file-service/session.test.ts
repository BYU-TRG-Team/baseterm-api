import { v4 as uuid } from "uuid";
import { SessionSSEEndpointResponse } from "@typings/responses";
import EventSource from "eventsource";
import { generateJWT } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import { TEST_API_CLIENT_ENDPOINT } from "@tests/constants";

const jwt = generateJWT(
  Role.Staff
);

describe("tests Session controller", () => {
  test("should return a response indicating an undefined session", async () => {
    await new Promise((resolve) => {
      const eventSource = new EventSource(
        `${TEST_API_CLIENT_ENDPOINT}/session/${uuid()}`,
        { 
          withCredentials: true,
          headers: {
            "Cookie": `TRG_AUTH_TOKEN=${jwt}`,
          }
        }
      );
  
      eventSource.onmessage = (event) => {
        const fileSession = JSON.parse(event.data) as SessionSSEEndpointResponse;

        expect(fileSession.errorCode).toBe(404);
        eventSource.close();
        resolve(fileSession);
      };
    });
  });
});