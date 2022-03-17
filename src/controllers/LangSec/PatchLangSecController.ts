import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody, handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import * as yup from "yup";
import { PatchLangSecEndpointResponse } from "types/responses";

class PatchLangSecController {
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
        langSecUUID,
      } = req.params;

      const {
        langCode,
        order,
      } = req.body as {
        langCode?: string,
        order?: number,
      };

      if (!isValidUUID(langSecUUID)) return handleNoResourceError(res);

      const langSec = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.LangSec>(tables.langSecTable.fullTableName)
            .where({
              uuid: langSecUUID
            })
            .select("*")
        );

      if (langSec === null) return handleNoResourceError(res);

      let updatedLangCode = langSec.xml_lang;
      let updatedOrder = langSec.order;

      if (langCode !== undefined) {
        updatedLangCode = langCode;
      }

      if (order !== undefined) {
        updatedOrder = order;
      }

      const updatedLangSec = await this.dbClient.transaction(async (transac) => {
        return this.helpers.pluckOne<dbTypes.LangSec>(
          await transac<dbTypes.LangSec>(tables.langSecTable.fullTableName)
            .where("uuid", langSecUUID)
            .update({
              xml_lang: updatedLangCode,
              order: updatedOrder,
            })
            .returning<dbTypes.LangSec[]>("*")
        ) as dbTypes.LangSec
      });

      return res.status(200).json(
        {
          ...updatedLangSec,
          termbaseUUID: updatedLangSec.termbase_uuid,
          xmlLang: updatedLangSec.xml_lang,
        } as PatchLangSecEndpointResponse
      )
    } catch(err: any) {
      res.status(500).json({
        error: errorMessages.unexpectedError,
      });

      this.logger.error(err);
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        langCode: yup.string().notRequired(),
        order: yup.number().notRequired(),
      }).required()
    })
  }
}

export default PatchLangSecController;