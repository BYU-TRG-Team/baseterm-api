import { 
  TbxTable, 
  TbxEntity 
} from "../db/classes"; 
import * as tables from "../db/tables";
import * as dbTypes from "../db/types";
import { Knex } from "knex";
import { TbxElement, DBClient, GenericObject, UUID } from "../types";

class Helpers {
  public async getChildTables<ChildType>(
    parentEntity: TbxEntity, 
    childTable: TbxTable, 
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
    whereFilters = {},
  ) {
    const associatedTable = `${parentEntity.fullTableName}_${childTable.tableName}`;
    return (
      await dbClient(associatedTable)
        .join(
          childTable.fullTableName, 
          `${childTable.fullTableName}.uuid`, 
          "=", 
          `${associatedTable}.${childTable.tableName}_uuid`)
        .where({
          [`${associatedTable}.${parentEntity.tableName}_uuid`]: parentEntity.uuid,
          ...whereFilters,
        })
        .orderBy(
          "order",
          "asc",
        )
        .select<ChildType[]>("*")
    ) as ChildType[];
  }

  public saveChildTable(
    parentEntity: TbxEntity, 
    childEntity: TbxEntity, 
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ) {
    return dbClient(`${parentEntity.fullTableName}_${childEntity.tableName}`)
      .insert({ 
        [`${childEntity.tableName}_uuid`]: childEntity.uuid,
        [`${parentEntity.tableName}_uuid`]: parentEntity.uuid
      });
  }

  public async deleteChildTables(
    parentEntity: TbxEntity,
    childTable: TbxTable,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
    options: {
      whereFilters?: GenericObject,
      onDelete?: (childRow: { uuid: UUID}) => Promise<void>,
    } = {}
  ) {
    const {
      whereFilters = {},
      onDelete = async function(childRow: { uuid: UUID}) {
        await dbClient(childTable.fullTableName)
          .where({
            uuid: childRow.uuid
          })
          .delete();
      }
    } = options;

    const associatedTable = `${parentEntity.fullTableName}_${childTable.tableName}`;

    const childRows = await dbClient(associatedTable)
      .join(
        childTable.fullTableName,
        `${childTable.fullTableName}.uuid`,
        "=",
        `${associatedTable}.${childTable.tableName}_uuid`)
      .where({
        [`${associatedTable}.${parentEntity.tableName}_uuid`]: parentEntity.uuid,
        ...whereFilters,
      })
      .select("*");

    for (const childRow of childRows) {
      await onDelete(
        childRow
      );
    }
  }

  public async getParentTable<ParentType extends {
    uuid: string
  }>(
    childEntity: TbxEntity, 
    parentTable: TbxTable, 
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
    whereFilters = {},
  ): Promise<ParentType | null> {
    const associatedTable = `${parentTable.fullTableName}_${childEntity.tableName}`;
    const parentReferenceRows = await dbClient(associatedTable)
      .join(
        childEntity.fullTableName, 
        `${childEntity.fullTableName}.uuid`, 
        "=", 
        `${associatedTable}.${childEntity.tableName}_uuid`)
      .where({
        [`${associatedTable}.${childEntity.tableName}_uuid`]: childEntity.uuid,
        ...whereFilters,
      })
      .select(
        `${associatedTable}.${parentTable.tableName}_uuid`
      );
    
    if (parentReferenceRows[0] === undefined) return null;

    const parentUUID = parentReferenceRows[0][`${parentTable.tableName}_uuid`] as string;
    const parentRows = 
      await dbClient<{uuid: string}>(parentTable.fullTableName)
        .where({
          uuid: parentUUID,
        })
        .select("*"); 

    return parentRows[0] as ParentType;  
  }

  public pluckOneValue<DBRowList extends { value: string}>(list: DBRowList[]){
    const firstRow = list[0];

    return firstRow !== undefined ?
      firstRow.value :
      "";
  }

  public pluckOne<DBRowList>(list: DBRowList[]){
    const firstRow = list[0];

    return firstRow !== undefined ?
      firstRow :
      null;
  }

  public async saveId(
    id: string, 
    termbaseUUID: string,
    entity: TbxEntity, 
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ) {
    return dbClient<dbTypes.Id>(tables.idTable.fullTableName)
      .insert({ 
        termbase_uuid: termbaseUUID,
        id,
        entity_table: entity.fullTableName,
        entity_uuid: entity.uuid,
      });
  }

  public async isExistingID(
    termbaseUUID: UUID,
    id: string,
    dbClient: DBClient,
  ) {
    const idRow = 
      this.pluckOne(
        await dbClient<dbTypes.Id>(tables.idTable.fullTableName)
          .where({
            termbase_uuid: termbaseUUID,
            id,
          })
          .select("*")
      );

    return idRow !== null;
  }

  public async computeNestedNextOrder<ChildType extends {
    order: number,
  }>(
    parentEntity: TbxEntity,
    childTable: TbxTable,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>
  ): Promise<number> {
    const children = await this.getChildTables<ChildType>(
      parentEntity,
      childTable,
      dbClient
    );

    const computedOrder = 
      children.length === 0 ?
        0 :
        children[children.length - 1].order + 1;

    return computedOrder;
  }

  public async computeNextOrder(
    termbaseUUID: string,
    table: TbxTable,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<number> {
    const { order: maxOrder } = 
      this.pluckOne<{order: number | null}>(
        await dbClient(table.fullTableName)
          .where({
            termbase_uuid: termbaseUUID
          })  
          .max({
            "order": "order"
          })
      ) as {order: number | null};
    
    if (maxOrder === null) return 0;

    return maxOrder;
  }

  // TODO: move to utls
  public mapTbxElementToTable(
    tbxElement: TbxElement
  ) {
    switch (tbxElement) {
    case (TbxElement.Admin):
      return tables.adminTable;

    case (TbxElement.AdminGrp):
      return tables.adminTable;

    case (TbxElement.Descrip):
      return tables.descripTable;

    case (TbxElement.DescripGrp):
      return tables.descripTable;

    case (TbxElement.Transac):
      return tables.transacTable;

    case (TbxElement.TransacGrp):
      return tables.transacTable;
        
    case (TbxElement.Note):
      return tables.auxNoteTable;

    case (TbxElement.Ref):
      return tables.refTable;

    case (TbxElement.Xref):
      return tables.xrefTable;

    case (TbxElement.Date):
      return tables.dateTable;

    case (TbxElement.AdminNote):
      return tables.auxNoteTable;
        
    case (TbxElement.DescripNote):
      return tables.auxNoteTable;

    case (TbxElement.TransacNote):
      return tables.auxNoteTable;

    case (TbxElement.Term):
      return tables.termTable;

    case (TbxElement.LangSec):
      return tables.langSecTable;

    case (TbxElement.ConceptEntry):
      return tables.conceptEntryTable;

    case (TbxElement.TermNote):
      return tables.termNoteTable;
      
    case (TbxElement.TermNoteGrp):
      return tables.termNoteTable;

    default:
      return null;
    }
  }
}

export default Helpers;