import { diffAsXml } from "diff-js-xml";
import fs from "fs";
import { v4 as uuid } from "uuid";
import EventSource from "eventsource";
import { 
  ImportEndpointResponse,
  ExportEndpointResponse,
} from "@typings/responses";
import { FileServiceSession } from "@typings/sessions";
import testApiClient from "@tests/test-api-client";
import { TEST_API_CLIENT_ENDPOINT, TEST_API_CLIENT_COOKIES, SMALL_TBX_FILES, LARGE_TBX_FILES } from "@tests/constants";

const TEST_TIMEOUT = 300_000; // 5 minutes

describe("tests the lifecycle of a TBX file (import and export)", () => {
  test("should import each small tbx file and export an identical file 10 times", async () => {
    for (const tbxFile of SMALL_TBX_FILES) {
      process.stdout.write(`Testing ${tbxFile}\n`);
      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();
        
      for (let iteration = 0; iteration < 10; ++iteration) {
        // Import TBX file
        const { status: importStatus, body: importBody } = (
            await testApiClient
              .post("/import")
              .attach("tbxFile", tbxFile)
              .set("Cookie", TEST_API_CLIENT_COOKIES)
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
                "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
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
              .set("Cookie", TEST_API_CLIENT_COOKIES)
          ) as { status: number,  body: ExportEndpointResponse };

        expect(exportStatus).toBe(202);
        expect(exportBody.sessionId).toBeDefined();

        const exportedTbxFileAsString = await new Promise<string>((resolve) => {
          const es = new EventSource(
            `${TEST_API_CLIENT_ENDPOINT}/session/${exportBody.sessionId}`,
            {
              withCredentials: true,
              headers: {
                "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
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
  }, TEST_TIMEOUT);

  test("should import each large tbx file and export an identical file", async () => {
    for (const tbxFile of LARGE_TBX_FILES) {
      process.stdout.write(`Testing ${tbxFile}\n`);
      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();

      // Import TBX file
      const { status: importStatus, body: importBody } = (
        await testApiClient
          .post("/import")
          .attach("tbxFile", tbxFile)
          .set("Cookie", TEST_API_CLIENT_COOKIES)
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
              "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
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
          .set("Cookie", TEST_API_CLIENT_COOKIES)
      ) as { status: number,  body: ExportEndpointResponse };

      expect(exportStatus).toBe(202);
      expect(exportBody.sessionId).toBeDefined();

      const exportedTbxFileAsString = await new Promise<string>((resolve) => {
        const es = new EventSource(
          `${TEST_API_CLIENT_ENDPOINT}/session/${exportBody.sessionId}`,
          {
            withCredentials: true,
            headers: {
              "Cookie": TEST_API_CLIENT_COOKIES.join("; ")
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
  }, TEST_TIMEOUT);
});