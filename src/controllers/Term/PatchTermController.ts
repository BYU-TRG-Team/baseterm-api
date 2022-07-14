import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody, handleInvalidXmlIdError, handleNoResourceError } from "../../responses/errors";
import { isValidUUID, TransactionMessage } from "../../utils";
import { Logger } from "winston";
import * as yup from "yup";
import TermService from "../../services/TermService";
import { name as XmlNameValidator } from "xml-name-validator";
import { TbxEntity } from "../../db/classes";
import { PatchTermEndpointResponse } from "types/responses";
import TransactionService from "../../services/TransactionService";

class PatchTermController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;
  private termService: TermService;
  private transactionService: TransactionService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
    termService: TermService,
    transactionService: TransactionService
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
    this.termService = termService;
    this.transactionService = transactionService;
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
        termbaseUUID,
        termUUID,
      } = req.params;

      const {
        id,
        termSecId,
        value,
        order
      } = req.body as {
        id?: string,
        termSecId?: string,
        value?: string,
        order?: number,
      };

      if (!isValidUUID(termUUID)) return handleNoResourceError(res);

      const transactionMessage = new TransactionMessage();
      const term = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.Term>(tables.termTable.fullTableName)
            .where({
              uuid: termUUID
            })
            .select("*")
        );

      if (term === null) return handleNoResourceError(res);

      let updatedValue = term.value;
      let updatedTermSecId = term.term_sec_id;
      let updatedId = term.id;
      let updatedOrder = term.order;

      if (
        termSecId !== undefined &&
        termSecId !== term.term_sec_id
      ) {
        if (!XmlNameValidator(termSecId)) return handleInvalidXmlIdError(res);
        updatedTermSecId = termSecId;
        transactionMessage.addChange(
          `Updated term section ID from "${term.term_sec_id}" to "${termSecId}"`
        );
      }

      if (
        id !== undefined &&
        id !== term.id
      ) {
        if (!XmlNameValidator(id)) return handleInvalidXmlIdError(res);
        updatedId = id;
        transactionMessage.addChange(
          `Updated term ID from "${term.id}" to "${id}"`
        );
      }

      if (
        value !== undefined &&
        value !== term.value
      ) {
        updatedValue = value;
        transactionMessage.addChange(
          `Updated term value from "${term.value}" to "${value}"`
        );
      }

      if (
        order !== undefined && 
        order !== term.order
      ) {
        updatedOrder = order;
      }

      if (
        transactionMessage.toString().length === 0
      ) {
        return res.status(200).json(
          await this.termService.retrieveTerm(
            term,
            "PREVIEW"
          ) as PatchTermEndpointResponse);
      }

      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: termUUID,
      });

      const updatedTerm = await this.dbClient.transaction(async (transac) => {
        if (
          updatedId !== null &&
          updatedId !== term.id
        ) {
          await this.helpers.saveId(
            updatedId,
            termbaseUUID,
            termEntity,
            transac
          );
        }

        if (
          updatedTermSecId !== null &&
          updatedTermSecId !== term.term_sec_id
        ) {
          await this.helpers.saveId(
            updatedTermSecId,
            termbaseUUID,
            termEntity,
            transac
          );
        }

        await this.transactionService.constructTransaction(
          termbaseUUID,
          termEntity,
          {
            transactionType: "modification",
            userId: req.userId,
            note: transactionMessage.toString(),
          },
          transac
        );

        return this.helpers.pluckOne<dbTypes.Term>(
          await transac<dbTypes.Term>(tables.termTable.fullTableName)
            .where("uuid", termUUID)
            .update({
              value: updatedValue,
              term_sec_id: updatedTermSecId,
              id: updatedId,
              order: updatedOrder,
            })
            .returning<dbTypes.Term[]>("*")
        ) as dbTypes.Term
      });

      return res.status(200).json(
        await this.termService.retrieveTerm(
          updatedTerm,
          "PREVIEW"
        ) as PatchTermEndpointResponse);
    } catch(err: any) {
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateTbxId :
          errorMessages.unexpectedError;

      const errorCode = 
        err.code === "23505" ?
          409 :
          500;

      res.status(errorCode).json({
        error: errorMessage,
      })

      if (errorCode === 500) {
        this.logger.error(err);
      }
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

export default PatchTermController;