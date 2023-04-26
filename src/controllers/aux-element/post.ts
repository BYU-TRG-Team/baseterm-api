import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "@messages/errors";
import Helpers from "@helpers";
import { PostAuxElementEndpointResponse } from "@typings/responses";
import { handleNoResourceError } from "@responses/errors";
import { isValidUUID } from "@utils";
import { Logger } from "winston";
import { TbxEntity } from "@db/classes";
import { handleInvalidBody } from "@responses/errors";
import { TbxElement, UUID } from "@typings";
import * as yup from "yup";
import { uuid } from "uuidv4";

class PostAuxElementController {
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

      if (!isValidUUID(termbaseUUID)) return handleNoResourceError(res);

      const {
        parentElementType,
        value,
        elementType,
        type,
        parentUUID,
        target
      } = req.body as {
        parentElementType: TbxElement,
        parentUUID: UUID,
        value: string,
        elementType: TbxElement,
        type?: string,
        target?: string,
      };

      const parentTable = this.helpers.mapTbxElementToTable(
        parentElementType
      );

      const table = this.helpers.mapTbxElementToTable(
        elementType
      );

      if (parentTable === null) {
        throw new Error(`Invalid parent element type supplied. ${parentElementType} was sent in the request`);
      }

      if (table === null) {
        throw new Error(`Invalid element type supplied. ${elementType} was sent in the request`);
      }

      const parentEntity = new TbxEntity({
        ...parentTable,
        uuid: parentUUID,
      });

      const entity = new TbxEntity({
        ...table,
        uuid: uuid()
      });

      const hasGrpField = 
        [
          TbxElement.AdminGrp,
          TbxElement.Admin,
          TbxElement.Descrip,
          TbxElement.DescripGrp,
          TbxElement.Transac,
          TbxElement.TransacGrp
        ].includes(elementType);

      const isGrp = 
        [
          TbxElement.AdminGrp,
          TbxElement.DescripGrp,
          TbxElement.TransacGrp
        ].includes(elementType);

      const isNote = 
        [
          TbxElement.AdminNote,
          TbxElement.DescripNote,
          TbxElement.TransacNote,
          TbxElement.Note,
        ].includes(elementType);

      const newConceptEntryUUID = await this.dbClient.transaction(async (transac) => {
        await transac(table.fullTableName)
          .insert({
            uuid: entity.uuid,
            termbase_uuid: termbaseUUID,
            order: await this.helpers.computeNestedNextOrder(
              parentEntity,
              table,
              transac
            ),
            ...(type !== undefined && { type }),
            ...(value !== undefined && { value }),
            ...(target !== undefined && { target }),
            ...(
              hasGrpField &&
                {
                  [`is_${table.tableName}_grp`]: isGrp,
                }
            ),
            ...(
              isNote &&
                {
                  ["is_generic_note"]: elementType === TbxElement.Note
                }
            )
          });

        await this.helpers.saveChildTable(
          parentEntity,
          entity,
          transac
        );

        return entity.uuid;
      });

      return res.status(200).json({
        uuid: newConceptEntryUUID,
      } as PostAuxElementEndpointResponse);
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
        parentElementType: yup.string().required(),
        parentUUID: yup.string().required(),
        value: yup.string().required(),
        elementType: yup.string().required(),
        type: yup.string().notRequired(),
        target: yup.string().notRequired(),
      }).required()
    });
  }
}

export default PostAuxElementController;