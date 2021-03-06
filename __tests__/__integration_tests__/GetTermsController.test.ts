import "dotenv/config";
import constructServer from "../../src/app";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { uuid } from "uuidv4";
import { GetTermbaseTermsEndpointResponse } from "../../src/types/responses";
import { generateJWT, importFile } from "../helpers";
import { Role } from "@byu-trg/express-user-management";
import { UUID } from "../../src/types";

let requestClient: SuperAgentTest;
let handleShutDown: () => Promise<void>;
let mockData: {
  termbaseUUID: UUID,
}
const jwt = generateJWT(
	Role.User
);

describe("tests GetTerms controller", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app);

    const termbaseUUID = await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient
    );

		mockData = {
			termbaseUUID,
		};
  });

  afterAll(async () => {
		await handleShutDown();
	});

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${uuid()}/terms?page=1`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of 8 terms", async () => { 
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(8);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 2,
      perPage: 8,
      totalCount: 13
    });
  });

  test("should return a response with an array of 8 terms", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(8);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 2,
      perPage: 8,
      totalCount: 13
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1&language=de`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);    

    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(1);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1&term=base`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(2);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 2
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1&part_of_speech=verb`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);
    
    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(1);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1&customer=IBM`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(1);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await requestClient
      .get(`/termbase/${mockData.termbaseUUID}/terms?page=1&concept_id=c1`)
      .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`]);

    const responseBody = body as GetTermbaseTermsEndpointResponse;

    expect(status).toBe(200);
    expect(responseBody.terms.length).toBe(1);
    expect(responseBody.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });
});

