/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "../../db/types";
import * as tables from "../../db/tables";
import * as types from "../../types";
import Helpers from "../../helpers";
import { TbxEntity } from "../../db/classes";
import { UUID } from "../../types";
import { uuid } from "uuidv4";
import RefService from "./ref";
import dateFormat from "date-format";

interface TransactionConfig {
  transactionType: "origination" | "modification",
  note?: string,
  userId: UUID,
}

class TransactionService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private refService: RefService;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    refService: RefService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.refService = refService;
  }

  private formatPersonID(
    id: UUID
  ) {
    return `BT-${id}`;
  }

  public async constructTransaction(
    termbaseUUID: UUID,
    parentEntity: TbxEntity,
    {
      transactionType,
      note,
      userId,
    }: TransactionConfig,
    dbClient: types.DBClient = this.dbClient
  ): Promise<void> {
    const formattedPersonId = this.formatPersonID(
      userId
    );

    const personRefObject = await this.refService.retrievePersonRef(
      termbaseUUID,
      formattedPersonId,
      dbClient
    );

    if (personRefObject === null) {
      throw new Error("ID is not associated with a person reference");
    }

    const transacEntity = new TbxEntity({
      ...tables.transacTable,
      uuid: uuid(),
    });

    const transacNoteEntity = new TbxEntity({
      ...tables.auxNoteTable,
      uuid: uuid(),
    });

    const dateEntity = new TbxEntity({
      ...tables.dateTable,
      uuid: uuid()
    });
  
    // Construct Transac
    await dbClient<dbTypes.Transac>(tables.transacTable.fullTableName)
      .insert({
        uuid: transacEntity.uuid,
        termbase_uuid: termbaseUUID,
        type: "transactionType",
        is_transac_grp: true,
        order: await this.helpers.computeNestedNextOrder(
          parentEntity,
          tables.transacTable,
          dbClient
        ),
        value: transactionType,
      });

    // Construct Transac Note
    await dbClient<dbTypes.AuxNote>(tables.auxNoteTable.fullTableName)
      .insert({
        uuid: transacNoteEntity.uuid,
        termbase_uuid: termbaseUUID,
        is_generic_note: false,
        type: "responsibility",
        order: 0,
        value: personRefObject.fullName,
        target: personRefObject.rawId,
      });

    // Construct Date
    await dbClient<dbTypes.Date>(tables.dateTable.fullTableName)
      .insert({
        uuid: dateEntity.uuid,
        termbase_uuid: termbaseUUID,
        order: 1,
        value: dateFormat.asString(
          "yyyy-MM-dd",
          new Date(),
        ),
      });

    await this.helpers.saveChildTable(
      parentEntity,
      transacEntity,
      dbClient
    );

    await this.helpers.saveChildTable(
      transacEntity,
      transacNoteEntity,
      dbClient
    );

    await this.helpers.saveChildTable(
      transacEntity,
      dateEntity,
      dbClient
    );

    // Construct Note
    if (note !== undefined) {
      const noteEntity = new TbxEntity({
        ...tables.auxNoteTable,
        uuid: uuid()
      });

      await dbClient<dbTypes.AuxNote>(tables.auxNoteTable.fullTableName)
        .insert({
          uuid: noteEntity.uuid,
          termbase_uuid: termbaseUUID,
          order: 2,
          value: note,
        });
      
      await this.helpers.saveChildTable(
        transacEntity,
        noteEntity,
        dbClient
      );
    }
  } 
}

export default TransactionService;