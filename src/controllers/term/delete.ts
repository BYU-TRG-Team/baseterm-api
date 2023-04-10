import { Request, Response } from "express";
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import errorMessages from "../../messages/errors";
import { Logger } from "winston";
import Helpers from "../../helpers";
import TermService from "../../services/db/term";
import { TbxEntity } from "../../db/classes";

class DeleteTermController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private helpers: Helpers;
  private termService: TermService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    termService: TermService,
    helpers: Helpers,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.helpers = helpers;
    this.termService = termService;
  }

  public async handle(req: Request, res: Response) {
    const { 
      termUUID
    } = req.params;

    try {
      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: termUUID,
      });

      const parentLangSec = await this.helpers.getParentTable<dbTypes.LangSec>(
        termEntity,
        tables.langSecTable,
        this.dbClient
      );

      if (parentLangSec === null) {
        throw new Error(`No language section found for term with uuid ${termUUID}`);
      }

      const langSecTerms = 
        await this.helpers.getChildTables<dbTypes.Term>(
          new TbxEntity({
            ...tables.langSecTable,
            uuid: parentLangSec.uuid
          }),
          tables.termTable,
          this.dbClient
        );

      if (langSecTerms.length === 1) {
        return res.status(400).json({
          error: "Language Sections must have at least one term."
        })
      }

      await this.dbClient.transaction(async (transac) => {
        await this.termService.deleteTerm(
          termUUID,
          transac,
        );
      });

      res.status(204).send();
    } catch(err: any) {
      res.status(500).json({
        error: errorMessages.unexpectedError
      });

      this.logger.error(err);
    }
  }
}

export default DeleteTermController;