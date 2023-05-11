import { APP_ROOT } from "@constants";

export const VALID_LANGUAGE_CODE = "en-US";
export const EXAMPLE_TBX_FILE = `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`;
/*
* This term and its metadata are easily testable due to the fact that the term
* - has aux elements 
* - has term notes 
* - is a child of a language section with more than one term (allowing the term to be deleted)
* - is a child of a concept entry with more than one language section (allowing the term's language section to be deleted) 
*/
export const EXAMPLE_TBX_FILE_TESTABLE_TERM = "PAL";
export const SMALL_TBX_FILES = [
  EXAMPLE_TBX_FILE,
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