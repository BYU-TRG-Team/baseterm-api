import { Request, Response } from "express";
import * as yup from "yup";
import errorMessages from "../../messages/errorMessages";
import * as tables from "../../db/tables";
import { Knex } from "knex";
import Helpers from "../../helpers";
import { TbxEntity } from "../../db/classes";
import { Logger } from "winston";
import { handleInvalidBody, handleInvalidXmlIdError, handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { PostEntryEndpointResponse } from "../../types/responses";
import { uuid } from "uuidv4";
import { name as xmlNameValidator } from "xml-name-validator";
import EntryService from "../../services/EntryService";

class PostEntryController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;
  private entryService: EntryService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
    entryService: EntryService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
    this.entryService = entryService;
  }

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      const validationError = (err as Error).message
      return handleInvalidBody(res, validationError);
    }

    try {
      const termbaseUUID = req.params.termbaseUUID as string;
      if (!isValidUUID(termbaseUUID)) return handleNoResourceError(res);
      
      const {
        entryId,
        initialLanguageSection,
        initialTerm
      } = req.body;

      if (!xmlNameValidator(entryId)) return handleInvalidXmlIdError(res);

      const entryEntity = new TbxEntity({
        ...tables.conceptEntryTable,
        uuid: uuid()
      });

      const newConceptEntryUUID = await this.dbClient.transaction(async (transac) => {
        return await this.entryService.constructEntry(
          entryId,
          initialLanguageSection,
          initialTerm,
          entryEntity,
          termbaseUUID,
          req.userId,
          transac
        )
      })

      res.status(200).json({
        uuid: newConceptEntryUUID,
      } as PostEntryEndpointResponse);

    } catch(err: any) {
      /*
      * TODO: The error handling for duplicate IDs can be caught early using a helper function
      */
      const errorMessage = 
        err.code === "23505" ?
          errorMessages.duplicateTbxId :
          errorMessages.unexpectedError;

      const errorCode = 
        err.code === "23505" ?
          409:
          500;

      res.status(errorCode).json({
        error: errorMessage
      });

      if (errorCode === 500) {
        this.logger.error(err);
      }
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        entryId: yup.string().required(),
        initialLanguageSection: yup.string().required().isValidLangCode({ required: true }),
        initialTerm: yup.string().required(),
      }).required()
    });
  }
}

export default PostEntryController;