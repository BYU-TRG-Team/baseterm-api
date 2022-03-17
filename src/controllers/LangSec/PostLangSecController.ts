import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody } from "../../responses/errors";
import { Logger } from "winston";
import * as yup from "yup";
import { TbxEntity } from "../../db/classes";
import { uuid } from "uuidv4";
import { PostLangSecEndpointResponse } from "../../types/responses";

class PostLangSecController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
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

      const entryEntity = new TbxEntity({
        ...tables.conceptEntryTable,
        uuid: entryUUID,
      });

      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: uuid(),
      });

      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: uuid()
      })

      const newLangSecUUID = await this.dbClient.transaction(async (transac) => {
        await transac<dbTypes.LangSec>(tables.langSecTable.fullTableName)
          .insert({
            uuid: langSecEntity.uuid,
            xml_lang: langCode,
            termbase_uuid: termbaseUUID,
            order: await this.helpers.computeNestedNextOrder(
              entryEntity,
              tables.langSecTable,
              transac
            )
          });

        await transac<dbTypes.Term>(tables.termTable.fullTableName)
          .insert({
            uuid: termEntity.uuid,
            value: initialTerm,
            termbase_uuid: termbaseUUID,
            order: await this.helpers.computeNextOrder(
              termbaseUUID,
              tables.termTable,
              transac
            )
          });

        await this.helpers.saveChildTable(
          entryEntity,
          langSecEntity,
          transac
        );

        await this.helpers.saveChildTable(
          langSecEntity,
          termEntity,
          transac,
        );

        return langSecEntity.uuid;
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
        langCode: yup.string().required(),
        initialTerm: yup.string().required(),
      }).required()
    })
  }
}

export default PostLangSecController;