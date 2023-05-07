import supertest from "supertest";
import { TEST_API_CLIENT_ENDPOINT } from "@tests/constants";

export default supertest.agent(TEST_API_CLIENT_ENDPOINT);