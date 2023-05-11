import { APP_ROOT } from "@constants";

/*
* This term and its related language section and concept entry are easily testable due to the fact that
* - the term has aux elements 
* - the term has term notes 
* - the language section has more than one term (allowing the term to be deleted)
* - the concept entry has more than one language section (allowing the language section to be deleted) 
*
* This term is used as a basis for the generateTestData helper method
*/
export const PRIMARY_TEST_TBX_FILE_TESTABLE_TERM = "PAL";
export const PRIMARY_TEST_TBX_FILE = `${APP_ROOT}/tests/test-tbx-files/valid/test1.tbx`;
export const SMALL_TEST_TBX_FILES = [
  PRIMARY_TEST_TBX_FILE,
  `${APP_ROOT}/tests/test-tbx-files/valid/test5.tbx`,
  `${APP_ROOT}/tests/test-tbx-files/valid/test6.tbx`,
  `${APP_ROOT}/tests/test-tbx-files/valid/test8.tbx`,
];
export const LARGE_TEST_TBX_FILES = [
  `${APP_ROOT}/tests/test-tbx-files/valid/test2.tbx`,
  `${APP_ROOT}/tests/test-tbx-files/valid/test3.tbx`,
  `${APP_ROOT}/tests/test-tbx-files/valid/test4.tbx`,
  `${APP_ROOT}/tests/test-tbx-files/valid/test7.tbx`,
];
export const INVALID_TEST_TBX_FILE = `${APP_ROOT}/tests/test-tbx-files/invalid/tbx-core-no-header.tbx`;