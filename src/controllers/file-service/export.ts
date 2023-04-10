import { Request, Response } from "express";
import { uuid } from "uuidv4";
import GlobalStore from "../../services/store";
import TBXConstructor from "../../support/tbx-constructor";
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { ExportEndpointResponse } from "../../types/responses";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import Helpers from "../../helpers";
import { handleNoResourceError } from "../../responses/errors";

class ExportController {
  private tbxConstructor: TBXConstructor;
  private globalStore: GlobalStore;
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;

  constructor(
    tbxConstructor: TBXConstructor, 
    globalStore: GlobalStore, 
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
  ) {
    this.tbxConstructor = tbxConstructor;
    this.globalStore = globalStore;
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
  }

  private publishSessionError(sessionId: string, err: any) {
    this.globalStore.set(sessionId, {
      error: (err as Error).message,
      errorCode: 500,
    });
    this.logger.error(err);
  }

  public async handle(req: Request, res: Response) {
    const { 
      termbaseUUID 
    } = req.params;
    const sessionId = uuid();
    let conceptEntryCount = 0;
    
    if (!isValidUUID(termbaseUUID)) return handleNoResourceError(res);

    try {
      const termbase = 
        this.helpers.pluckOne<dbTypes.Base>(
          await this.dbClient<dbTypes.Base>(tables.baseTable.fullTableName)
            .where({
              termbase_uuid: termbaseUUID
            })
            .select("*")
        );

      if (termbase === null) return handleNoResourceError(res);

      conceptEntryCount = (
        await this.dbClient<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
          .where({
            termbase_uuid: termbase.termbase_uuid,
          })
          .select("*")
      ).length;
      
      this.globalStore.set(sessionId, {
        type: "export",
        status: "in progress",
        conceptEntryNumber: 0,
        conceptEntryCount,
      });

      res.status(202).json({
        sessionId,
      } as ExportEndpointResponse);

      await this.tbxConstructor.export({
        sessionId,
        termbaseUUID,
        globalStore: this.globalStore,
        conceptEntryCount,
      });

    } catch(err) {
      this.publishSessionError(
        sessionId,
        err
      );
    }
  }
}

export default ExportController;