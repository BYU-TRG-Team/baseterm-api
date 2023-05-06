import { Knex } from "knex";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import * as types from "@typings";
import { TbxEntity } from "@db/classes";
import * as xml2js from "xml2js";
import { isDefined, describe } from "@utils";
import { v4 as uuid } from "uuid";
import GlobalStore from "@services/store";
import Helpers from "@helpers";

interface IdRef {
  entity: TbxEntity,
  ref: string;
}

interface TransactionData {
  refs: IdRef[],
  termbaseUUID: string;
}

interface TransacClient {
  data: TransactionData;
  transact: Knex.Transaction<any, any[]>;
}

interface ConsumptionConfig {
  tbxObject: any, 
  baseName: string, 
  termbaseUUID: string,
  sessionId: string,
  conceptEntryCount: number,
  globalStore: GlobalStore,
}

class TBXConsumer {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
  }
  
  private getInnerValue(element: any): string {
    if (typeof element === "string") return element; 
    if (isDefined(element._)) return element._;
    
    const xmlBuilder = new xml2js.Builder();
    let innerValueString = "";

    Object.keys(element)
      .filter((key) => !["$", "_"].includes(key))
      .forEach((key: string) => {
        const elementChildren = 
        element[key]
          .map((xmlElement: any) => xmlBuilder.buildObject(xmlElement))
          .join("");
        innerValueString += elementChildren;
      });

    return innerValueString;
  }

  private storeIdRef(element: any, entity: TbxEntity, transacClient: TransacClient) {
    if (!isDefined(element.$?.[types.TBXAttribute.target])) return;
    
    transacClient.data.refs.push({
      ref: element.$?.[types.TBXAttribute.target] as unknown as string,
      entity: entity 
    });
  }

  private async saveId(element: any, entity: TbxEntity, transacClient: TransacClient) {
    if (!isDefined(element.$?.[types.TBXAttribute.id])) return; 
    
    await transacClient.transact<dbTypes.Id>(tables.idTable.fullTableName)
      .insert({ 
        termbase_uuid: transacClient.data.termbaseUUID,
        id: element.$?.[types.TBXAttribute.id],
        entity_table: entity.fullTableName,
        entity_uuid: entity.uuid,
      });

    return;
  }

  private async consumeItem(itemElement: any, parentEntity: TbxEntity, transacClient: TransacClient, itemGrpElement: any = undefined) {
    const itemEntity = new TbxEntity({ 
      ...tables.itemTable, 
      uuid: uuid()
    });

    await this.saveId(
      itemElement, 
      itemEntity, 
      transacClient
    );

    if (isDefined(itemGrpElement)) {
      await this.saveId(
        itemGrpElement, 
        itemEntity, 
        transacClient
      );
    }

    await transacClient.transact<dbTypes.Item>(tables.itemTable.fullTableName)
      .insert({ 
        uuid: itemEntity.uuid,
        id: itemElement.$?.[types.TBXAttribute.id],
        type: itemElement.$?.[types.TBXAttribute.type],
        item_grp_id: itemGrpElement?.$?.[types.TBXAttribute.id],
        is_item_grp: isDefined(itemGrpElement),
        termbase_uuid: transacClient.data.termbaseUUID,
        value: this.getInnerValue(itemElement),
        order: 
        Number(
          isDefined(itemGrpElement) ? 
            itemGrpElement.$?.[dbTypes.AuxiliaryAttribute.Order] :
            itemElement.$?.[dbTypes.AuxiliaryAttribute.Order]
        ),
      });     

    await this.helpers.saveChildTable(
      parentEntity, 
      itemEntity, 
      transacClient.transact,
    );

    if (isDefined(itemGrpElement)) {
      await this.consumeNoteLinkInfo(
        itemGrpElement, 
        itemEntity, 
        transacClient
      );
    }
  }

  private async consumeTermNote(termNoteElement: any, parentEntity: TbxEntity, transacClient: TransacClient, termNoteGrpElement: any = undefined) {
    const termNoteEntity = new TbxEntity({ 
      ...tables.termNoteTable, 
      uuid: uuid()
    });
    
    await this.saveId(
      termNoteElement,
      termNoteEntity, 
      transacClient
    );

    if (isDefined(termNoteGrpElement)) {
      await this.saveId(
        termNoteGrpElement, 
        termNoteEntity, 
        transacClient
      );
    }
    
    await transacClient.transact<dbTypes.TermNote>(tables.termNoteTable.fullTableName)
      .insert({ 
        uuid: termNoteEntity.uuid,
        xml_lang: termNoteElement.$?.[types.TBXAttribute.xmlLang],
        target: null,
        id: termNoteElement.$?.[types.TBXAttribute.id],
        termbase_uuid: transacClient.data.termbaseUUID,
        datatype: termNoteElement.$?.[types.TBXAttribute.datatype],
        type: termNoteElement.$?.[types.TBXAttribute.type],
        is_term_note_grp: isDefined(termNoteGrpElement),
        term_note_grp_id: termNoteGrpElement?.$?.[types.TBXAttribute.id],
        value: this.getInnerValue(termNoteElement),
        order: 
          Number(
            isDefined(termNoteGrpElement) ? 
              termNoteGrpElement.$?.[dbTypes.AuxiliaryAttribute.Order] :
              termNoteElement.$?.[dbTypes.AuxiliaryAttribute.Order]
          )
      }); 

    await this.helpers.saveChildTable(
      parentEntity, 
      termNoteEntity, 
      transacClient.transact
    );

    await this.storeIdRef(
      termNoteElement, 
      termNoteEntity, 
      transacClient
    );

    if (isDefined(termNoteGrpElement)) {
      await this.consumeNoteLinkInfo(
        termNoteGrpElement,
        termNoteEntity,
        transacClient
      );
    }
  }

  private async consumeRef(refElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const refEntity = new TbxEntity({ 
      ...tables.refTable, 
      uuid: uuid(),
    });
    
    await this.saveId(
      refElement, 
      refEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.Ref>(tables.refTable.fullTableName)
      .insert({ 
        uuid: refEntity.uuid,
        id: refElement.$?.[types.TBXAttribute.id],
        target: null,
        termbase_uuid: transacClient.data.termbaseUUID,
        xml_lang: refElement.$?.[types.TBXAttribute.xmlLang],
        datatype: refElement.$?.[types.TBXAttribute.datatype],
        type: refElement.$?.[types.TBXAttribute.type],
        value: this.getInnerValue(refElement),
        order: refElement.$?.[dbTypes.AuxiliaryAttribute.Order],
      });  

    await this.storeIdRef(
      refElement, 
      refEntity, 
      transacClient 
    );

    await this.helpers.saveChildTable(
      parentEntity, 
      refEntity, 
      transacClient.transact
    );
  }

  private async consumeXref(xrefElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const xrefEntity = new TbxEntity({ 
      ...tables.xrefTable,
      uuid: uuid()
    });
    
    await this.saveId(
      xrefElement, 
      xrefEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.Xref>(tables.xrefTable.fullTableName)
      .insert({ 
        uuid: xrefEntity.uuid,
        id: xrefElement.$?.[types.TBXAttribute.id],
        termbase_uuid: transacClient.data.termbaseUUID,
        target: xrefElement.$?.[types.TBXAttribute.target],
        type: xrefElement.$?.[types.TBXAttribute.type],
        value: this.getInnerValue(xrefElement),
        order: xrefElement.$?.[dbTypes.AuxiliaryAttribute.Order],
      });  

    await this.helpers.saveChildTable(
      parentEntity, 
      xrefEntity, 
      transacClient.transact
    );
  }

  private async consumeDate(dateElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const dateEntity = new TbxEntity({ 
      ...tables.dateTable, 
      uuid: uuid()
    });
    
    await this.saveId(
      dateElement, 
      dateEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.Date>(tables.dateTable.fullTableName)
      .insert({ 
        uuid: dateEntity.uuid,
        id: dateElement.$?.[types.TBXAttribute.id],
        termbase_uuid: transacClient.data.termbaseUUID,
        value: this.getInnerValue(dateElement),
        order: dateElement.$?.[dbTypes.AuxiliaryAttribute.Order],
      });  

    await this.helpers.saveChildTable(
      parentEntity, 
      dateEntity, 
      transacClient.transact
    );
  }

  private async consumeAuxNote(auxNoteElement: any, parentEntity: TbxEntity, transacClient: TransacClient, isGeneric = false) {
    const auxNoteEntity = new TbxEntity({ 
      ...tables.auxNoteTable, 
      uuid: uuid(),
    });
    
    await this.saveId(
      auxNoteElement, 
      auxNoteEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.AuxNote>(tables.auxNoteTable.fullTableName)
      .insert({ 
        uuid: auxNoteEntity.uuid,
        id: auxNoteElement.$?.[types.TBXAttribute.id],
        termbase_uuid: transacClient.data.termbaseUUID,
        target: null,
        xml_lang: auxNoteElement.$?.[types.TBXAttribute.xmlLang],
        type: auxNoteElement.$?.[types.TBXAttribute.type],
        is_generic_note: isGeneric,
        value: this.getInnerValue(auxNoteElement),
        order: auxNoteElement.$?.[dbTypes.AuxiliaryAttribute.Order],
      });

    await this.storeIdRef(
      auxNoteElement, 
      auxNoteEntity, 
      transacClient
    );

    await this.helpers.saveChildTable(
      parentEntity, 
      auxNoteEntity,
      transacClient.transact
    );
  }

  private async consumeTransac(transacElement: any, parentEntity: TbxEntity, transacClient: TransacClient, transacGrpElement: any = undefined) {
    const transacEntity = new TbxEntity({ 
      ...tables.transacTable, 
      uuid: uuid()
    });
    
    await this.saveId(
      transacElement, 
      transacEntity, 
      transacClient
    );

    if (isDefined(transacGrpElement)) {
      await this.saveId(
        transacGrpElement, 
        transacEntity, 
        transacClient
      );
    }

    await transacClient.transact<dbTypes.Transac>(tables.transacTable.fullTableName)
      .insert({ 
        uuid: transacEntity.uuid,
        xml_lang: transacElement.$?.[types.TBXAttribute.xmlLang],
        id: transacElement.$?.[types.TBXAttribute.id],
        target: null,
        termbase_uuid: transacClient.data.termbaseUUID,
        datatype: transacElement.$?.[types.TBXAttribute.datatype],
        type: transacElement.$?.[types.TBXAttribute.type],
        is_transac_grp: isDefined(transacGrpElement),
        transac_grp_id: transacGrpElement?.$?.[types.TBXAttribute.id],
        value: this.getInnerValue(transacElement),
        order: 
          Number(
            isDefined(transacGrpElement) ? 
              transacGrpElement.$?.[dbTypes.AuxiliaryAttribute.Order] :
              transacElement.$?.[dbTypes.AuxiliaryAttribute.Order]
          )
      });  

    await this.storeIdRef(
      transacElement, 
      transacEntity, 
      transacClient
    );

    await this.helpers.saveChildTable(
      parentEntity, 
      transacEntity, 
      transacClient.transact
    );

    if (isDefined(transacGrpElement)) {
      await this.consumeAuxElements(
        transacGrpElement, 
        transacEntity, 
        [
          types.TbxElement.Date,
          types.TbxElement.Note,
          types.TbxElement.Ref,
          types.TbxElement.TransacNote,
          types.TbxElement.Xref,
        ],
        transacClient);
    }
  }

  private async consumeAdmin(adminElement: any, parentEntity: TbxEntity, transacClient: TransacClient, adminGrpElement: any = undefined) {
    const adminEntity = new TbxEntity({ 
      ...tables.adminTable, 
      uuid: uuid()
    });
    
    await this.saveId(
      adminElement, 
      adminEntity, 
      transacClient
    );
   
    if (isDefined(adminGrpElement)) {
      await this.saveId(
        adminGrpElement, 
        adminEntity, 
        transacClient
      );
    }

    await transacClient.transact<dbTypes.Admin>(tables.adminTable.fullTableName)
      .insert({ 
        uuid: adminEntity.uuid,
        id: adminElement.$?.[types.TBXAttribute.id],
        target: null,
        termbase_uuid: transacClient.data.termbaseUUID,
        xml_lang: adminElement.$?.[types.TBXAttribute.xmlLang],
        datatype: adminElement.$?.[types.TBXAttribute.datatype],
        type: adminElement.$?.[types.TBXAttribute.type],
        is_admin_grp: isDefined(adminGrpElement),
        admin_grp_id: adminGrpElement?.$?.[types.TBXAttribute.id],
        value: this.getInnerValue(adminElement),
        order: 
          Number(
            isDefined(adminGrpElement) ? 
              adminGrpElement.$?.[dbTypes.AuxiliaryAttribute.Order] :
              adminElement.$?.[dbTypes.AuxiliaryAttribute.Order]
          )
      });  

    await this.storeIdRef(
      adminElement, 
      adminEntity, 
      transacClient
    );

    await this.helpers.saveChildTable(
      parentEntity, 
      adminEntity, 
      transacClient.transact
    );

    if (isDefined(adminGrpElement)) {
      await this.consumeAuxElements(
        adminGrpElement, 
        adminEntity, 
        [
          types.TbxElement.AdminNote,
          types.TbxElement.Note,
          types.TbxElement.Ref,
          types.TbxElement.Xref,
        ],
        transacClient);
    }
  }

  private async consumeDescrip(descripElement: any, parentEntity: TbxEntity, transacClient: TransacClient, descripGrpElement: any = undefined) {
    const descripEntity = new TbxEntity({ 
      ...tables.descripTable, 
      uuid: uuid(),
    });

    await this.saveId(
      descripElement,
      descripEntity, 
      transacClient
    );

    if (isDefined(descripGrpElement)) {
      await this.saveId(
        descripGrpElement, 
        descripEntity, 
        transacClient
      );
    }

    await transacClient.transact<dbTypes.Descrip>(tables.descripTable.fullTableName)
      .insert({ 
        uuid: descripEntity.uuid,
        xml_lang: descripElement.$?.[types.TBXAttribute.xmlLang],
        id: descripElement.$?.[types.TBXAttribute.id],
        target: null,
        termbase_uuid: transacClient.data.termbaseUUID,
        datatype: descripElement.$?.[types.TBXAttribute.datatype],
        type: descripElement.$?.[types.TBXAttribute.type],
        is_descrip_grp: isDefined(descripGrpElement),
        descrip_grp_id: descripGrpElement?.$?.[types.TBXAttribute.id],
        value: this.getInnerValue(descripElement),
        order: 
          Number(
            isDefined(descripGrpElement) ? 
              descripGrpElement.$?.[dbTypes.AuxiliaryAttribute.Order] :
              descripElement.$?.[dbTypes.AuxiliaryAttribute.Order]
          )
      });  

    await this.storeIdRef(
      descripElement, 
      descripEntity, 
      transacClient
    );

    await this.helpers.saveChildTable(
      parentEntity, 
      descripEntity, 
      transacClient.transact
    );

    if (isDefined(descripGrpElement)) {
      await this.consumeAuxElements(
        descripGrpElement, 
        descripEntity, 
        [
          types.TbxElement.Admin,
          types.TbxElement.AdminGrp,
          types.TbxElement.DescripNote,
          types.TbxElement.Note,
          types.TbxElement.Ref,
          types.TbxElement.TransacGrp,
          types.TbxElement.Xref,
        ],
        transacClient);
    }
  }

  private async consumeTransacGrp(transacGrpElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const transacElement = transacGrpElement[types.TbxElement.Transac][0];
    await this.consumeTransac(transacElement, parentEntity, transacClient, transacGrpElement);
  }

  private async consumeAdminGrp(adminGrpElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const adminElement = adminGrpElement[types.TbxElement.Admin][0];
    await this.consumeAdmin(adminElement, parentEntity, transacClient, adminGrpElement);
  }

  private async consumeDescripGrp(descripGrpElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const descripElement = descripGrpElement[types.TbxElement.Descrip][0];
    await this.consumeDescrip(descripElement, parentEntity, transacClient, descripGrpElement);
  }

  private async consumeItemGrp(itemGrpElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const itemElement = itemGrpElement[types.TbxElement.Item][0];
    await this.consumeItem(itemElement, parentEntity, transacClient, itemGrpElement);
  }

  private async consumeAuxElements(
    element: any, 
    entity: TbxEntity, 
    auxElements: types.TbxElement[],
    transacClient: TransacClient) {
    for (const auxElement of auxElements) {

      if (!isDefined(element[auxElement])) continue;

      switch (auxElement) {
      case types.TbxElement.Admin:
        for (const childElement of element[auxElement]) await this.consumeAdmin(childElement, entity, transacClient);
        break;
          
      case types.TbxElement.AdminGrp:
        for (const childElement of element[auxElement]) await this.consumeAdminGrp(childElement, entity, transacClient);  
        break;  
          
      case types.TbxElement.AdminNote:
        for (const childElement of element[auxElement]) await this.consumeAuxNote(childElement, entity, transacClient);
        break;

      case types.TbxElement.Descrip:
        for (const childElement of element[auxElement]) await this.consumeDescrip(childElement, entity, transacClient);
        break;

      case types.TbxElement.DescripGrp:
        for (const childElement of element[auxElement]) await this.consumeDescripGrp(childElement, entity, transacClient);  
        break;

      case types.TbxElement.DescripNote:
        for (const childElement of element[auxElement]) await this.consumeAuxNote(childElement, entity, transacClient);
        break;

      case types.TbxElement.Date:
        for (const childElement of element[auxElement]) await this.consumeDate(childElement, entity, transacClient);
        break;

      case types.TbxElement.Note:
        for (const childElement of element[auxElement]) await this.consumeAuxNote(childElement, entity, transacClient, true);
        break;

      case types.TbxElement.Ref:
        for (const childElement of element[auxElement]) await this.consumeRef(childElement, entity, transacClient);
        break;

      case types.TbxElement.TransacGrp:
        for (const childElement of element[auxElement]) await this.consumeTransacGrp(childElement, entity, transacClient);
        break;

      case types.TbxElement.TransacNote:
        for (const childElement of element[auxElement]) await this.consumeAuxNote(childElement, entity, transacClient);
        break;

      case types.TbxElement.Xref:
        for (const childElement of element[auxElement]) await this.consumeXref(childElement, entity, transacClient);
        break;

      }
    }
  }

  private async consumeAuxInfo(
    element: any, 
    entity: TbxEntity, 
    transacClient: TransacClient
  ) {
    await this.consumeAuxElements(
      element,
      entity,
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
      transacClient,
    );
  }

  private async consumeNoteLinkInfo(
    element: any, 
    entity: TbxEntity, 
    transacClient: TransacClient
  ) {
    await this.consumeAuxElements(
      element,
      entity,
      [
        types.TbxElement.Admin,
        types.TbxElement.AdminGrp,
        types.TbxElement.Note,
        types.TbxElement.Ref,
        types.TbxElement.TransacGrp,
        types.TbxElement.Xref,
      ],
      transacClient,
    );
  }

  private async consumeHeaderNote(headerNoteElement: any, parentEntity: TbxEntity, transacClient: TransacClient) {
    const headerNoteEntity = new TbxEntity({ 
      ...tables.headerNoteTable, 
      uuid: uuid(),
    });
    
    await this.saveId(
      headerNoteElement, 
      headerNoteEntity, 
      transacClient
    );
    
    await transacClient.transact<dbTypes.HeaderNote>(tables.headerNoteTable.fullTableName)
      .insert({ 
        uuid: headerNoteEntity.uuid,
        id: headerNoteElement.$?.[types.TBXAttribute.id],
        termbase_uuid: transacClient.data.termbaseUUID,
        xml_lang: headerNoteElement.$?.[types.TBXAttribute.xmlLang],
        type: headerNoteElement.$?.[types.TBXAttribute.type],
        value: this.getInnerValue(headerNoteElement),
        order: Number(headerNoteElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
      });
   
    await this.helpers.saveChildTable(
      parentEntity, 
      headerNoteEntity, 
      transacClient.transact
    );
  }

  private async consumeHeader(tbxHeaderElement: any, transacClient: TransacClient) {    
    const headerEntity = new TbxEntity({ 
      ...tables.headerTable, 
      uuid: uuid()
    });

    await this.saveId(
      tbxHeaderElement, 
      headerEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.Header>(tables.headerTable.fullTableName)
      .insert({ 
        uuid: headerEntity.uuid,
        termbase_uuid: transacClient.data.termbaseUUID,
        id: tbxHeaderElement.$?.[types.TBXAttribute.id],
      });

    await describe("Consume encodingDesc element", async () => {
      const encodingDescElement = tbxHeaderElement[types.TbxElement.EncodingDesc][0];
      const encodingDescEntity = new TbxEntity({
        ...tables.encodingDescTable,
        uuid: uuid(),
      });

      await this.saveId(
        encodingDescElement, 
        encodingDescEntity, 
        transacClient
      );

      await transacClient.transact<dbTypes.EncodingDesc>(tables.encodingDescTable.fullTableName)
        .insert({ 
          uuid: encodingDescEntity.uuid,
          termbase_uuid: transacClient.data.termbaseUUID,
          id: encodingDescElement.$?.[types.TBXAttribute.id],
        });
  
      await describe("Consume all p elements", async () => {
        for (const pElement of encodingDescElement[types.TbxElement.P]) {
          await this.consumeHeaderNote(pElement, encodingDescEntity, transacClient);
        }
      });
    }, isDefined(tbxHeaderElement[types.TbxElement.EncodingDesc]));

    await describe("Consume revisionDesc element", async () => {
      const revisionDescElement = tbxHeaderElement[types.TbxElement.RevisionDesc][0];
      const revisionDescEntity = new TbxEntity({
        ...tables.revisionDescTable,
        uuid: uuid(),
      });

      await this.saveId(
        revisionDescElement,
        revisionDescEntity, 
        transacClient
      );

      await transacClient.transact<dbTypes.RevisionDesc>(tables.revisionDescTable.fullTableName)
        .insert({ 
          uuid: revisionDescEntity.uuid,
          termbase_uuid: transacClient.data.termbaseUUID,
          id: revisionDescElement.$?.[types.TBXAttribute.id],
          xml_lang: revisionDescElement.$?.[types.TBXAttribute.xmlLang],
        });

      await describe("Consume all change elements", async () => {
        for (const changeElement of revisionDescElement[types.TbxElement.Change]) {
          const revisionDescChangeEntity = new TbxEntity({ 
            ...tables.revisionDescChangeTable, 
            uuid: uuid(),
          });
          
          await this.saveId(
            changeElement, 
            revisionDescChangeEntity, 
            transacClient
          );

          await transacClient.transact<dbTypes.RevisionDescChange>(tables.revisionDescChangeTable.fullTableName)
            .insert({ 
              uuid: revisionDescChangeEntity.uuid,
              termbase_uuid: transacClient.data.termbaseUUID,
              id: changeElement.$?.[types.TBXAttribute.id],
              xml_lang: changeElement.$?.[types.TBXAttribute.xmlLang],
              order: Number(changeElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
            });
          
          await describe("Consume all p elements", async () => {
            for (const pElement of changeElement[types.TbxElement.P]) {
              await this.consumeHeaderNote(pElement, revisionDescChangeEntity, transacClient);
            }
          });
        }
      });
    }, isDefined(tbxHeaderElement[types.TbxElement.RevisionDesc]));

    await describe("Consume fileDesc element", async () => {
      const fileDescElement = tbxHeaderElement[types.TbxElement.FileDesc][0];
      const fileDescEntity = new TbxEntity({
        ...tables.fileDescTable,
        uuid: uuid(),
      });

      await this.saveId(
        fileDescElement, 
        fileDescEntity, 
        transacClient
      );

      await transacClient.transact<dbTypes.FileDesc>(tables.fileDescTable.fullTableName)
        .insert({ 
          uuid: fileDescEntity.uuid,
          termbase_uuid: transacClient.data.termbaseUUID,
          id: fileDescElement.$?.[types.TBXAttribute.id],
        });

      await describe("Consume publicationStmt element", async () => {
        const publicationStmtElement = fileDescElement[types.TbxElement.PublicationStmt][0];
        const publicationStmtEntity = new TbxEntity({ 
          ...tables.publicationStmtTable, 
          uuid: uuid(),
        });
  
        await this.saveId(
          publicationStmtElement, 
          publicationStmtEntity, 
          transacClient
        );
  
        await transacClient.transact<dbTypes.PublicationStmt>(tables.publicationStmtTable.fullTableName)
          .insert({ 
            uuid: publicationStmtEntity.uuid,
            termbase_uuid: transacClient.data.termbaseUUID,
            id: publicationStmtElement.$?.[types.TBXAttribute.id],
          });
  
        await describe ("Consume all p elements", async () => {
          for (const pElement of publicationStmtElement[types.TbxElement.P]) {
            await this.consumeHeaderNote(pElement, publicationStmtEntity, transacClient);
          }
        });
  
      }, isDefined(fileDescElement[types.TbxElement.PublicationStmt]));  

      await describe("Consume sourceDesc element", async () => {
        const sourceDescElement = fileDescElement[types.TbxElement.SourceDesc][0]; 
        const sourceDescEntity = new TbxEntity({ 
          ...tables.sourceDescTable, 
          uuid: uuid()
        });
          
        await this.saveId(
          sourceDescElement, 
          sourceDescEntity, 
          transacClient
        );

        await transacClient.transact<dbTypes.SourceDesc>(tables.sourceDescTable.fullTableName)
          .insert({ 
            uuid: sourceDescEntity.uuid,
            termbase_uuid: transacClient.data.termbaseUUID,
            id: sourceDescElement.$?.[types.TBXAttribute.id],
            xml_lang: sourceDescElement.$?.[types.TBXAttribute.xmlLang],
          });

        await describe("Consume all p elements", async () => {
          for (const pElement of sourceDescElement[types.TbxElement.P]) {
            await this.consumeHeaderNote(pElement, sourceDescEntity, transacClient);
          }
        });
      });
  
      await describe("Consume titleStmt and title elements", async () => {
        const titleStmtElement = fileDescElement[types.TbxElement.TitleStmt][0];
        const titleElement = titleStmtElement[types.TbxElement.Title][0];
        const titleEntity = new TbxEntity({ 
          ...tables.titleTable, 
          uuid: uuid(),
        });

        await this.saveId(
          titleStmtElement, 
          titleEntity, 
          transacClient
        );

        await this.saveId(
          titleElement, 
          titleEntity, 
          transacClient
        );

        await transacClient.transact<dbTypes.Title>(tables.titleTable.fullTableName)
          .insert({ 
            uuid: titleEntity.uuid,
            xml_lang: titleElement.$?.[types.TBXAttribute.xmlLang],
            termbase_uuid: transacClient.data.termbaseUUID,
            id: titleElement.$?.[types.TBXAttribute.id],
            statement_id: titleStmtElement.$?.[types.TBXAttribute.id],
            statement_xml_lang: titleStmtElement.$?.[types.TBXAttribute.xmlLang],
            value: this.getInnerValue(titleElement),
          });

        await describe("Consume all note elements", async () => {
          for (const noteElement of titleStmtElement[types.TbxElement.Note]) {
            await this.consumeHeaderNote(noteElement, titleEntity, transacClient);
          }
        }, isDefined(titleStmtElement[types.TbxElement.Note]));
      }, isDefined(fileDescElement[types.TbxElement.TitleStmt]));
    });
  }

  private async consumeBack(backElement: any, transacClient: TransacClient) {    
    const backEntity = new TbxEntity({
      ...tables.backTable,
      uuid: uuid(),
    });

    await this.saveId(
      backElement, 
      backEntity, 
      transacClient
    );
   
    await transacClient.transact<dbTypes.Back>(tables.backTable.fullTableName)
      .insert({ 
        uuid: backEntity.uuid,
        termbase_uuid: transacClient.data.termbaseUUID,
        id: backElement.$?.[types.TBXAttribute.id],
      });
    
    await describe("Consume all refObjectSec elements", async () => {
      for (const refObjectSecElement of backElement[types.TbxElement.RefObjectSec]) {
        const refObjectSecEntity = new TbxEntity({ 
          ...tables.refObjectSecTable, 
          uuid: uuid()
        });

        await this.saveId(
          refObjectSecElement, 
          refObjectSecEntity, 
          transacClient,
        );
  
        await transacClient.transact<dbTypes.RefObjectSec>(tables.refObjectSecTable.fullTableName)
          .insert({ 
            uuid: refObjectSecEntity.uuid,
            type: refObjectSecElement.$?.[types.TBXAttribute.type],
            id: refObjectSecElement.$?.[types.TBXAttribute.id],
            termbase_uuid: transacClient.data.termbaseUUID,
            order: Number(refObjectSecElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
          });  

        await describe("Consume all refObject elements", async () => {
          for (const refObjectElement of refObjectSecElement[types.TbxElement.RefObject]) {
            const refObjectEntity = new TbxEntity({ 
              ...tables.refObjectTable, 
              uuid: uuid(),
            });

            await this.saveId(
              refObjectElement, 
              refObjectEntity, 
              transacClient
            );
    
            await transacClient.transact<dbTypes.RefObject>(tables.refObjectTable.fullTableName)
              .insert({ 
                uuid: refObjectEntity.uuid,
                id: refObjectElement.$?.[types.TBXAttribute.id],
                termbase_uuid: transacClient.data.termbaseUUID,
                order: Number(refObjectElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
              }); 
          
            await this.helpers.saveChildTable(
              refObjectSecEntity, 
              refObjectEntity, 
              transacClient.transact
            );
    
            await describe("Consume all itemSet elements", async () => {
              for (const itemSetElement of refObjectElement[types.TbxElement.ItemSet]) {
                const itemSetEntity = new TbxEntity({ 
                  ...tables.itemSetTable, 
                  uuid: uuid(),
                });

                await this.saveId(
                  itemSetElement, 
                  itemSetEntity, 
                  transacClient
                );
      
                await transacClient.transact<dbTypes.ItemSet>(tables.itemSetTable.fullTableName)
                  .insert({ 
                    uuid: itemSetEntity.uuid,
                    id: itemSetElement.$?.[types.TBXAttribute.id],
                    type: itemSetElement.$?.[types.TBXAttribute.type],
                    termbase_uuid: transacClient.data.termbaseUUID,
                    order: Number(itemSetElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
                  });
    
                await this.helpers.saveChildTable(
                  refObjectEntity,
                  itemSetEntity, 
                  transacClient.transact
                );
            
                await describe("Consume all itemGrp elements", async () => {
                  for (const itemGrpElement of itemSetElement[types.TbxElement.ItemGrp]) {
                    await this.consumeItemGrp(itemGrpElement, itemSetEntity, transacClient);
                  }
                }, isDefined(itemSetElement[types.TbxElement.ItemGrp]));

                await describe("Consume all item elements", async () => {
                  for (const itemElement of itemSetElement[types.TbxElement.Item]) {
                    await this.consumeItem(itemElement, itemSetEntity, transacClient);
                  }
                }, isDefined(itemSetElement[types.TbxElement.Item]));
              }
            }, isDefined(refObjectElement[types.TbxElement.ItemSet]));
    
            await describe("Consume all itemGrp elements", async () => {
              for (const itemGrpElement of refObjectElement[types.TbxElement.ItemGrp]) {
                await this.consumeItemGrp(itemGrpElement, refObjectEntity, transacClient);
              }
            }, isDefined(refObjectElement[types.TbxElement.ItemGrp]));
    
            await describe("Consume all item elements", async () => {
              for (const itemElement of refObjectElement[types.TbxElement.Item]) {     
                await this.consumeItem(itemElement, refObjectEntity, transacClient);
              }
            }, isDefined(refObjectElement[types.TbxElement.Item]));
          }
        });

      }
    }, isDefined(backElement[types.TbxElement.RefObjectSec]));
  }

  private async consumeBody(bodyElement: any, transacClient: TransacClient, consumptionConfig: ConsumptionConfig) {   
    const {
      sessionId,
      conceptEntryCount,
      globalStore,
    } = consumptionConfig;
   
    const bodyEntity = new TbxEntity({
      ...tables.bodyTable,
      uuid: uuid(),
    });

    await this.saveId(
      bodyElement, 
      bodyEntity, 
      transacClient
    );

    await transacClient.transact<dbTypes.Body>(tables.bodyTable.fullTableName)
      .insert({ 
        uuid: bodyEntity.uuid,
        termbase_uuid: transacClient.data.termbaseUUID,
        id: bodyElement.$?.[types.TBXAttribute.id],
      });

    await describe("Consume conceptEntry elements", async () => {
      let conceptEntryNumber = 0;

      for (const conceptEntryElement of bodyElement[types.TbxElement.ConceptEntry]) {
        const conceptEntryEntity = new TbxEntity({ 
          ...tables.conceptEntryTable, 
          uuid: uuid() 
        });

        await this.saveId(
          conceptEntryElement, 
          conceptEntryEntity, 
          transacClient
        );
  
        await transacClient.transact<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
          .insert({ 
            uuid: conceptEntryEntity.uuid,
            termbase_uuid: transacClient.data.termbaseUUID,
            id: conceptEntryElement.$?.[types.TBXAttribute.id],
            order: Number(conceptEntryElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
          });  
          
        await this.consumeAuxInfo(
          conceptEntryElement, 
          conceptEntryEntity, 
          transacClient
        ); 
  
        await describe("Consume langSec elements", async () => {
          for (const langSecElement of conceptEntryElement[types.TbxElement.LangSec]) {
            const langSecEntity = new TbxEntity({ 
              ...tables.langSecTable, 
              uuid: uuid(),
            });

            await transacClient.transact<dbTypes.LangSec>(tables.langSecTable.fullTableName)
              .insert({ 
                uuid: langSecEntity.uuid,
                xml_lang: langSecElement.$?.[types.TBXAttribute.xmlLang],
                order: Number(langSecElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
                termbase_uuid: transacClient.data.termbaseUUID,
              });

            await this.consumeAuxInfo(
              langSecElement,
              langSecEntity, 
              transacClient
            );
            await this.helpers.saveChildTable(
              conceptEntryEntity, 
              langSecEntity, 
              transacClient.transact
            );
     
            await describe("Consume all termSec and term elements", async () => {
              for (const termSecElement of langSecElement[types.TbxElement.TermSec]) {
                const termElement = termSecElement[types.TbxElement.Term][0];
                const termEntity = new TbxEntity({ 
                  ...tables.termTable, 
                  uuid: uuid()
                });
                
                await this.saveId(
                  termSecElement, 
                  termEntity, 
                  transacClient
                );

                await this.saveId(
                  termElement, 
                  termEntity, 
                  transacClient
                );
      
                await transacClient.transact<dbTypes.Term>(tables.termTable.fullTableName)
                  .insert({ 
                    uuid: termEntity.uuid,
                    id: termElement.$?.[types.TBXAttribute.id],
                    term_sec_id: termSecElement.$?.[types.TBXAttribute.id],
                    termbase_uuid: transacClient.data.termbaseUUID,
                    value: this.getInnerValue(termElement),
                    order: Number(termSecElement.$?.[dbTypes.AuxiliaryAttribute.Order]),
                  }); 
            
                await this.helpers.saveChildTable(
                  langSecEntity, 
                  termEntity, 
                  transacClient.transact
                );
                await this.consumeAuxInfo(termSecElement, termEntity, transacClient);
      
                await describe("Consume all termNote elements", async () => {
                  for (const termNoteElement of termSecElement[types.TbxElement.TermNote]) {
                    await this.consumeTermNote(termNoteElement, termEntity, transacClient);
                  }
                }, isDefined(termSecElement[types.TbxElement.TermNote]));

                await describe("Consume all termNoteGrp elements", async () => {
                  for (const termNoteGrpElement of termSecElement[types.TbxElement.TermNoteGrp]) {
                    const termNoteElement = termNoteGrpElement[types.TbxElement.TermNote][0];
                    
                    await this.consumeTermNote(termNoteElement, termEntity, transacClient, termNoteGrpElement);
                  }
                }, isDefined(termSecElement[types.TbxElement.TermNoteGrp]));               
                
              }
            });
          }
        });

        ++conceptEntryNumber;

        globalStore.set(sessionId, {
          type: "import",
          conceptEntryCount,
          conceptEntryNumber,
          status: "in progress",
        }); 
      }
    });
  }

  private async consumeText(textElement: any, transacClient: TransacClient, consumptionConfig: ConsumptionConfig) {
    const textEntity = new TbxEntity({
      ...tables.textTable,
      uuid: uuid(),
    });

    await this.saveId(
      textElement, 
      textEntity, 
      transacClient,
    );

    await transacClient.transact<dbTypes.Text>(tables.textTable.fullTableName)
      .insert({ 
        uuid: textEntity.uuid,
        termbase_uuid: transacClient.data.termbaseUUID,
        id: textElement.$?.[types.TBXAttribute.id],
      });

    await describe(
      "Consume body element and children", 
      async () => {
        const bodyElement = textElement[types.TbxElement.Body][0];
        await this.consumeBody(bodyElement, transacClient, consumptionConfig);
      },
      isDefined(textElement[types.TbxElement.Body])
    );

    await describe(
      "Consume back element and children",
      async () => {
        const backElement = textElement[types.TbxElement.Back][0];
        await this.consumeBack(backElement, transacClient);
      },
      isDefined(textElement[types.TbxElement.Back])
    );
  }

  /*
  * Accepts a v3 TBX Basic File converted into JSON by the xml2js library
  */
  public async consume(consumptionConfig: ConsumptionConfig): Promise<void> {   
    const { 
      tbxObject,
      termbaseUUID,
      baseName, 
      conceptEntryCount,
      sessionId,
      globalStore
    } = consumptionConfig;

    await this.dbClient.transaction(async (transac) => {
      const tbxElement = tbxObject[types.TbxElement.Tbx];  

      await describe("Save tbx element and recurse through the TBX file", async () => {
        await transac<dbTypes.Base>(tables.baseTable.fullTableName)
          .insert({ 
            type: tbxElement.$?.[types.TBXAttribute.type],
            style: tbxElement.$?.[types.TBXAttribute.style],
            xml_lang: tbxElement.$?.[types.TBXAttribute.xmlLang],
            xmlns: tbxElement.$?.[types.TBXAttribute.xmlns],
            name: baseName,
            termbase_uuid: termbaseUUID,
          });
        
        const transacClient: TransacClient  =  {
          transact: transac,
          data: {
            termbaseUUID,
            refs: [],
          }
        };

        const tbxHeaderElement = tbxElement[types.TbxElement.TbxHeader][0];
        const textElement = tbxElement[types.TbxElement.Text][0];

        await describe(
          "Consume tbxHeader element and children", 
          async () => await this.consumeHeader(tbxHeaderElement, transacClient)
        );

        await describe(
          "Consume textElement and children", 
          async () =>  await this.consumeText(textElement, transacClient, consumptionConfig)
        );

        await describe("Save all id refs", async () => {
          for (const idRef of transacClient.data.refs) {
            const { entity, ref } = idRef;

            await transac(entity.fullTableName)
              .where("uuid", "=", entity.uuid)
              .update({ 
                target: ref,
              });
          } 
        });  
      });
    });

    globalStore.set(sessionId, {
      type: "import",
      conceptEntryCount,
      conceptEntryNumber: conceptEntryCount,
      status: "completed",
    });
  }
}

export default TBXConsumer;