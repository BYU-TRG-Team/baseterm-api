import { diffAsXml } from "diff-js-xml";
import fs from "fs";
import { v4 as uuid } from "uuid";
import EventSource from "eventsource";
import { 
  ImportEndpointResponse,
  ExportEndpointResponse,
} from "@typings/responses";
import { FileServiceSession } from "@typings/sessions";
import { APP_ROOT } from "@constants";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_ENDPOINT, TEST_AUTH_TOKEN } from "@tests/constants";

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
        // Import TBX file
        const { status: importStatus, body: importBody } = (
            await testApiClient
              .post("/import")
              .attach("tbxFile", tbxFile)
              .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
              .field({ name: uuid()})
          ) as { status: number, body: ImportEndpointResponse };

        expect(importStatus).toBe(202);
        expect(importBody.sessionId).toBeDefined();
        expect(importBody.termbaseUUID).toBeDefined();
  
        await new Promise<FileServiceSession>((resolve) => {
          const eventSource = new EventSource(
            `${TEST_API_CLIENT_ENDPOINT}/session/${importBody.sessionId}`,
            {
              withCredentials: true,
              headers: {
                "Cookie": `TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`
              }
            }
          );
  
          eventSource.onmessage = (event) => {
            const fileSession = JSON.parse(event.data) as FileServiceSession;
              
            if (fileSession.status === "completed") {
              eventSource.close();
              resolve(fileSession);
            }
          };
        });

        // Export TBX file
        const { status: exportStatus, body: exportBody } = (
            await testApiClient
              .get(`/export/${importBody.termbaseUUID}`)
              .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
          ) as { status: number,  body: ExportEndpointResponse };

        expect(exportStatus).toBe(202);
        expect(exportBody.sessionId).toBeDefined();

        const exportedTbxFileAsString = await new Promise<string>((resolve) => {
          const es = new EventSource(
            `${TEST_API_CLIENT_ENDPOINT}/session/${exportBody.sessionId}`,
            {
              withCredentials: true,
              headers: {
                "Cookie": `TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`
              }
            }
          );
  
          es.onmessage = (e) => {
            const fileSession = JSON.parse(e.data) as FileServiceSession;
              
            if (fileSession.status === "completed") {
              es.close();
              resolve(fileSession.data as string);
            }
          };
        });

        diffAsXml(
          tbxFileAsString, 
          exportedTbxFileAsString, 
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

      // Import TBX file
      const { status: importStatus, body: importBody } = (
        await testApiClient
          .post("/import")
          .attach("tbxFile", tbxFile)
          .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
          .field({ name: uuid()})
      ) as { status: number, body: ImportEndpointResponse };

      expect(importStatus).toBe(202);
      expect(importBody.sessionId).toBeDefined();
      expect(importBody.termbaseUUID).toBeDefined();

      await new Promise<FileServiceSession>((resolve) => {
        const eventSource = new EventSource(
          `${TEST_API_CLIENT_ENDPOINT}/session/${importBody.sessionId}`,
          {
            withCredentials: true,
            headers: {
              "Cookie": `TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`
            }
          }
        );

        eventSource.onmessage = (event) => {
          const fileSession = JSON.parse(event.data) as FileServiceSession;
          
          if (fileSession.status === "completed") {
            eventSource.close();
            resolve(fileSession);
          }
        };
      });

      // Export TBX file
      const { status: exportStatus, body: exportBody } = (
        await testApiClient
          .get(`/export/${importBody.termbaseUUID}`)
          .set("Cookie", [`TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`])
      ) as { status: number,  body: ExportEndpointResponse };

      expect(exportStatus).toBe(202);
      expect(exportBody.sessionId).toBeDefined();

      const exportedTbxFileAsString = await new Promise<string>((resolve) => {
        const es = new EventSource(
          `${TEST_API_CLIENT_ENDPOINT}/session/${exportBody.sessionId}`,
          {
            withCredentials: true,
            headers: {
              "Cookie": `TRG_AUTH_TOKEN=${TEST_AUTH_TOKEN}`
            }
          }
        );

        es.onmessage = (e) => {
          const fileSession = JSON.parse(e.data) as FileServiceSession;
          
          if (fileSession.status === "completed") {
            es.close();
            resolve(fileSession.data as string);
          }
        };
      });

      diffAsXml(
        tbxFileAsString, 
        exportedTbxFileAsString, 
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