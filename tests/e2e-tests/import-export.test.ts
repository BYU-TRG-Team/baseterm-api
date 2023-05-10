import { diffAsXml } from "diff-js-xml";
import fs from "fs";
import { SMALL_TBX_FILES, LARGE_TBX_FILES } from "@tests/constants";
import { exportTBXFile, importTBXFile } from "@tests/helpers";

const TEST_TIMEOUT = 300_000; // 5 minutes

describe("tests the lifecycle of a TBX file (import and export)", () => {
  test("should import each small tbx file and export an identical file 10 times", async () => {
    for (const tbxFile of SMALL_TBX_FILES) {
      process.stdout.write(`Testing ${tbxFile}\n`);
      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();
      
      for (let i = 0; i < 10; ++i) {
        const termbaseUUID = await importTBXFile({
          filePath: tbxFile,
          createPersonRefObject: false,
        });
  
        const exportedTbxFile = await exportTBXFile(termbaseUUID);
  
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
  }, TEST_TIMEOUT);

  test("should import each large tbx file and export an identical file", async () => {
    for (const tbxFile of LARGE_TBX_FILES) {
      process.stdout.write(`Testing ${tbxFile}\n`);
      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();

      const termbaseUUID = await importTBXFile({
        filePath: tbxFile,
        createPersonRefObject: false,
      });

      const exportedTbxFile = await exportTBXFile(termbaseUUID);

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
  }, TEST_TIMEOUT);
});