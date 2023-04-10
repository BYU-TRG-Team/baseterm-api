/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import * as types from "../../types";
import { TbxEntity } from "../../db/classes";
import { UUID } from "../../types";
import AuxElementService from "./aux-element";

class TermNoteService {
  private dbClient: Knex<any, unknown[]>;
  private auxElementService: AuxElementService;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    auxElementService: AuxElementService,
  ) {
    this.dbClient = dbClient;
    this.auxElementService = auxElementService;
  }

  public async deleteTermNote(
    termNoteUUID: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {
    
    const termNoteEntity = new TbxEntity({
      ...tables.termNoteTable,
      uuid: termNoteUUID,
    });

    await this.auxElementService.deleteAuxNoteLinkInfo(
      termNoteEntity,
      dbClient
    );

    await dbClient<dbTypes.TermNote>(tables.termNoteTable.fullTableName)
      .where({
        uuid: termNoteEntity.uuid
      })
      .delete()
  }
}

export default TermNoteService;