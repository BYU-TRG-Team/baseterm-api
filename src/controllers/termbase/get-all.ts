import { Request, Response } from "express";
import errorMessages from "../../messages/errors";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { Knex } from "knex";
import { GetTermbasesEndpointResponse } from "../../types/responses";
import { Logger } from "winston";
import { handleInvalidQueryParams } from "../../responses/errors";

class GetTermbasesController {
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
    try { 
      const page = Number(
        req.query.page as string
      );
      const perPage = 8;

      if (isNaN(page)) return handleInvalidQueryParams(res);
      
      const totalCount = 
        Number(
          (
            await this.dbClient.select("*")
              .fromRaw<{count: string}>(
                this.dbClient.raw(
                  `(
                   SELECT COUNT(*) as count
                      FROM ${tables.baseTable.fullTableName}
                  ) as tb
                `,
                )
              )
          )[0].count
        );  

      const pageCount = Math.ceil(
        totalCount / perPage
      );

      const termbases = 
        totalCount === 0 ?
        [] :
        (
          await this.dbClient
            .select("*")
            .from<dbTypes.Base>(tables.baseTable.fullTableName)
            .paginate({
              perPage,
              currentPage: page,
            })
        ).data;
          
      const response: GetTermbasesEndpointResponse = {
        termbases: termbases.map((termbase) => ({
          ...termbase,
          enforceBasicDialect: termbase.enforce_basic_dialect,
          termbaseUUID: termbase.termbase_uuid,
          xmlLang: termbase.xml_lang
        })),
        pagination: {
          page,
          pageCount,
          perPage,
          totalCount,
        }
      };

      res.status(200).json(response);
    } catch(err) {
      res.status(500).json({
        error: errorMessages.unexpectedError
      });

      this.logger.error(err);
    }
  }
}

export default GetTermbasesController;