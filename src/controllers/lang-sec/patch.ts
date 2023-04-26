import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "@messages/errors";
import Helpers from "@helpers";
import * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import { handleInvalidBody, handleNoResourceError } from "@responses/errors";
import { isValidUUID, TransactionMessage } from "@utils";
import { Logger } from "winston";
import * as yup from "yup";
import { PatchLangSecEndpointResponse } from "@typings/responses";
import TransactionService from "@services/db/transaction";
import { TbxEntity } from "@db/classes";

class PatchLangSecController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;
  private transactionService: TransactionService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
    transactionService: TransactionService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
    this.transactionService = transactionService;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {
      await this.getValidator().validate(req);
    } catch(err) {
      const validationError = (err as Error).message;
      return handleInvalidBody(res, validationError);
    }

    try {
      const {
        langSecUUID,
        termbaseUUID
      } = req.params;

      const {
        langCode,
        order,
      } = req.body as {
        langCode?: string,
        order?: number,
      };

      if (!isValidUUID(langSecUUID)) return handleNoResourceError(res);

      const transactionMessage = new TransactionMessage();
      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: langSecUUID
      });
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

      if (
        langCode !== undefined &&
        langCode !== langSec.xml_lang
      ) {
        updatedLangCode = langCode;
        transactionMessage.addChange(
          `Updated language code from "${langSec.xml_lang}" to "${langCode}"`
        );
      }

      if (order !== undefined) {
        updatedOrder = order;
      }

      if (
        transactionMessage.toString().length === 0
      ) {
        return res.status(200).json(
          {
            ...langSec,
            termbaseUUID: langSec.termbase_uuid,
            xmlLang: langSec.xml_lang,
          } as PatchLangSecEndpointResponse
        );
      }

      const updatedLangSec = await this.dbClient.transaction(async (transac) => {
        const updatedLangSec = this.helpers.pluckOne<dbTypes.LangSec>(
          await transac<dbTypes.LangSec>(tables.langSecTable.fullTableName)
            .where("uuid", langSecUUID)
            .update({
              xml_lang: updatedLangCode,
              order: updatedOrder,
            })
            .returning<dbTypes.LangSec[]>("*")
        ) as dbTypes.LangSec;

        await this.transactionService.constructTransaction(
          termbaseUUID,
          langSecEntity,
          {
            transactionType: "modification",
            userId: req.userId,
            note: transactionMessage.toString(),
          },
          transac
        );

        return updatedLangSec;
      });

      return res.status(200).json(
        {
          ...updatedLangSec,
          termbaseUUID: updatedLangSec.termbase_uuid,
          xmlLang: updatedLangSec.xml_lang,
        } as PatchLangSecEndpointResponse
      );
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
        langCode: yup.string().notRequired().isValidLangCode({ required: false }),
        order: yup.number().notRequired(),
      }).required()
    });
  }
}

export default PatchLangSecController;