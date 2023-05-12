import supertest from "supertest";
import { Role, AuthToken } from "@byu-trg/express-user-management";
import jwt from "jsonwebtoken";

export const TEST_API_AUTH_COOKIE_NAME = "TRG_AUTH_TOKEN";
export const TEST_API_AUTH_SECRET = "killjoy";
export const TEST_USER_ID = "c0e29bfc-279b-4235-b301-c5e439da1e15";
export const TEST_AUTH_TOKEN = jwt.sign({
  id: TEST_USER_ID,
  role: Role.Admin,
  verified: true,
  username: "TEST-USER"
} as AuthToken, TEST_API_AUTH_SECRET);
export const TEST_API_CLIENT_COOKIES = [`${TEST_API_AUTH_COOKIE_NAME}=${TEST_AUTH_TOKEN}`];
export const TEST_API_CLIENT_ENDPOINT = "http://baseterm-api:4000";

export default supertest.agent(TEST_API_CLIENT_ENDPOINT);