import { Request, Response } from "express";
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import LangSecService from "../../services/db/lang-sec";
import errorMessages from "../../messages/errors";
import { Logger } from "winston";
import Helpers from "../../helpers";
import { TbxEntity } from "../../db/classes";

class DeleteLangSecController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private langSecService: LangSecService;
  private helpers: Helpers;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    langSecService: LangSecService,
    helpers: Helpers
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.langSecService = langSecService;
    this.helpers = helpers;
  }

  public async handle(req: Request, res: Response) {
    const { 
      langSecUUID,
    } = req.params;

    try {
      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: langSecUUID,
      });

      const parentConceptEntry = await this.helpers.getParentTable<dbTypes.ConceptEntry>(
        langSecEntity,
        tables.conceptEntryTable,
        this.dbClient,
      );

      if (parentConceptEntry === null) {
        throw new Error(
          `No concept entry found for lang sec with uuid ${langSecUUID}`
        );
      }

      const conceptEntryLangSecs = 
        await this.helpers.getChildTables<dbTypes.LangSec>(
          new TbxEntity({
            ...tables.conceptEntryTable,
            uuid: parentConceptEntry.uuid
          }),
          tables.langSecTable,
          this.dbClient,
        );

      if (conceptEntryLangSecs.length === 1) {
        return res.status(400).json({
          error: "Concept entries must have at least one language section."
        });
      }

      await this.dbClient.transaction(async (transac) => {
        await this.langSecService.deleteLangSec(
          langSecUUID,
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

export default DeleteLangSecController;