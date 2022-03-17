import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import { GetLanguageSectionEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import AuxElementService from "../../services/AuxElementService";
import { TbxEntity } from "../../db/classes";

class GetLangSecController {
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
        langSecUUID 
      } = req.params;

      if (!isValidUUID(langSecUUID)) return handleNoResourceError(res);

      const langSec = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.LangSec>(tables.langSecTable.fullTableName)
            .where({
              uuid: langSecUUID,
            })
            .select("*")
        );

      if (langSec === null) return handleNoResourceError(res);

      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: langSec.uuid,
      });

      const parentConceptEntry = 
        await this.helpers.getParentTable<dbTypes.ConceptEntry>(
          langSecEntity,
          tables.conceptEntryTable,
          this.dbClient
        );

      if (parentConceptEntry === null) {
        throw new Error(`No concept entry exists for language section with uuid: ${langSec.uuid}`);
      }

      const auxElements = await this.auxElementService.retrieveAuxInfo(
        langSecEntity
      );

      const terms = await this.helpers.getChildTables<dbTypes.Term>(
        langSecEntity,
        tables.termTable,
        this.dbClient,
      );

      const response: GetLanguageSectionEndpointResponse = {
        ...langSec,
        termbaseUUID: langSec.termbase_uuid,
        xmlLang: langSec.xml_lang,
        auxElements,
        conceptEntry: {
          ...parentConceptEntry,
          termbaseUUID: parentConceptEntry.termbase_uuid
        },
        terms: terms.map((term) => ({
          ...term,
          termSecId: term.term_sec_id,
          language: langSec.xml_lang,
          termbaseUUID: term.termbase_uuid
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

export default GetLangSecController;