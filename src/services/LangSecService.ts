/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "../db/types";
import * as tables from "../db/tables";
import * as types from "../types";
import Helpers from "../helpers";
import { TbxEntity } from "../db/classes";
import { UUID } from "../types";
import AuxElementService from "./AuxElementService";
import TermService from "./TermService";

class LangSecService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private termService: TermService;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    termService: TermService
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.termService = termService;
  }

  public async deleteLangSec(
    langSecUUID: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {
    
    const langSecEntity = new TbxEntity({
      ...tables.langSecTable,
      uuid: langSecUUID
    });
    
    await this.helpers.deleteChildTables(
      langSecEntity,
      tables.termTable,
      dbClient,
      {
        onDelete: async (childRow) => {
          await this.termService.deleteTerm(
            childRow.uuid,
            dbClient,
          );
        }
      }
    );

    await this.auxElementService.deleteAuxInfo(
      langSecEntity,
      dbClient,
    );

    await dbClient<dbTypes.LangSec>(tables.langSecTable.fullTableName)
      .where({
        uuid: langSecEntity.uuid,
      })
      .delete()
  }
}

export default LangSecService;