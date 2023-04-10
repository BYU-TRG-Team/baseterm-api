import { Request, Response } from "express";
import { Knex } from "knex";
import { PostPersonRefObjectEndpointResponse } from "../../types/responses";
import errorMessages from "../../messages/errors";
import { Logger } from "winston";
import * as yup from "yup";
import RefService from "../../services/db/ref";
import { 
  handleInvalidBody, 
  handleInvalidPersonId, 
  handleUserIdMismatch
} from "../../responses/errors";
import { isValidUUID } from "../../utils";

class PostRefController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private refService: RefService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    refService: RefService,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.refService = refService;
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

      const personConfig = {
        ...(
          req.body as {
            name: string,
            email: string,
            role: string,
            id: string,
          }
        )
      }
    
      if (req.userId !== personConfig.id) {
        return handleUserIdMismatch(res);
      }

      if (!isValidUUID(req.body.id)) {
        return handleInvalidPersonId(res);
      }

      const newPersonRefUUID = await this.dbClient.transaction(async (transac) => {
        return await this.refService.constructPersonRef(
          termbaseUUID,
          transac,
          personConfig,
        );
      })

      return res.status(200).json({
        uuid: newPersonRefUUID
      } as PostPersonRefObjectEndpointResponse);
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
        name: yup.string().required(),
        email: yup.string().required(),
        role: yup.string().required(),
        id: yup.string().required(),
      }).required()
    })
  }
}

export default PostRefController;