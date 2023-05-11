import { APP_ROOT } from "@constants";

export const EXAMPLE_TBX_FILE = `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`;
/*
* This term and its related language section and concept entry are easily testable due to the fact that
* - the term has aux elements 
* - the term has term notes 
* - the language section has more than one term (allowing the term to be deleted)
* - the concept entry has more than one language section (allowing the language section to be deleted) 
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