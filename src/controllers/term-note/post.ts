import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "@messages/errors";
import Helpers from "@helpers";
import * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import { handleInvalidBody } from "@responses/errors";
import { Logger } from "winston";
import * as yup from "yup";
import { TbxEntity } from "@db/classes";
import { v4 as uuid } from "uuid";
import { PostTermNoteEndpointResponse } from "@typings/responses";

class PostTermNoteController {
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
        termbaseUUID,
      } = req.params;

      const {
        isGrp,
        type,
        value,
        termUUID
      } = req.body as {
        isGrp: boolean,
        type: string,
        value: string,
        termUUID: string,
      };

      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: termUUID
      });

      const termNoteEntity = new TbxEntity({
        ...tables.termNoteTable,
        uuid: uuid()
      });

      await this.dbClient.transaction(async (transac) => {
        await transac<dbTypes.TermNote>(tables.termNoteTable.fullTableName)
          .insert({
            uuid: termNoteEntity.uuid,
            type,
            value,
            is_term_note_grp: isGrp,
            termbase_uuid: termbaseUUID,
            order: await this.helpers.computeNestedNextOrder(
              termEntity,
              tables.termNoteTable,
              transac,
            )
          });
      
        await this.helpers.saveChildTable(
          termEntity,
          termNoteEntity,
          transac
        );
      });

      return res.status(200).json({
        uuid: termNoteEntity.uuid,
      } as PostTermNoteEndpointResponse);
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
        isGrp: yup.boolean().required(),
        type: yup.string().required(),
        value: yup.string().required(),
        termUUID: yup.string().required(),
      }).required()
    });
  }
}

export default PostTermNoteController;