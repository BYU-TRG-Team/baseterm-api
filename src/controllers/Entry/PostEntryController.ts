import { Request, Response } from "express";
import * as yup from "yup";
import errorMessages from "../../messages/errorMessages";
import * as dbTypes from "../../db/types";
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

class PostEntryController {
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

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
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

      const conceptEntryEntity = new TbxEntity({
        ...tables.conceptEntryTable,
        uuid: uuid()
      });

      const langSecEntity = new TbxEntity({
        ...tables.langSecTable,
        uuid: uuid(),
      });

      const termEntity = new TbxEntity({
        ...tables.termTable,
        uuid: uuid(),
      });

      const newConceptEntryUUID = 
        await this.dbClient.transaction(async (transac) => {    
          await this.helpers.saveId(
            entryId,
            termbaseUUID,
            conceptEntryEntity,
            transac
          );
          
          await transac<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
            .insert({ 
              uuid: conceptEntryEntity.uuid,
              id: entryId,
              termbase_uuid: termbaseUUID,
              order: await this.helpers.computeNextOrder(
                termbaseUUID,
                tables.conceptEntryTable,
                transac
              ),
            });
  
          await transac<dbTypes.LangSec>(tables.langSecTable.fullTableName)
            .insert({ 
              uuid: langSecEntity.uuid,
              xml_lang: initialLanguageSection,
              termbase_uuid: termbaseUUID,
              order: 0
            });

          await transac<dbTypes.Term>(tables.termTable.fullTableName)
            .insert({ 
              uuid: termEntity.uuid,
              value: initialTerm,
              termbase_uuid: termbaseUUID,
              order: 0
            });

          await this.helpers.saveChildTable(
            conceptEntryEntity,
            langSecEntity,
            transac,
          );

          await this.helpers.saveChildTable(
            langSecEntity,
            termEntity,
            transac,
          );

          return conceptEntryEntity.uuid;
        });

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
        initialLanguageSection: yup.string().required(),
        initialTerm: yup.string().required(),
      }).required()
    });
  }
}

export default PostEntryController;