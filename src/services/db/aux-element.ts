import * as tables from "../../db/tables";
import * as types from "../../types";
import * as dbTypes from "../../db/types";
import { Knex } from "knex";
import { MinPriorityQueue } from "@datastructures-js/priority-queue";
import { TbxElement, TbxEntity, TbxTable } from "../../db/classes";
import Helpers from "../../helpers";

export class AuxElementService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
  ){
    this.dbClient = dbClient;
    this.helpers = helpers;
  }

  public translateDbResponseToAPIResponse(
    auxDbRow: any
  ): types.AuxElement {
    const apiResponse = {} as {[key: string]: any};

    const whitelistedAttributes = [
      "auxElements",
      "datatype",
      "xml_lang",
      "target",
      "termbase_uuid",
      "id",
      "order",
      "uuid",
      "value",
      "type",
      "elementType",
      "grpId",
    ];

    Object.keys(auxDbRow)
      .filter((key: string) => {
        return whitelistedAttributes.includes(key);
      })
      .forEach((key: string) => {
        const translatedKey = (function(key: string) {
          switch(key) {
          case "termbase_uuid":
            return "termbaseUUID";

          case "xml_lang":
            return "xmlLang";
              
          default: 
            return key;
          }(key);
        })(key);

        apiResponse[translatedKey] = auxDbRow[key];
      });

    return apiResponse as types.AuxElement;
  }

  private async retrieveGenericAuxElement(
    elementType: types.TbxAuxElement,
    elementTable: TbxTable, 
    parentEntity: TbxEntity, 
    whereFilters = {},
  ): Promise<types.AuxElement[]> {
    const auxElementRows = 
      await this.helpers.getChildTables(
        parentEntity,
        elementTable,
        this.dbClient,
        whereFilters,
      );

    return auxElementRows.map((auxElement: any) => (
      this.translateDbResponseToAPIResponse({
        ...auxElement,
        elementType,
      }) as types.AuxElement));
  }

  private async retrieveAuxNote(
    parentEntity: TbxEntity, 
    elementType: types.TbxElement
  ): Promise<types.AuxElement[]> {
    const auxNoteRows = 
      await this.helpers.getChildTables(
        parentEntity,
        tables.auxNoteTable,
        this.dbClient,
        {
          [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: 
            elementType === types.TbxElement.Note,
        }
      );

    return auxNoteRows.map((auxElement: any) => (
      this.translateDbResponseToAPIResponse({
        ...auxElement,
        elementType,
      }) as types.AuxElement));
  }

  private async retrieveGroupAuxElement(
    elementTable: TbxTable, 
    parentEntity: TbxEntity, 
    childAuxElements: types.TbxElement[],
    elementType: types.TbxElement
  ): Promise<types.AuxElement[]> {
    const auxGroupElements: types.AuxElement[] = [];
    const conditionalDbField = `is_${elementTable.tableName}_grp`;
    const grpIdField = `${elementTable.tableName}_grp_id`;
    const auxGroupElementRows = 
      await this.helpers.getChildTables<types.GenericObject>(
        parentEntity,
        elementTable,
        this.dbClient,
        {
          [`${elementTable.fullTableName}.${conditionalDbField}`]: true,
        }
      );

    for (const auxGroupElementRow of auxGroupElementRows) {
      auxGroupElements.push(
        this.translateDbResponseToAPIResponse(
          {
            ...auxGroupElementRow,
            elementType,
            grpId: auxGroupElementRow[grpIdField],
            auxElements: await this.retrieveAuxElements(
              new TbxEntity({
                ...elementTable,
                uuid: auxGroupElementRow.uuid
              }),
              childAuxElements
            ) as types.AuxElement[]
          }
        )
      );
    }

    return auxGroupElements;
  }

  public async retrieveAuxElements(
    parentEntity: TbxEntity, 
    elements: types.TbxElement[]
  ): Promise<types.AuxElement[]> {
    const auxElementsQueue = new MinPriorityQueue((element: types.AuxElement) => element.order);
    
    const pushGenericAuxElement = async (
      elementName: types.TbxAuxElement, 
      elementTable: TbxTable, 
      whereFilters = {},
    ) => {
      const genericAuxElements = await this.retrieveGenericAuxElement(
        elementName,
        elementTable, 
        parentEntity, 
        whereFilters,
      );

      genericAuxElements.forEach((auxElement) => auxElementsQueue.enqueue(auxElement));
    };

    const pushGroupAuxElement = async (
      elementTable: TbxTable, 
      childAuxElements: types.TbxElement[],
      elementType: types.TbxElement,
    ) => {
      const groupAuxElements = await this.retrieveGroupAuxElement(
        elementTable,
        parentEntity,
        childAuxElements,
        elementType
      );

      groupAuxElements.forEach((auxElement) => auxElementsQueue.enqueue(auxElement));
    };

    const pushAuxNoteElement = async (
      elementType: types.TbxElement
    ) => {
      const auxNoteElements = await this.retrieveAuxNote(
        parentEntity,
        elementType,
      );

      auxNoteElements.forEach((auxElement) => auxElementsQueue.enqueue(auxElement));
    };


    for (const auxName of elements) {
      switch(auxName) {

      case types.TbxElement.Admin:
        await pushGenericAuxElement(
          types.TbxElement.Admin, 
          tables.adminTable,
          {
            [`${tables.adminTable.fullTableName}.is_admin_grp`]: false,
          }
        );
        break;

      case types.TbxElement.AdminGrp:
        await pushGroupAuxElement(
          tables.adminTable,
          [
            types.TbxElement.AdminNote,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.Xref
          ],
          types.TbxElement.AdminGrp,
        );
        break;

      case types.TbxElement.AdminNote:
        await pushAuxNoteElement(types.TbxElement.AdminNote);
        break;

      case types.TbxElement.Descrip:
        await pushGenericAuxElement(
          types.TbxElement.Descrip, 
          tables.descripTable,
          {
            [`${tables.descripTable.fullTableName}.is_descrip_grp`]: false,
          }
        );
        break;

      case types.TbxElement.DescripGrp:
        await pushGroupAuxElement(
          tables.descripTable,
          [
            types.TbxElement.Admin,
            types.TbxElement.AdminGrp,
            types.TbxElement.DescripNote,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.TransacGrp,
            types.TbxElement.Xref,
          ],
          types.TbxElement.DescripGrp,
        );
        break;
          
      case types.TbxElement.DescripNote:
        await pushAuxNoteElement(types.TbxElement.DescripNote);
        break;

      case types.TbxElement.Transac:
        await pushGenericAuxElement(
          types.TbxElement.Transac, 
          tables.transacTable,
          {
            [`${tables.transacTable.fullTableName}.is_transac_grp`]: false,
          }
        );
        break;
          
      case types.TbxElement.TransacGrp: 
        await pushGroupAuxElement(
          tables.transacTable,
          [
            types.TbxElement.Date,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.TransacNote,
            types.TbxElement.Xref,
          ],
          types.TbxElement.TransacGrp
        );
        break;

      case types.TbxElement.TransacNote:
        await pushAuxNoteElement(types.TbxElement.TransacNote);
        break;
          
      case types.TbxElement.Note:
        await pushAuxNoteElement(types.TbxElement.Note);
        break;

      case types.TbxElement.Ref:
        await pushGenericAuxElement(
          types.TbxElement.Ref, 
          tables.refTable
        );
        break;

      case types.TbxElement.Xref:
        await pushGenericAuxElement(
          types.TbxElement.Xref, 
          tables.xrefTable
        );
        break;

      case types.TbxElement.Date:
        await pushGenericAuxElement(
          types.TbxElement.Date, 
          tables.dateTable
        );
        break;      
      }
    }

    const auxElements: types.AuxElement[] = [];
    while (!auxElementsQueue.isEmpty()) {
      auxElements.push(
        auxElementsQueue.dequeue()
      );
    }

    return auxElements;
  }



  public async retrieveAuxInfo(
    parentEntity: TbxEntity, 
  ): Promise<types.AuxElement[]> {
    return await this.retrieveAuxElements(
      parentEntity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.Descrip,
        types.TbxElement.DescripGrp,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ]
    );
  }

  public async retrieveAuxNoteLinkInfo(
    parentEntity: TbxEntity, 
  ): Promise<types.AuxElement[]> {
    return await this.retrieveAuxElements(
      parentEntity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ]
    );
  }

  private async deleteAuxElements(
    parentEntity: TbxEntity,
    elements: types.TbxElement[],
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<void> {
    for (const auxName of elements) {
      switch(auxName) {
      case types.TbxElement.Admin: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.adminTable,
          dbClient,
          {
            [`${tables.adminTable.fullTableName}.is_admin_grp`]: false,
          }
        );
        break;

      case types.TbxElement.AdminGrp: {
        const adminGrpRows = await this.helpers.getChildTables<dbTypes.Admin>(
          parentEntity,
          tables.adminTable,
          dbClient,
          {
            [`${tables.adminTable.fullTableName}.is_admin_grp`]: true,
          }
        );

        for (const adminGrpRow of adminGrpRows) {
          const adminGrpEntity = new TbxEntity({
            ...tables.adminTable,
            uuid: adminGrpRow.uuid,
          });

          await this.deleteAuxElements(
            adminGrpEntity,
            [
              types.TbxElement.AdminNote,
              types.TbxElement.Note,
              types.TbxElement.Ref,
              types.TbxElement.Xref,
            ],
            dbClient
          );

          await dbClient<dbTypes.Admin>(tables.adminTable.fullTableName)
            .where({
              uuid: adminGrpRow.uuid,
            })
            .delete();
        }

        break;
      }

      case types.TbxElement.AdminNote: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.auxNoteTable,
          dbClient,
          {
            [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: false,
          }
        );
            
        break;

      case types.TbxElement.Descrip:
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.descripTable,
          dbClient,
          {
            [`${tables.descripTable.fullTableName}.is_descrip_grp`]: false,
          }
        );
            
        break;

      case types.TbxElement.DescripGrp: {
        const descripGrpRows = await this.helpers.getChildTables<dbTypes.Descrip>(
          parentEntity,
          tables.descripTable,
          dbClient,
          {
            [`${tables.descripTable.fullTableName}.is_descrip_grp`]: true,
          }
        );

        for (const descripGrpRow of descripGrpRows) {
          const descripGrpEntity = new TbxEntity({
            ...tables.descripTable,
            uuid: descripGrpRow.uuid
          });

          await this.deleteAuxElements(
            descripGrpEntity,
            [
              types.TbxElement.Admin,
              types.TbxElement.AdminGrp,
              types.TbxElement.DescripNote,
              types.TbxElement.Note,
              types.TbxElement.Ref,
              types.TbxElement.TransacGrp,
              types.TbxElement.Xref
            ],
            dbClient
          );

          await dbClient<dbTypes.Descrip>(tables.descripTable.fullTableName)
            .where({
              uuid: descripGrpRow.uuid
            })
            .delete();
        }

        break;
      }

      case types.TbxElement.DescripNote: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.auxNoteTable,
          dbClient,
          {
            [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: false,
          }
        );
        break;

      case types.TbxElement.Transac: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.transacTable,
          dbClient,
          {
            [`${tables.transacTable.fullTableName}.is_transac_grp`]: false,
          }
        );  

        break;

      case types.TbxElement.TransacGrp: {
        const transacGrpRows = await this.helpers.getChildTables<dbTypes.Transac>(
          parentEntity,
          tables.transacTable,
          dbClient,
          {
            [`${tables.transacTable.fullTableName}.is_transac_grp`]: true,
          }
        );

        for (const transacGrpRow of transacGrpRows) {
          const transacGrpEntity = new TbxEntity({
            ...tables.transacTable,
            uuid: transacGrpRow.uuid,
          });

          await this.deleteAuxElements(
            transacGrpEntity,
            [
              types.TbxElement.Date,
              types.TbxElement.Note,
              types.TbxElement.Ref,
              types.TbxElement.TransacNote,
              types.TbxElement.Xref
            ],
            dbClient
          );

          await dbClient<dbTypes.Transac>(tables.transacTable.fullTableName)
            .where({
              uuid: transacGrpRow.uuid,
            })
            .delete();
        }

        break;
      }

      case types.TbxElement.TransacNote:
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.auxNoteTable,
          dbClient,
          {
            [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: false,
          }
        );

        break;

      case types.TbxElement.Note:
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.auxNoteTable,
          dbClient,
          {
            [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: true,
          }
        );
            
        break;

      case types.TbxElement.Ref:
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.refTable,
          dbClient
        );

        break;

      case types.TbxElement.Xref: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.xrefTable,
          dbClient
        );

        break;

      case types.TbxElement.Date: 
        await this.helpers.deleteChildTables(
          parentEntity,
          tables.dateTable,
          dbClient
        );

        break;
        
      }
    }
  }

  public async deleteAuxInfo(
    parentEntity: TbxEntity,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>
  ): Promise<void> {
    return await this.deleteAuxElements(
      parentEntity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.Descrip,
        types.TbxElement.DescripGrp,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ],
      dbClient
    );
  }

  public async deleteAuxNoteLinkInfo(
    parentEntity: TbxEntity,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<void> {
    return await this.deleteAuxElements(
      parentEntity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ],
      dbClient
    );
  }

  public async deleteAdminGrpAuxElements(
    parentEntity: TbxEntity,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<void> {
    return await this.deleteAuxElements(
      parentEntity,
      [
        types.TbxElement.AdminNote,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.Xref,
      ],
      dbClient
    );
  }

  public async deleteDescripGrpAuxElements(
    parentEntity: TbxEntity,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<void> {
    return await this.deleteAuxElements(
      parentEntity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.DescripNote,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ],
      dbClient
    );
  }

  public async deleteTransacGrpAuxElements(
    parentEntity: TbxEntity,
    dbClient: Knex.Transaction<any, any[]> | Knex<any, unknown[]>,
  ): Promise<void> {
    return await this.deleteAuxElements(
      parentEntity,
      [
        types.TbxElement.Date,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacNote,
        types.TbxElement.Xref,
      ],
      dbClient
    );
  }
}

export default AuxElementService;