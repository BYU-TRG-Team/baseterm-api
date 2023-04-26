import { Request, Response } from "express";
import * as yup from "yup";
import errorMessages from "@messages/errors";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import { Knex } from "knex";
import Helpers from "@helpers";
import { TbxEntity } from "@db/classes";
import { Logger } from "winston";
import { PostTermbaseEndpointResponse } from "@typings/responses";
import { handleInvalidBody } from "@responses/errors";
import { uuid } from "uuidv4";

class PostTermbaseController {
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

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
    }

    try {
      const {
        lang,
        name,
        description = ""
      } = req.body as {
        lang: string;
        name: string;
        description?: string;
      };

      const newTermbaseUUID = 
        await this.dbClient.transaction(async (transac) => {    
          const newBase =
            this.helpers.pluckOne<dbTypes.Base>(
              await transac<dbTypes.Base>(tables.baseTable.fullTableName)
                .insert({ 
                  type: "TBX-Basic",
                  style: "dca",
                  xml_lang: lang,
                  xmlns: "urn:iso:std:iso:30042:ed-2",
                  name,
                }, ["*"])
            );

          if (newBase === null) return; 

          await transac<dbTypes.Text>(tables.textTable.fullTableName)
            .insert({
              termbase_uuid: newBase.termbase_uuid,
            });

          await transac<dbTypes.Body>(tables.bodyTable.fullTableName)
            .insert({
              termbase_uuid: newBase.termbase_uuid,
            });

          await transac<dbTypes.Back>(tables.backTable.fullTableName)
            .insert({
              termbase_uuid: newBase.termbase_uuid,
            });

          await transac<dbTypes.Header>(tables.headerTable.fullTableName)
            .insert({
              termbase_uuid: newBase.termbase_uuid,
            });

          await transac<dbTypes.FileDesc>(tables.fileDescTable.fullTableName)
            .insert({
              termbase_uuid: newBase.termbase_uuid,
            });

          const sourceDescEntity = new TbxEntity({
            ...tables.sourceDescTable,
            uuid: uuid(),
          });

          const headerNoteEntity = new TbxEntity({
            ...tables.headerNoteTable,
            uuid: uuid(),
          });
        
          await transac<dbTypes.SourceDesc>(tables.sourceDescTable.fullTableName)
            .insert({
              uuid: sourceDescEntity.uuid,
              termbase_uuid: newBase.termbase_uuid
            });

          await transac<dbTypes.HeaderNote>(tables.headerNoteTable.fullTableName)
            .insert({
              uuid: headerNoteEntity.uuid,
              termbase_uuid: newBase.termbase_uuid,
              value: description,
              order: 0,
            });
        
          await this.helpers.saveChildTable(
            sourceDescEntity,
            headerNoteEntity,
            transac,
          );

          return newBase.termbase_uuid;
        });

      res.status(200).json({
        uuid: newTermbaseUUID,
      } as PostTermbaseEndpointResponse);

    } catch(err: any) {
      //TODO: same with the duplicate base...we want to catch early
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateBase :
          errorMessages.unexpectedError;

      const errorCode = 
        err.code === "23505" ?
          409:
          500;
      
      res.status(errorCode).json({
        error: errorMessage
      });

      if (errorCode === 500) {
        this.logger.error(err);
      }
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        name: yup.string().required(),
        lang: yup.string().required(),
        description: yup.string().notRequired(),
      }).required()
    });
  }
}

export default PostTermbaseController;