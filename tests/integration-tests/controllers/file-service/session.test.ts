import { v4 as uuid } from "uuid";
import { SessionSSEEndpointResponse } from "@typings/responses";
import EventSource from "eventsource";
import { TEST_API_CLIENT_COOKIES, TEST_API_CLIENT_ENDPOINT } from "@tests/test-api-client";

describe("tests Session controller", () => {
  test("should return a response indicating an undefined session", async () => {
    await new Promise((resolve) => {
      const sessionId = uuid();
      const eventSource = new EventSource(
        `${TEST_API_CLIENT_ENDPOINT}/session/${sessionId}`,
        { 
          withCredentials: true,
          headers: {
            "Cookie": TEST_API_CLIENT_COOKIES.join("; "),
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