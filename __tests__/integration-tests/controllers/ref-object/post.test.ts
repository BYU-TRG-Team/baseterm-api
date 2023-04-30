import constructServer from "@app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { 
  generateJWT, 
  importFile 
} from "@tests/helpers";
import { PostPersonRefObjectEndpointResponse } from "@typings/responses";
import { UUID } from "@typings";
import errorMessages from "@messages/errors";
import { SuperAgentResponse } from "@tests/types";
import { Role } from "@byu-trg/express-user-management";
import { uuid } from "uuidv4";
import { APP_ROOT } from "@constants";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID
};

const endpointConstructor = (
  termbaseUUID: UUID,
) => `/termbase/${termbaseUUID}/personRefObject`;
const userId = uuid();
const jwt = generateJWT(
  Role.User,
  userId
);

describe("tests PostPersonRefObject controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
      requestClient
    );

    mockData = {
      termbaseUUID
    };
  });

  afterAll(async () => {
    await handleShutDown();
  });

  test("should return a 400 response for invalid body", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID,
        )
      )
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.bodyInvalid);
  });

  test("should return a 400 response for user id mismatch", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: uuid()
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
  
    expect(status).toBe(400);
    expect(body.error).toBe(errorMessages.userIdMismatch);
  });
  
  test("should return a 200 response for successful creation of a person object", async () => {
    const { status, body } = await requestClient
      .post(
        endpointConstructor(
          mockData.termbaseUUID
        )
      )
      .field({
        name: "Test",
        email: "Test",
        role: "Test",
        id: userId
      })
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]) as
      SuperAgentResponse<PostPersonRefObjectEndpointResponse>;

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });
});
