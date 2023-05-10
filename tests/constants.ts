import { v4 as uuid } from "uuid";
import { Role, AuthToken } from "@byu-trg/express-user-management";
import jwt from "jsonwebtoken";
import { APP_ROOT } from "@constants";

export const VALID_LANGUAGE_CODE = "en-US";
export const EXAMPLE_TBX_FILE = `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`;
export const SMALL_TBX_FILES = [
  `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test1.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test5.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test6.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test8.tbx`,
];
export const LARGE_TBX_FILES = [
  `${APP_ROOT}/example-tbx/test-files/test2.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test3.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test4.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test7.tbx`,
];

export const TEST_API_AUTH_COOKIE_NAME = "TRG_AUTH_TOKEN";
export const TEST_API_AUTH_SECRET = "killjoy";
export const TEST_USER_ID = uuid();
export const TEST_AUTH_TOKEN = jwt.sign({
  id: TEST_USER_ID,
  role: Role.Admin,
  verified: true,
  username: "TEST-USER"
} as AuthToken, TEST_API_AUTH_SECRET);
export const TEST_API_CLIENT_COOKIES = [`${TEST_API_AUTH_COOKIE_NAME}=${TEST_AUTH_TOKEN}`];
export const TEST_API_CLIENT_ENDPOINT = "http://baseterm-api:4000";