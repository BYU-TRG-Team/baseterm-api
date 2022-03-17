import { Request, Response } from "express";
import * as yup from "yup";
import errorMessages from "../../messages/errorMessages";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { Knex } from "knex";
import Helpers from "../../helpers";
import { TbxEntity } from "../../db/classes";
import { Logger } from "winston";
import { handleInvalidBody } from "../../responses/errors";
import { uuid } from "uuidv4";
import { PostTermEndpointResponse } from "types/responses";

class PostTermController {
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
        termbaseUUID
      } = req.params;

      const {
        value,
        langSecUUID
      } = req.body;

      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: langSecUUID,
      });

      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: uuid()
      });

      const newTermUUID = await this.dbClient.transaction(async (transac) => {
        await transac<dbTypes.Term>(tables.termTable.fullTableName)
          .insert({
            uuid: termEntity.uuid,
            value,
            termbase_uuid: termbaseUUID,
            order: await this.helpers.computeNestedNextOrder(
              langSecEntity,
              tables.termTable,
              transac
            )
          });

        await this.helpers.saveChildTable(
          langSecEntity,
          termEntity,
          transac,
        );

        return termEntity.uuid;
      })

      res.status(200).json({
        uuid: newTermUUID,
      } as PostTermEndpointResponse);

    } catch(err: any) {
      // TODO: can also just abstract this into a response
      res.status(500).json({
        error: errorMessages.unexpectedError,
      });

      this.logger.error(err);
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        langSecUUID: yup.string().required(),
        value: yup.string().required(),
      }).required()
    });
  }
}

export default PostTermController;