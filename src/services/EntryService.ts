/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "../db/types";
import * as tables from "../db/tables";
import * as types from "../types";
import Helpers from "../helpers";
import { TbxEntity } from "../db/classes";
import { UUID } from "../types";
import AuxElementService from "./AuxElementService";
import LangSecService from "./LangSecService";

class EntryService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private langSecService: LangSecService;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    langSecService: LangSecService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.langSecService = langSecService;
  }

  public async deleteEntry(
    entryUUID: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {
    
    const entryEntity = new TbxEntity({
      ...tables.conceptEntryTable,
      uuid: entryUUID
    });
    
    await this.helpers.deleteChildTables(
      entryEntity,
      tables.langSecTable,
      dbClient,
      {
        onDelete: async (childRow) => {
          await this.langSecService.deleteLangSec(
            childRow.uuid,
            dbClient,
          );
        }
      }
    );

    await this.auxElementService.deleteAuxInfo(
      entryEntity,
      dbClient,
    );

    await dbClient<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
      .where({
        uuid: entryEntity.uuid
      })
      .delete();
  }
}

export default EntryService;