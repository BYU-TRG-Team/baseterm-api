import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import Helpers from "../../helpers";
import { PatchTermbaseEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody, handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import * as yup from "yup";

class PatchTermbaseController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
    }

    try { 
      const { 
        termbaseUUID 
      } = req.params;

      const {
        type,
        name,
        enforceBasicDialect
      } = req.body as {
        type?: string,
        name?: string,
        enforceBasicDialect?: boolean,
      };

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

      let updatedName = termbase.name;
      let updatedType = termbase.type;
      let updatedEnforceBasicDialect = termbase.enforce_basic_dialect;

      if (name !== undefined) {
        updatedName = name;
      }

      /*
      * Dialect should only be updatable if we have departed from TBX-Basic
      */
      if (type !== undefined) {
        if (!termbase.enforce_basic_dialect) {
          updatedType = type;
        }
      }

      /*
      * Updating this setting is a one way street.
      * If we no longer enforce basic dialect for a termbase, we can't go back
      */
      if (
        enforceBasicDialect !== undefined &&
        !enforceBasicDialect
      ) {
        updatedEnforceBasicDialect = enforceBasicDialect
      }

      const updatedTermbase = 
        this.helpers.pluckOne<dbTypes.Base>(
          await this.dbClient(tables.baseTable.fullTableName)
            .where("termbase_uuid", termbaseUUID)
            .update({
              type: updatedType,
              name: updatedName,
              enforce_basic_dialect: updatedEnforceBasicDialect,
            })
            .returning<dbTypes.Base[]>("*")
        ) as dbTypes.Base;

      return res.status(200).json({
        ...{
          ...updatedTermbase,
          enforceBasicDialect: updatedTermbase.enforce_basic_dialect,
          xmlLang: updatedTermbase.xml_lang,
          termbaseUUID: updatedTermbase.termbase_uuid
        },
      } as PatchTermbaseEndpointResponse);
    } catch(err: any) { 
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateBase :
          errorMessages.unexpectedError;

      const errorCode = 
        err.code === "23505" ?
          409:
          500;

      res.status(errorCode).json({
        error: errorMessage,
      });

      if (errorCode === 500) {
        this.logger.error(err);
      }
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        type: yup.string().notRequired(),
        name: yup.string().notRequired(),
        enforceBasicDialect: yup.boolean().notRequired(),
      }).required()
    });
  }
}

export default PatchTermbaseController;