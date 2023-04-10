import { Request, Response } from "express";
import { Knex } from "knex";
import errorMessages from "../../messages/errors";
import { Logger } from "winston";
import EntryService from "../../services/db/entry";

class DeleteEntryController {
  private dbClient: Knex<any, unknown[]>;
  private entryService: EntryService;
  private logger: Logger;

  constructor(
    dbClient: Knex<any, unknown[]>,
    entryService: EntryService,
    logger: Logger,
  ) {
    this.dbClient = dbClient;
    this.logger = logger;
    this.entryService = entryService;
  }

  public async handle(
    req: Request,
    res: Response
  ) {
    const { 
      entryUUID 
    } = req.params;

    try {
      await this.dbClient.transaction(async (transac) => {
        await this.entryService.deleteEntry(
          entryUUID,
          transac
        );
      });

      res.status(204).send();
    } catch(err) { 
      res.status(500).json({
        error: errorMessages.unexpectedError
      });

      this.logger.error(err);
    }
  }
}

export default DeleteEntryController;