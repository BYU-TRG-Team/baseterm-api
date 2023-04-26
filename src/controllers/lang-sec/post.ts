import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "@messages/errors";
import * as tables from "@db/tables";
import { handleInvalidBody } from "@responses/errors";
import { Logger } from "winston";
import * as yup from "yup";
import { TbxEntity } from "@db/classes";
import { uuid } from "uuidv4";
import { PostLangSecEndpointResponse } from "@typings/responses";
import LangSecService from "@services/db/lang-sec";

class PostLangSecController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private langSecService: LangSecService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    langSecService: LangSecService,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.langSecService = langSecService;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {
      await this.getValidator().validate(req);
    } catch(err) {
      const validationError = (err as Error).message;
      return handleInvalidBody(res, validationError);
    }

    try {
      const {
        termbaseUUID
      } = req.params;

      const {
        entryUUID,
        langCode,
        initialTerm,
      } = req.body as {
        entryUUID: string,
        langCode: string,
        initialTerm: string,
      };

      const newLangSecUUID = await this.dbClient.transaction(async (transac) => {
        const entryEntity = new TbxEntity({
          ...tables.conceptEntryTable,
          uuid: entryUUID,
        });
  
        const langSecEntity = new TbxEntity({
          ...tables.langSecTable,
          uuid: uuid(),
        });
        
        return await this.langSecService.constructLangSec(
          langCode,
          initialTerm,
          langSecEntity,
          entryEntity,
          termbaseUUID,
          req.userId,
          transac
        );
      });

      return res.status(200).json({
        uuid: newLangSecUUID 
      } as PostLangSecEndpointResponse);
      
    } catch(err: any) {
      res.status(500).json({
        error: errorMessages.unexpectedError,
      });

      this.logger.error(err);
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        entryUUID: yup.string().required(),
        langCode: yup.string().required().isValidLangCode({ required: true }),
        initialTerm: yup.string().required(),
      }).required()
    });
  }
}

export default PostLangSecController;