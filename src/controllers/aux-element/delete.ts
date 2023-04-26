import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "@messages/errors";
import Helpers from "@helpers";
import { handleNoResourceError } from "@responses/errors";
import { isValidUUID } from "@utils";
import { Logger } from "winston";
import { handleInvalidBody } from "@responses/errors";
import { TbxElement } from "@typings";
import * as yup from "yup";
import AuxElementService from "@services/db/aux-element";
import { TbxEntity } from "@db/classes";

class DeleteAuxElementController {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private logger: Logger;
  private auxElementService: AuxElementService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    logger: Logger,
    auxElementService: AuxElementService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.logger = logger;
    this.auxElementService = auxElementService;
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
        auxElementUUID,
        termbaseUUID
      } = req.params;

      const { elementType } = req.body as { elementType: TbxElement };
      
      const table = this.helpers.mapTbxElementToTable(
        elementType
      );

      if (table === null) {
        throw new Error(`Invalid element type supplied. ${elementType} was sent in the request`);
      }

      const entity = new TbxEntity({
        ...table,
        uuid: auxElementUUID,
      });

      if (!isValidUUID(auxElementUUID)) return handleNoResourceError(res);

      await this.dbClient.transaction(async (transac) => {
        if (elementType === TbxElement.AdminGrp) {
          await this.auxElementService.deleteAdminGrpAuxElements(
            entity,
            transac
          );
        }

        if (elementType === TbxElement.DescripGrp) {
          await this.auxElementService.deleteDescripGrpAuxElements(
            entity,
            transac
          );
        }

        if (elementType === TbxElement.TransacGrp) {
          await this.auxElementService.deleteTransacGrpAuxElements(
            entity,
            transac
          );
        }

        await transac(table.fullTableName)
          .where({
            uuid: auxElementUUID,
          })
          .delete();
      });
      
      return res.status(204).send();

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
        elementType: yup.string().required(),
      }).required()
    });
  }
}

export default DeleteAuxElementController;