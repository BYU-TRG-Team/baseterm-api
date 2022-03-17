import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import { GetTermbaseTermsEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { isValidUUID } from "../../utils";
import TermService, { FilterOptions } from "../../services/TermService";
import { 
  handleNoResourceError,
  handleInvalidQueryParams, 
} from "../../responses/errors";
import { Logger } from "winston";
import { TermPartialView } from "../../types";

class GetTermsController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private termService: TermService;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    termService: TermService,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.termService = termService;
    this.logger = logger;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try { 
      const { 
        termbaseUUID 
      } = req.params;

      if (!isValidUUID(termbaseUUID)) return handleNoResourceError(res);

      const page = Number(
        req.query.page as string
      );

      if (isNaN(page)) return handleInvalidQueryParams(res);

      const perPage = 8;

      const filterOptions: FilterOptions = {
        termFilter: (req.query.term as string || ""),
        partOfSpeechFilter: (req.query.part_of_speech as string || ""),
        customerFilter: (req.query.customer as string || ""),
        conceptIdFilter: (req.query.concept_id as string || ""),
        languageFilter: (req.query.language as string || ""),
        approvalStatusFilter: (req.query.approval_status as string || ""),
        subjectField: (req.query.subject_field as string || ""),
      };

      const termbase =
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.Base>(tables.baseTable.fullTableName)
            .where({
              termbase_uuid: termbaseUUID
            })
            .select("*")
        );

      if (termbase === null) return handleNoResourceError(res);

      const totalCount = await this.termService.getTotalTermCount(
        termbaseUUID,
        filterOptions
      );

      const pageCount = Math.ceil(
        totalCount / perPage
      );

      const termRows = 
        totalCount === 0 ?
        [] :
        await this.termService.getAllTerms(
          termbaseUUID,
          {
            perPage,
            currentPage: page,
          },
          filterOptions
        );

      const terms = [];

      for (const termRow of termRows) {
        terms.push(
          await this.termService.constructTerm(
            termRow,
            "PARTIAL"
          ) as TermPartialView
        );
      }

      const response: GetTermbaseTermsEndpointResponse = {
        pagination: {
          page,
          pageCount,
          perPage,
          totalCount,
        },
        terms,
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

export default GetTermsController;