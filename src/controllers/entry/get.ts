import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import Helpers from "../../helpers";
import { GetEntryEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import AuxElementService from "../../services/db/aux-element";
import { TbxEntity } from "../../db/classes";

class GetEntryController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.logger = logger;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try { 
      const { 
        entryUUID 
      } = req.params;

      if (!isValidUUID(entryUUID)) return handleNoResourceError(res);

      const conceptEntry = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
            .where({
              uuid: entryUUID,
            })
            .select("*")
        );

      if (conceptEntry === null) return handleNoResourceError(res);

      const conceptEntryEntity = new TbxEntity({
        ...tables.conceptEntryTable,
        uuid: conceptEntry.uuid,
      });

      const auxElements = await this.auxElementService.retrieveAuxInfo(
        conceptEntryEntity
      );

      const langSecs = await this.helpers.getChildTables<dbTypes.LangSec>(
        conceptEntryEntity,
        tables.langSecTable,
        this.dbClient
      );
      
      const response: GetEntryEndpointResponse = {
        ...conceptEntry,
        termbaseUUID: conceptEntry.termbase_uuid,
        auxElements,
        languageSections: langSecs.map((langSec) => ({
          ...langSec,
          xmlLang: langSec.xml_lang,
          termbaseUUID: langSec.termbase_uuid
        }))
      };
      
      return res.status(200).json(response);

    } catch(err) { 
      res.status(500).json({
        error: errorMessages.unexpectedError
      });
      
      this.logger.error(err);
    }
  }
}

export default GetEntryController;