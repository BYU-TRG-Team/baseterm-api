import { diffAsXml } from "diff-js-xml";
import fs from "fs";
import { exportFile, importFile } from "@tests/helpers";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { v4 as uuid } from "uuid";

const smallTbxFiles = [
  `${APP_ROOT}/example-tbx/valid-tbx-core.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test1.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test5.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test6.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test8.tbx`,
];

const largeTbxFiles = [
  `${APP_ROOT}/example-tbx/test-files/test2.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test3.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test4.tbx`,
  `${APP_ROOT}/example-tbx/test-files/test7.tbx`,
];

describe("tests the lifecycle of a TBX file (import and export)", () => {
  test("should import each small tbx file and export an identical file 10 times", async () => {
    for (const tbxFile of smallTbxFiles) {
      process.stdout.write(`Testing ${tbxFile}\n`);

      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();
     
      for (let iteration = 0; iteration < 10; ++iteration) {
        const termbaseUUID = await importFile(
          tbxFile,
          testApiClient,
          uuid(),
          uuid(),
          false
        );

        const exportedTbxFile = await exportFile(
          termbaseUUID,
          testApiClient
        );

        diffAsXml(
          tbxFileAsString, 
          exportedTbxFile, 
          {}, 
          {
            xml2jsOptions: {
              ignoreAttributes: false,
              trim: true,
              preserveChildrenOrder: true,
              explicitChildren: true,
            }
          }, 
          (diffs: any[]) => {
            expect(diffs.length).toBe(0);
          } 
        );
      }
    }
  }, 600000);

  test("should import each large tbx file and export an identical file", async () => {
    for (const tbxFile of largeTbxFiles) {
      process.stdout.write(`Testing ${tbxFile}\n`);

      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();
      const termbaseUUID = await importFile(
        tbxFile,
        testApiClient,
        uuid(),
        uuid(),
        false
      );
      
      const exportedTbxFile = await exportFile(
        termbaseUUID,
        testApiClient
      );

      diffAsXml(
        tbxFileAsString, 
        exportedTbxFile, 
        {}, 
        {
          xml2jsOptions: {
            ignoreAttributes: false,
            trim: true,
            preserveChildrenOrder: true,
            explicitChildren: true,
          }
        }, 
        (diffs: any[]) => {
          expect(diffs.length).toBe(0);
        } 
      );
    }
  }, 600000);
});