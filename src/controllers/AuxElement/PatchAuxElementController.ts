import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errorMessages";
import Helpers from "../../helpers";
import { PatchAuxElementEndpointResponse } from "../../types/responses";
import { handleInvalidIDReferenceError, handleInvalidXmlIdError, handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import AuxElementService from "../../services/AuxElementService";
import { TbxEntity } from "../../db/classes";
import { handleInvalidBody } from "../../responses/errors";
import { name as xmlNameValidator } from "xml-name-validator";
import { AuxElement, TbxElement } from "../../types/index";
import * as yup from "yup";

class PatchAuxElementController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.logger = logger;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {
      await this.getValidator().validate(req);
    } catch(err) {
      // TODO: Return yup validation errors for all controllers
      const validationError = (err as Error).message
      return handleInvalidBody(res, validationError);
    }

    try {
      const {
        auxElementUUID,
        termbaseUUID
      } = req.params;

      const {
        id,
        order,
        target,
        langCode,
        datatype,
        type,
        elementType,
        value,
        grpId
      } = req.body as {
        elementType: TbxElement,
        id?: string,
        grpId?: string,
        order?: number,
        target?: string,
        langCode?: string,
        datatype?: string,
        type?: string,
        value?: string,
      }

      const table = this.helpers.mapTbxElementToTable(
        elementType
      );

      if (table === null) {
        throw new Error(`Invalid element type supplied. ${elementType} was sent in the request`);
      }

      if (!isValidUUID(auxElementUUID)) return handleNoResourceError(res);

      const auxElementRow = 
        this.helpers.pluckOne<AuxElement>(
          await this.dbClient(table.fullTableName)
            .where({
              uuid: auxElementUUID
            })
            .select("*")
        );

        if (auxElementRow === null) return handleNoResourceError(res);

        const auxElement = this.auxElementService.translateDbResponseToAPIResponse(
          auxElementRow
        );

        let updatedId = auxElement.id;
        let updatedGrpId = auxElement.grpId;
        let updatedOrder = auxElement.order;
        let updatedTarget = auxElement.target;
        let updatedLangCode = auxElement.xmlLang;
        let updatedDatatype = auxElement.datatype;
        let updatedType = auxElement.type;
        let updatedValue = auxElement.value;

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

        if (order !== undefined) {
          updatedOrder = order;
        }

        if (langCode !== undefined) {
          updatedLangCode = langCode;
        }

        if (datatype !== undefined) {
          updatedDatatype = datatype;
        }

        if (type !== undefined) {
          updatedType = type;
        }

        if (value !== undefined) {
          updatedValue = value;
        }

        const isGrp = 
          [
            TbxElement.AdminGrp,
            TbxElement.DescripGrp,
            TbxElement.TransacGrp
          ].includes(elementType);

        const updatedAuxElement = await this.dbClient.transaction(async (transac) => {
          if (
            updatedId !== null &&
            updatedId !== undefined &&
            updatedId !== auxElement.id
          ) {
            await this.helpers.saveId(
              updatedId,
              termbaseUUID,
              new TbxEntity({
                ...table,
                uuid: auxElementUUID
              }),
              transac
            );
          }

          if (
            isGrp &&
            updatedGrpId !== null &&
            updatedGrpId !== undefined &&
            updatedGrpId !== auxElement.grpId
          ) {
            await this.helpers.saveId(
              updatedGrpId,
              termbaseUUID,
              new TbxEntity({
                ...table,
                uuid: auxElementUUID
              }),
              transac
            );
          }

          return (
            this.auxElementService.translateDbResponseToAPIResponse(
              this.helpers.pluckOne(
                await transac(table.fullTableName)
                  .where("uuid", auxElementUUID)
                  .update({
                    ...(
                      isGrp &&
                      {
                        [`${table.tableName}_grp_id`]: updatedGrpId,
                      }
                    ),
                    id: updatedId,
                    order: updatedOrder,
                    target: updatedTarget,
                    xml_lang: updatedLangCode,
                    datatype: updatedDatatype,
                    type: updatedType,
                    value: updatedValue,
                  })
                  .returning("*")
              )
            )
          )
        });

        return res.status(200).json(
          updatedAuxElement as PatchAuxElementEndpointResponse
        );
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

        if (errorCode == 500) {
          this.logger.error(err);
        }
      }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        elementType: yup.string().required(),
        id: yup.string().notRequired(),
        grpId: yup.string().notRequired(),
        order: yup.number().notRequired(),
        target: yup.string().notRequired(),
        langCode: yup.string().notRequired().isValidLangCode(),
        datatype: yup.string().notRequired(),
        type: yup.string().notRequired(),
        value: yup.string().notRequired(),
      }).required()
    })
  }
}

export default PatchAuxElementController;