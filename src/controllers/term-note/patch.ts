import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import Helpers from "../../helpers";
import * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import { handleInvalidBody, handleInvalidIDReferenceError, handleInvalidXmlIdError, handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import * as yup from "yup";
import { name as xmlNameValidator } from "xml-name-validator";
import { TbxEntity } from "../../db/classes";
import { PatchTermNoteEndpointResponse } from "../../types/responses";
import { TbxElement } from "../../types";

class PatchTermNoteController {
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
      const validationError = (err as Error).message
      return handleInvalidBody(res, validationError);
    }

    try {
      const {
        termbaseUUID,
        termNoteUUID,
      } = req.params;

      const {
        id,
        type,
        value,
        grpId,
        target,
        datatype,
        langCode,
        order
      } = req.body as {
        id?: string,
        type?: string,
        value?: string,
        grpId?: string,
        target?: string,
        datatype?: string,
        langCode?: string,
        order?: number,
      };

      if (!isValidUUID(termNoteUUID)) return handleNoResourceError(res);

      const termNote = 
        this.helpers.pluckOne(
          await this.dbClient<dbTypes.TermNote>(tables.termNoteTable.fullTableName)
            .where({
              uuid: termNoteUUID,
            })
            .select("*")
        );

      if (termNote === null) return handleNoResourceError(res);

      let updatedId = termNote.id;
      let updatedType = termNote.type;
      let updatedValue = termNote.value;
      let updatedGrpId = termNote.term_note_grp_id;
      let updatedTarget = termNote.target;
      let updatedDatatype = termNote.datatype;
      let updatedLangCode = termNote.xml_lang;
      let updatedOrder = termNote.order;

      if (id !== undefined) {
        if (!xmlNameValidator(id)) return handleInvalidXmlIdError(res);
        updatedId = id;
      }

      if (grpId !== undefined) {
        if (!xmlNameValidator(grpId)) return handleInvalidXmlIdError(res);
        updatedGrpId = grpId;
      }

      if (target !== undefined) {
        const isExistingID = await this.helpers.isExistingID(
          termbaseUUID,
          target,
          this.dbClient,
        );

        if (!isExistingID) return handleInvalidIDReferenceError(res);
        updatedTarget = target;
      }

      if (type !== undefined) {
        updatedType = type;
      }

      if (value !== undefined) {
        updatedValue = value;
      }

      if (datatype !== undefined) {
        updatedDatatype = datatype;
      }

      if (langCode !== undefined) {
        updatedLangCode = langCode;
      }

      if (order !== undefined) {
        updatedOrder = order;
      }
      
      const termNoteEntity = new TbxEntity({
        ...tables.termNoteTable,
        uuid: termNoteUUID,
      });

      const updatedTermNote = await this.dbClient.transaction(async (transac) => {
        if (
          updatedId !== null &&
          updatedId !== termNote.id
        ) {
          await this.helpers.saveId(
            updatedId,
            termbaseUUID,
            termNoteEntity,
            transac
          );
        }

        if (
          updatedGrpId !== null &&
          updatedGrpId !== termNote.term_note_grp_id
        ) {
          await this.helpers.saveId(
            updatedGrpId,
            termbaseUUID,
            termNoteEntity,
            transac
          );
        }

        return this.helpers.pluckOne<dbTypes.TermNote>(
          await transac<dbTypes.TermNote>(tables.termNoteTable.fullTableName)
            .where("uuid", termNoteUUID)
            .update({
              id: updatedId,
              term_note_grp_id: updatedGrpId,
              type: updatedType,
              value: updatedValue,
              target: updatedTarget,
              datatype: updatedDatatype,
              xml_lang: updatedLangCode,
              order: updatedOrder,
            })
            .returning<dbTypes.TermNote[]>("*")
        ) as dbTypes.TermNote
      });

      return res.status(200).json({
        ...updatedTermNote,
        xmlLang: updatedTermNote.xml_lang,
        termbaseUUID: updatedTermNote.termbase_uuid,
        elementType: (
          updatedTermNote.is_term_note_grp ?
            TbxElement.TermNoteGrp :
            TbxElement.TermNote
        )
      } as PatchTermNoteEndpointResponse)
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
        id: yup.string().notRequired(),
        type: yup.string().notRequired(),
        value: yup.string().notRequired(),
        grpId: yup.string().notRequired(),
        target: yup.string().notRequired(),
        datatype: yup.string().notRequired(),
        langCode: yup.string().notRequired().isValidLangCode({ required: false }),
        order: yup.number().notRequired(),
      }).required()
    })
  }
}

export default PatchTermNoteController;