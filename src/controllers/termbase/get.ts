import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import Helpers from "../../helpers";
import { GetTermbaseEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import TermbaseService from "../../services/db/termbase";
import RefService from "../../services/db/ref";

class GetTermbaseController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private termbaseService: TermbaseService;
  private logger: Logger;
  private refService: RefService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    termbaseService: TermbaseService,
    logger: Logger,
    refService: RefService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.termbaseService = termbaseService;
    this.logger = logger;
    this.refService = refService;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try { 
      const { termbaseUUID } = req.params;

      if (!isValidUUID(termbaseUUID)) return handleNoResourceError(res);

      const termbase = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.Base>(tables.baseTable.fullTableName)
            .where({
              termbase_uuid: termbaseUUID
            })
            .select("*")
        );

      if (termbase === null) return handleNoResourceError(res);

      const response: GetTermbaseEndpointResponse = {
        ...termbase,
        xmlLang: termbase.xml_lang,
        termbaseUUID: termbase.termbase_uuid,
        enforceBasicDialect: termbase.enforce_basic_dialect,
        metadata: {
          languages: await this.termbaseService.getAllLanguages(
            termbaseUUID
          ),
          partsOfSpeech: await this.termbaseService.getAllPartsOfSpeech(
            termbaseUUID
          ),
          customers: await this.termbaseService.getAllCustomers(
            termbaseUUID
          ),
          conceptIds: await this.termbaseService.getAllConceptIds(
            termbaseUUID
          ),
          approvalStatuses: await this.termbaseService.getAllApprovalStatuses(
            termbaseUUID
          ),
          subjectFields: await this.termbaseService.getAllSubjectFields(
            termbaseUUID
          ),
          personRefs: await this.refService.retrievePersonRefs(
            termbaseUUID
          )
        }
      }
      
      return res.status(200).json(response);

    } catch(err) { 
      res.status(500).json({
        error: errorMessages.unexpectedError
      });
      
      this.logger.error(err);
    }
  }
}

export default GetTermbaseController;