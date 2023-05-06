import supertest from "supertest";

export interface SuperAgentResponse<T> {
    body: T,
    status: number,
}

export interface TestAPIClient {
    tearDown: () => Promise<void>,
    requestClient: supertest.SuperAgentTest,
}