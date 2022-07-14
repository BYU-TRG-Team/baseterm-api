import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import { PatchEntryEndpointResponse } from "../../types/responses";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody, handleInvalidXmlIdError, handleNoResourceError } from "../../responses/errors";
import { isValidUUID, TransactionMessage } from "../../utils";
import { Logger } from "winston";
import * as yup from "yup";
import { TbxEntity } from "../../db/classes";
import { name as xmlNameValidator } from "xml-name-validator";
import TransactionService from "../../services/TransactionService";

class PatchEntryController {
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
      return handleInvalidBody(res);
    }

    try { 
      const { 
        termbaseUUID,
        entryUUID, 
      } = req.params;

      const {
        id
      } = req.body as {
        id?: string,
      }

      if (!isValidUUID(entryUUID)) return handleNoResourceError(res);
      
      const transactionMessage = new TransactionMessage();
      const entryEntity = new TbxEntity({
        ...tables.conceptEntryTable,
        uuid: entryUUID,
      });
      const entry = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
            .where({
              uuid: entryUUID
            })
            .select("*")
        );

      if (entry === null) return handleNoResourceError(res);

      let updatedId = entry.id;

      if (
        id !== undefined &&
        id !== entry.id  
      ) {
        if (!xmlNameValidator(id)) return handleInvalidXmlIdError(res);
        updatedId = id;
        transactionMessage.addChange(
          `Updated id from "${entry.id}" to "${id}"`
        );
      }

      if (
        transactionMessage.toString().length === 0
      ) {
        return res.status(200).json(
          {
            ...entry,
            termbaseUUID: entry.termbase_uuid,
          } as PatchEntryEndpointResponse
        );
      }

      const updatedEntry = await this.dbClient.transaction(async (transac) => {
        if (
          updatedId !== null &&
          updatedId !== entry.id
        ) {
          await this.helpers.saveId(
            updatedId,
            termbaseUUID,
            new TbxEntity({
              ...tables.conceptEntryTable,
              uuid: entryUUID,
            }),
            transac
          );
        }

        const updatedEntry = this.helpers.pluckOne<dbTypes.ConceptEntry>(
          await transac(tables.conceptEntryTable.fullTableName)
            .where("uuid", entryUUID)
            .update({
              id: updatedId
            })
            .returning<dbTypes.ConceptEntry[]>("*")
          ) as dbTypes.ConceptEntry;

          await this.transactionService.constructTransaction(
            termbaseUUID,
            entryEntity,
            {
              transactionType: "modification",
              userId: req.userId,
              note: transactionMessage.toString(),
            },
            transac
          );

        return updatedEntry;
      });

      if (updatedEntry === null) return handleNoResourceError(res);
        
      return res.status(200).json({
        ...updatedEntry,
        termbaseUUID: updatedEntry.termbase_uuid,
      } as PatchEntryEndpointResponse);

    } catch(err: any) { 
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateTbxId :
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
        id: yup.string().notRequired(),
        order: yup.number().notRequired(),
      }).required(),
    });
  }
}

export default PatchEntryController;