import { v4 as uuid } from "uuid";
import { GetTermbaseTermsEndpointResponse } from "@typings/responses";
import { generateTestData } from "@tests/helpers";
import testApiClient, { TEST_API_CLIENT_COOKIES } from "@tests/test-api-client";
import { TestAPIClientResponse, TestData } from "@tests/types";

let testData: TestData;

describe("tests GetTerms controller", () => {
  beforeAll(async () => {
    testData = await generateTestData();
  });

  test("should return a 404 response for invalid uuid (unknown uuid)", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${uuid()}/terms?page=1`)
      .set("Cookie", TEST_API_CLIENT_COOKIES);

    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  test("should return a response with an array of 8 terms", async () => { 
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(8);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 2,
      perPage: 8,
      totalCount: 13
    });
  });

  test("should return a response with an array of 8 terms", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(8);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 2,
      perPage: 8,
      totalCount: 13
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1&language=de`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(1);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1&term=base`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(2);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 2
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1&part_of_speech=verb`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;
    
    expect(status).toBe(200);
    expect(body.terms.length).toBe(1);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1&customer=IBM`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(1);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });

  test("should return a response with an array of 1 term", async () => {
    const { status, body } = await testApiClient
      .get(`/termbase/${testData.termbaseUUID}/terms?page=1&concept_id=c1`)
      .set("Cookie", TEST_API_CLIENT_COOKIES) as TestAPIClientResponse<GetTermbaseTermsEndpointResponse>;

    expect(status).toBe(200);
    expect(body.terms.length).toBe(1);
    expect(body.pagination).toStrictEqual({
      page: 1,
      pageCount: 1,
      perPage: 8,
      totalCount: 1
    });
  });
});

