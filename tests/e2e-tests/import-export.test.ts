import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { diffAsXml} from "diff-js-xml";
import fs from "fs";
import { uuid } from "uuidv4";
import EventSource from "eventsource";
import { 
  ImportEndpointResponse,
  ExportEndpointResponse,
} from "@typings/responses";
import { FileServiceSession } from "@typings/sessions";
import { generateJWT } from "@tests/helpers";
import constructServer from "@app";
import { Role } from "@byu-trg/express-user-management";
import { APP_ROOT } from "@constants";

let handleShutDown: () => Promise<void>;
let requestClient: SuperAgentTest;
const jwt = generateJWT(
	Role.Staff
);

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
]

describe("tests the lifecycle of a TBX file (import and export)", () => {
  beforeAll(async () => {
    const app = express();
    handleShutDown = await constructServer(app);
    requestClient = supertest.agent(app)
  });

  afterAll(async () => {
    await handleShutDown();
  });

  test("should import each small tbx file and export an identical file 10 times", async () => {
      const { url } = requestClient.get("/");

      for (const tbxFile of smallTbxFiles) {
        process.stdout.write(`Testing ${tbxFile}\n`)
        const tbxFileAsString =  fs.readFileSync(tbxFile).toString();
        
        for (let iteration = 0; iteration < 10; ++iteration) {
          // Import TBX file
          const { status: importStatus, body: importBody } = (
            await requestClient
              .post("/import")
              .attach("tbxFile", tbxFile)
              .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
              .field({ name: uuid()})
          ) as { status: number, body: ImportEndpointResponse };

          expect(importStatus).toBe(202);
          expect(importBody.sessionId).toBeDefined();
          expect(importBody.termbaseUUID).toBeDefined();
  
          await new Promise<FileServiceSession>((resolve) => {
            const eventSource = new EventSource(
              `${url}session/${importBody.sessionId}`,
              {
                withCredentials: true,
                headers: {
                  "Cookie": `TRG_AUTH_TOKEN=${jwt}`
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
            await requestClient
              .get(`/export/${importBody.termbaseUUID}`)
              .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
          ) as { status: number,  body: ExportEndpointResponse };

          expect(exportStatus).toBe(202);
          expect(exportBody.sessionId).toBeDefined();

          const exportedTbxFileAsString = await new Promise<string>((resolve) => {
            const es = new EventSource(
              `${url}session/${exportBody.sessionId}`,
              {
                withCredentials: true,
                headers: {
                  "Cookie": `TRG_AUTH_TOKEN=${jwt}`
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
    const { url } = requestClient.get("/");

    for (const tbxFile of largeTbxFiles) {
      process.stdout.write(`Testing ${tbxFile}\n`)
      const tbxFileAsString =  fs.readFileSync(tbxFile).toString();

      // Import TBX file
      const { status: importStatus, body: importBody } = (
        await requestClient
          .post("/import")
          .attach("tbxFile", tbxFile)
          .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
          .field({ name: uuid()})
      ) as { status: number, body: ImportEndpointResponse };

      expect(importStatus).toBe(202);
      expect(importBody.sessionId).toBeDefined();
      expect(importBody.termbaseUUID).toBeDefined();

      await new Promise<FileServiceSession>((resolve) => {
        const eventSource = new EventSource(
          `${url}session/${importBody.sessionId}`,
          {
            withCredentials: true,
            headers: {
              "Cookie": `TRG_AUTH_TOKEN=${jwt}`
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
        await requestClient
          .get(`/export/${importBody.termbaseUUID}`)
          .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
      ) as { status: number,  body: ExportEndpointResponse };

      expect(exportStatus).toBe(202);
      expect(exportBody.sessionId).toBeDefined();

      const exportedTbxFileAsString = await new Promise<string>((resolve) => {
        const es = new EventSource(
          `${url}session/${exportBody.sessionId}`,
          {
            withCredentials: true,
            headers: {
              "Cookie": `TRG_AUTH_TOKEN=${jwt}`
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