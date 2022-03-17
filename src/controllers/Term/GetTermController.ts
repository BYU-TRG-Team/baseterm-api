import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import TermService from "../../services/TermService";
import { GetTermEndpointResponse } from "../../types/responses";
import { TermFullView } from "../../types";

class GetTermController {
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
        termUUID 
      } = req.params;

      if (!isValidUUID(termUUID)) return handleNoResourceError(res);

      const termRow = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.Term>(tables.termTable.fullTableName)
            .where({
              uuid: termUUID,
            })
            .select("*")
        );

      if (termRow === null) return handleNoResourceError(res);

      const term = await this.termService.constructTerm(
        termRow,
        "FULL"
      ) as TermFullView;
      
      return res.status(200).json(term as GetTermEndpointResponse);

    } catch(err) { 
      res.status(500).json({
        error: errorMessages.unexpectedError
      });
      
      this.logger.error(err);
    }
  }
}

export default GetTermController;