import "dotenv/config";
import constructServer from "../../../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { 
  generateJWT, 
  importFile 
} from "../../../helpers";
import { PostPersonRefObjectEndpointResponse } from "../../../../src/types/responses";
import { UUID } from "../../../../src/types";
import { describe } from "../../../../src/utils";
import errorMessages from "../../../../src/messages/errors";
import { SuperAgentResponse } from "../../../types";
import { Role } from "@byu-trg/express-user-management";
import { uuid } from "uuidv4";

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

describe("tests PostPersonRefObject controller", async () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example-tbx/valid-tbx-core.tbx`,
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
