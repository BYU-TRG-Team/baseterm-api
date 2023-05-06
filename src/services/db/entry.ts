/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import * as types from "@typings";
import Helpers from "@helpers";
import { TbxEntity } from "@db/classes";
import { UUID } from "@typings";
import AuxElementService from "@services/db/aux-element";
import LangSecService from "@services/db/lang-sec";
import TransactionService from "@services/db/transaction";
import { v4 as uuid } from "uuid";

class EntryService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private langSecService: LangSecService;
  private transactionService: TransactionService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    langSecService: LangSecService,
    transactionService: TransactionService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.langSecService = langSecService;
    this.transactionService = transactionService;
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

  public async constructEntry(
    id: string,
    initialLanguageSection: string,
    initialTerm: string,
    entryEntity: TbxEntity,
    termbaseUUID: UUID,
    userId: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {

    const langSecEntity = new TbxEntity({
      ...tables.langSecTable,
      uuid: uuid(),
    });

    await this.helpers.saveId(
      id,
      termbaseUUID,
      entryEntity,
      dbClient
    );
    
    await dbClient<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
      .insert({ 
        uuid: entryEntity.uuid,
        id,
        termbase_uuid: termbaseUUID,
        order: await this.helpers.computeNextOrder(
          termbaseUUID,
          tables.conceptEntryTable,
          dbClient
        ),
      });

    // Construct origination transaction
    await this.transactionService.constructTransaction(
      termbaseUUID,
      entryEntity,
      {
        transactionType: "origination",
        userId,
      },
      dbClient
    );

    await this.langSecService.constructLangSec(
      initialLanguageSection,
      initialTerm,
      langSecEntity,
      entryEntity,
      termbaseUUID,
      userId,
      dbClient
    );

    return entryEntity.uuid;
  }
}

export default EntryService;