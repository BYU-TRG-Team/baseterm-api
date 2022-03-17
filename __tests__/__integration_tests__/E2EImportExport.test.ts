import "dotenv/config";
import supertest, { SuperAgentTest } from "supertest";
import express from "express";
import { diffAsXml} from "diff-js-xml";
import fs from "fs";
import { uuid } from "uuidv4";
import EventSource from "eventsource";
import { 
  SessionSSEEndpointResponse,
  ImportEndpointResponse,
  ExportEndpointResponse,
  ValidationEndpointResponse
} from "../../src/types/responses";
import { FileServiceSession } from "../../src/types/sessions";
import { generateJWT, importFile } from "../helpers";
import constructServer from "../../src/app";
import { Role } from "@byu-trg/express-user-management";

let handleShutDown: () => Promise<void>;
let requestClient: SuperAgentTest;
const jwt = generateJWT(
	Role.Staff
);
const testTbxFiles = [
  `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
  `${process.env.APP_DIR}/example_tbx/test_files/test1.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test2.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test3.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test4.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test5.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test6.tbx`,
  // `${process.env.APP_DIR}/example_tbx/test_files/test7.tbx`,
  `${process.env.APP_DIR}/example_tbx/test_files/test8.tbx`,
];

describe("tests Import, Export, and Session controllers", () => {
  beforeAll(() => {
    const app = express();
    handleShutDown = constructServer(app);
    requestClient = supertest.agent(app, {

    });
  });

  afterAll(async () => {
    await handleShutDown();
  });

  test(
    `should import a tbx file and export the same file 20 times
    
    Lopping this should thoroughly test the core relational logic of our DB and API.
    TODO: Add more test files
    `, 
    async () => {
      const { url } = requestClient.get("/");

      for (const testTbxFile of testTbxFiles) {
        process.stdout.write(`Testing ${testTbxFile}\n`);
        let iteration = 1;
    
        while(iteration < 21) {
          let importFileSession: SessionSSEEndpointResponse;
          let exportFileSession: SessionSSEEndpointResponse;

          const { status: importStatus, body: importBody } = (
            await requestClient
              .post("/import")
              .attach("tbxFile", testTbxFile)
              .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
              .field({ name: uuid()})
          ) as { status: number, body: ImportEndpointResponse };
           
          const originalTbxFile =  fs.readFileSync(testTbxFile).toString();
          expect(importStatus).toBe(202);
          expect(importBody.sessionId).toBeDefined();
          expect(importBody.termbaseUUID).toBeDefined();

          await (async function(){
            await new Promise((resolve) => {
              const es = new EventSource(
                `${url}session/${importBody.sessionId}`,
                {
                  withCredentials: true,
                  headers: {
                    "Cookie": `TRG_AUTH_TOKEN=${jwt}`
                  }
                }
              );
    
              es.onmessage = (e) => {
                const fileSession = JSON.parse(e.data) as FileServiceSession;
                importFileSession = fileSession;

                process.stdout.write(`\rIteration ${iteration}: Imported ${importFileSession.conceptEntryNumber} of ${importFileSession.conceptEntryCount}`);
                
                if (fileSession.status === "completed") {
                  es.close();
                  resolve(fileSession);
                }
              };
            });
          }
          )();

          const {  status: exportStatus, body: exportBody } = (
            await requestClient
              .get(`/export/${importBody.termbaseUUID}`)
              .set('Cookie', [`TRG_AUTH_TOKEN=${jwt}`])
          ) as { status: number,  body: ExportEndpointResponse };

          expect(exportStatus).toBe(202);
          expect(exportBody.sessionId).toBeDefined();

          const exportedTbxFile = await (async function(){
            return await new Promise<string>((resolve) => {
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
                exportFileSession = fileSession;
                
                process.stdout.write(
                  `\rIteration ${iteration}: Imported ${importFileSession.conceptEntryNumber} of ${importFileSession.conceptEntryCount}, Exported ${exportFileSession.conceptEntryNumber} of ${exportFileSession.conceptEntryCount}`
                );
                
                if (fileSession.status === "completed") {
                  es.close();
                  resolve(fileSession.data as string);
                }
              };
            });
          }
          )();

          process.stdout.write("\n");

          const exportedTbxFileBuffer = Buffer.from(exportedTbxFile);
          const { status: validationStatus, body: validationBody } = (
            await requestClient
              .post("/validate")
              .attach("tbxFile", exportedTbxFileBuffer, "some_file.txt")
              .field({ name: uuid()})
          ) as { status: number, body: ValidationEndpointResponse };

          expect(validationStatus).toBe(200);
          expect(validationBody.tbx).toBeDefined();

          diffAsXml(
            originalTbxFile, 
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

          iteration += 1;
        }
      }
    }, 600000000);

  test("Session should throw an error for duplicate termbase name", async () => {
    const termbaseName = uuid();

    await importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient,
      termbaseName
    );

    await expect(importFile(
      `${process.env.APP_DIR}/example_tbx/valid_tbx_core.tbx`,
      requestClient,
      termbaseName
    )).rejects.toEqual(409);
  });    
});