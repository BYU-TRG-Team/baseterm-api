import { Request, Response } from "express";
import TBXValidator from "@support/tbx-validator";
import * as yup from "yup";
import errorMessages from "@messages/errors";
import TBXConsumer from "@support/tbx-consumer";
import { parseStringPromise as xml2JsParser } from "xml2js";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { isDefined } from "@utils";
import { uuid } from "uuidv4";
import GlobalStore from "@services/store";
import { Logger } from "winston";
import { ImportEndpointResponse } from "@typings/responses";
import { handleInvalidBody, handleInvalidTbxFile } from "@responses/errors";

class ImportController {
  private tbxValidator: TBXValidator;
  private tbxConsumer: TBXConsumer;
  private globalStore: GlobalStore;
  private logger: Logger;

  constructor(
    tbxValidator: TBXValidator, 
    tbxConsumer: TBXConsumer, 
    globalStore: GlobalStore, 
    logger: Logger
  ) {
    this.tbxValidator = tbxValidator;
    this.tbxConsumer = tbxConsumer;
    this.globalStore = globalStore;
    this.logger = logger;
  }

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
    }

    if (
      req.files === undefined || 
      req.files.tbxFile === undefined ||
      Array.isArray(req.files.tbxFile) ||
      req.body.name === undefined
    ) return;

    const tbxFile = req.files?.tbxFile?.data?.toString();

    try {
      await this.tbxValidator.validate(tbxFile);
    } catch(err) {
      const errMessage = (err as Error).message;
      return handleInvalidTbxFile(
        res,
        errMessage
      );
    }

    const termbaseUUID = uuid();
    const sessionId = uuid();
    const baseName = req.body.name as string;
    const tbxObject = await this.parseXmlWithChildOrder(
      tbxFile
    );
    const conceptEntryCount = 
      tbxObject.tbx?.text?.[0]?.body?.[0]?.conceptEntry?.length || 0;
    
    try {
      this.globalStore.set(sessionId, {
        type: "import",
        status: "in progress",
        conceptEntryNumber: 0,
        conceptEntryCount,
      });

      res.status(202).json({
        sessionId,
        termbaseUUID,
      } as ImportEndpointResponse).send();

      await this.tbxConsumer.consume({
        tbxObject, 
        baseName, 
        termbaseUUID, 
        sessionId,
        conceptEntryCount,
        globalStore: this.globalStore,
      });

      return;
 
    } catch(err: any) {
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateBase :
          err.message;

      const errorCode = 
        err.code === "23505" ?
          409 :
          500;

      this.globalStore.set(sessionId, {
        error: errorMessage,
        errorCode,
      });

      if (errorCode === 500) {
        this.logger.error(err);
      }
    }
  }

  /*
  * TODO: Refactor...is it possible to achieve this in the original validation?
  */
  private async parseXmlWithChildOrder(tbxFile: string) {
    const xmlParser = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      isArray: () => true,
    });
    const xmlBuilder = new XMLBuilder({
      preserveOrder: true,
      ignoreAttributes: false,
    });
    const xmlWithExplicitChildren = xmlParser.parse(tbxFile);
    const root = xmlWithExplicitChildren.filter((node: any) => Object.keys(node).includes("tbx"))[0];
    
    const setOrderAttribute = (element: any, index: number) => {
      if (isDefined(element[":@"])) element[":@"]["@_order"] = index;
      else {
        element[":@"] = {
          "@_order": index
        };
      }
    };
    const recursivelyCallChildren = (element: any) => {
      Object.keys(element).forEach((key) => {
        if (
          key !== ":@" && 
          typeof element[key] !== "string"
        ) {

          (element[key] as Array<any>).forEach((child: any, index: number) => {
            setOrderAttribute(child, index);
            recursivelyCallChildren(child);
          });
        }
      });
    };
    recursivelyCallChildren(root);
    const tbxFileWithOrderAttribute = xmlBuilder.build(xmlWithExplicitChildren);

    return await xml2JsParser(tbxFileWithOrderAttribute);
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      files: yup.object().shape({
        tbxFile: yup.object().required(),
      }).required(),
      body: yup.object({
        name: yup.string().required(),
      }).required()
    });
  }
}

export default ImportController;