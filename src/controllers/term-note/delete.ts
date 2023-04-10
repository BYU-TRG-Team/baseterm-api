import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import { handleNoResourceError } from "../../responses/errors";
import { isValidUUID } from "../../utils";
import { Logger } from "winston";
import TermNoteService from "../../services/db/term-note";

class DeleteTermNoteController {
  private dbClient: Knex<any, unknown[]>;
  private logger: Logger;
  private termNoteService: TermNoteService

  constructor(
    dbClient: Knex<any, unknown[]>,
    logger: Logger,
    termNoteService: TermNoteService,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.termNoteService = termNoteService;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    try {
      const {
        termNoteUUID,
        termbaseUUID
      } = req.params;

      if (!isValidUUID(termNoteUUID)) return handleNoResourceError(res);

      await this.dbClient.transaction(async (transac) => {
        await this.termNoteService.deleteTermNote(
          termNoteUUID,
          transac
        );
      });
      
      return res.status(204).send();

    } catch(err: any) {
        res.status(500).json({
          error: errorMessages.unexpectedError,
        });

        this.logger.error(err);
      }
  }
}

export default DeleteTermNoteController;