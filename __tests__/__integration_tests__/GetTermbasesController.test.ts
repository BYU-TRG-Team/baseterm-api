import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { GetTermbasesEndpointResponse } from "../../src/types/responses";
import { generateJWT } from "../helpers";
import { Role } from "@byu-trg/express-user-management";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
const jwt = generateJWT(
	Role.User
);

describe("tests GetTermbases controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app);
  });

  test("should return a 400 for invalid query params", async () => {
    const { status, body } = await requestClient
      .get("/termbases")
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of termbases", async () => {
    const { status, body } = (
      await requestClient
        .get("/termbases?page=1")
        .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: GetTermbasesEndpointResponse };

    expect(status).toBe(200);
    expect(body.termbases).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(Array.isArray(body.termbases)).toBeTruthy();
  });
});