/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import * as types from "@typings";
import Helpers from "@helpers";
import { TbxEntity } from "@db/classes";
import { UUID } from "@typings";
import AuxElementService from "@services/db/aux-element";
import TermService from "@services/db/term";
import { v4 as uuid } from "uuid";
import TransactionService from "@services/db/transaction";

class LangSecService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private termService: TermService;
  private transactionService: TransactionService;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    termService: TermService,
    transactionService: TransactionService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.termService = termService;
    this.transactionService = transactionService;
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
      .delete();
  }

  public async constructLangSec(
    langCode: string,
    initialTerm: string,
    langSecEntity: TbxEntity,
    entryEntity: TbxEntity,
    termbaseUUID: UUID,
    userId: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {
    const termEntity = new TbxEntity({
      ...tables.termTable,
      uuid: uuid()
    });

    // Construct Lang Sec
    await dbClient<dbTypes.LangSec>(tables.langSecTable.fullTableName)
      .insert({
        uuid: langSecEntity.uuid,
        xml_lang: langCode,
        termbase_uuid: termbaseUUID,
        order: await this.helpers.computeNestedNextOrder(
          entryEntity,
          tables.langSecTable,
          dbClient
        )
      });

    await this.helpers.saveChildTable(
      entryEntity,
      langSecEntity,
      dbClient
    );
    
    // Construct origination transaction
    await this.transactionService.constructTransaction(
      termbaseUUID,
      langSecEntity,
      {
        transactionType: "origination",
        userId,
      },
      dbClient
    );

    await this.termService.constructTerm(
      initialTerm,
      termEntity,
      langSecEntity,
      termbaseUUID,
      userId,
      dbClient
    );

    return langSecEntity.uuid;
  }
}

export default LangSecService;