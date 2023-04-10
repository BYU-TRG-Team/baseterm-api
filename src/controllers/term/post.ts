import { Request, Response } from "express";
import * as yup from "yup";
import errorMessages from "../../messages/errors";
import { Knex } from "knex";
import { Logger } from "winston";
import { handleInvalidBody } from "../../responses/errors";
import { PostTermEndpointResponse } from "../../types/responses";
import TermService from "../../services/db/term";
import * as tables from "../../db/tables";
import { TbxEntity } from "../../db/classes";
import { uuid } from "uuidv4";

class PostTermController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private termService: TermService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    termService: TermService,
  ) {
    this.termService = termService;
    this.dbClient = dbClient;
    this.logger = logger;
  }

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
    }

    try {
      const {
        termbaseUUID
      } = req.params;

      const {
        value,
        langSecUUID
      } = req.body;

      const newTermUUID = await this.dbClient.transaction(async (transac) => {
        const termEntity = new TbxEntity({
          ...tables.termTable,
          uuid: uuid()
        });

        const langSecEntity = new TbxEntity({
          ...tables.langSecTable,
          uuid: langSecUUID,
        });
        
        return await this.termService.constructTerm(
          value,
          termEntity,
          langSecEntity,
          termbaseUUID,
          req.userId,
          transac
        );
      })

      res.status(200).json({
        uuid: newTermUUID,
      } as PostTermEndpointResponse);

    } catch(err: any) {
      // TODO: can also just abstract this into a response
      res.status(500).json({
        error: errorMessages.unexpectedError,
      });

      this.logger.error(err);
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      body: yup.object({
        langSecUUID: yup.string().required(),
        value: yup.string().required(),
      }).required()
    });
  }
}

export default PostTermController;