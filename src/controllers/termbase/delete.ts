import { Request, Response } from "express";
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import errorMessages from "../../messages/errors";
import { Logger } from "winston";

class DeleteTermbaseController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
  }

  public async handle(req: Request, res: Response) {
    const { 
      termbaseUUID 
    } = req.params;

    try {
      await this.dbClient<dbTypes.Base>(tables.baseTable.fullTableName)
        .where({
          termbase_uuid: termbaseUUID,
        })
        .delete();

      res.status(204).send();
    } catch(err: any) {
      res.status(500).json({
        error: errorMessages.unexpectedError
      });

      this.logger.error(err);
    }
  }
}

export default DeleteTermbaseController;