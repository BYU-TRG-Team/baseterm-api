import { Knex } from "knex";
import  * as dbTypes from "../db/types";
import * as tables from "../db/tables";
import * as types from "../types";
import { isDefined, describe } from "../utils";
import { TbxTable, TbxEntity, TbxElement } from "../db/classes"; 
import { MinPriorityQueue } from "@datastructures-js/priority-queue";
import GlobalStore from "../services/store";

interface TransactionData {
  termbaseUUID: string;
}

interface TransacClient {
  data: TransactionData;
  transact: Knex.Transaction;
}

interface ConstructorConfig {
  globalStore: GlobalStore,
  termbaseUUID: string,
  conceptEntryCount: number,
  sessionId: string,
}

class TBXConstructor {
  private dbClient: Knex<any, unknown[]>;
 
  constructor(dbClient: Knex<any, unknown[]>) {
    this.dbClient = dbClient;
  }

  private async getChildTables<ChildType>(
    parentEntity: TbxEntity, 
    childTable: TbxTable, 
    transacClient: TransacClient, 
    whereFilters = {},
  ) {
    const associatedTable = `${parentEntity.fullTableName}_${childTable.tableName}`;
    return await transacClient.transact(associatedTable)
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
      .select<ChildType[]>("*");
  }

  private async constructHeaderNoteElements(
    parentElement: TbxElement, 
    parentEntity: TbxEntity, 
    headerNoteElementName: types.TbxElement,
    transacClient: TransacClient
  ) {

    const headerNoteRows = 
      await this.getChildTables<dbTypes.HeaderNote>(
        parentEntity, 
        tables.headerNoteTable, 
        transacClient
      );

    headerNoteRows.forEach((headerNoteRow) => {
      const headerNoteElement = new TbxElement(headerNoteElementName, headerNoteRow);
      parentElement.addChild(headerNoteElement);
    });
  }

  private async constructAuxNote(
    parentEntity: TbxEntity, 
    transacClient: TransacClient, 
    noteElementName: types.TbxElement
  ): Promise<TbxElement[]> {
    const auxNoteRows = 
      await this.getChildTables(
        parentEntity,
        tables.auxNoteTable,
        transacClient,
        {
          [`${tables.auxNoteTable.fullTableName}.is_generic_note`]: noteElementName === types.TbxElement.Note,
        }
      );

    return auxNoteRows.map(auxNote => new TbxElement(noteElementName, auxNote));
  }

  private async constructGroupAuxElement(
    elementNames: { 
      grpElement: types.TbxElement, 
      childElement: types.TbxElement,
    }, 
    elementTable: TbxTable, 
    parentEntity: TbxEntity, 
    transacClient: TransacClient,
    auxElements: types.TbxElement[],
  ): Promise<TbxElement[]> {
    const grpElements: TbxElement[] = [];
    const conditionalDbField = `is_${elementTable.tableName}_grp`;
    const grpIdField = `${elementTable.tableName}_grp_id`;
    const dbRows = 
      await this.getChildTables(
        parentEntity,
        elementTable,
        transacClient,
        {
          [`${elementTable.fullTableName}.${conditionalDbField}`]: true,
        }
      );

    await describe("Construct grp elements", async () => {
      for (const dbRow of dbRows) {
        const childElement = new TbxElement(
          elementNames.childElement,
          dbRow,
        );

        const grpElement = new TbxElement(
          elementNames.grpElement,
          {
            id: dbRow[grpIdField],
            order: dbRow[dbTypes.AuxiliaryAttribute.Order],
          }
        );

        const entity = new TbxEntity({
          ...elementTable,
          uuid: dbRow.uuid,
        });

        await describe("Construct child element", async () => {
          grpElement.addChild(childElement);
        });

        await describe("Construct aux elements", async () => {
          const grpAuxInfo = await this.constructAuxElements(entity, transacClient, auxElements);
          grpAuxInfo.forEach((aux) => grpElement.addChild(aux));
        });

        grpElements.push(grpElement);
      }
    });

    return grpElements;
  }

  private async constructGenericAuxElement(
    elementName: types.TbxElement, 
    elementTable: TbxTable, 
    parentEntity: TbxEntity, 
    transacClient: TransacClient, 
    whereFilters = {}
  ): Promise<TbxElement[]> {
    const auxElementRows = 
      await this.getChildTables(
        parentEntity,
        elementTable,
        transacClient,
        whereFilters
      );

    return auxElementRows.map((auxElementRow) => new TbxElement(elementName, auxElementRow));
  }

  private async constructAuxElements(
    parentEntity: TbxEntity, 
    transacClient: TransacClient, 
    elements: types.TbxElement[]
  ): Promise<TbxElement[]> {
    const auxElementsQueue = new MinPriorityQueue((element: TbxElement) => element.order);
    
    const pushGenericAuxElement = async (
      elementName: types.TbxElement, 
      elementTable: TbxTable, 
      whereFilters = {}
    ) => {
      const genericAuxElements = await this.constructGenericAuxElement(
        elementName, 
        elementTable, 
        parentEntity, 
        transacClient,
        whereFilters,
      );

      genericAuxElements.forEach((auxElement) => auxElementsQueue.enqueue(auxElement));
    };

    const pushGroupAuxElement = async (
      elementNames: { 
        grpElement: types.TbxElement, 
        childElement: types.TbxElement
      }, 
      elementTable: TbxTable, 
      childAuxElements: types.TbxElement[]
    ) => {
      const groupAuxElements = await this.constructGroupAuxElement(
        elementNames, 
        elementTable, 
        parentEntity, 
        transacClient, 
        childAuxElements
      );

      groupAuxElements.forEach((auxElement) => auxElementsQueue.enqueue(auxElement));
    };

    const pushAuxNoteElement = async (
      elementName: types.TbxElement
    ) => {
      const auxNoteElements = await this.constructAuxNote(
        parentEntity, 
        transacClient, 
        elementName
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
          {
            childElement: types.TbxElement.Admin,
            grpElement: types.TbxElement.AdminGrp
          },
          tables.adminTable,
          [
            types.TbxElement.AdminNote,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.Xref
          ]
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
          {
            childElement: types.TbxElement.Descrip,
            grpElement: types.TbxElement.DescripGrp
          },
          tables.descripTable,
          [
            types.TbxElement.Admin,
            types.TbxElement.AdminGrp,
            types.TbxElement.DescripNote,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.TransacGrp,
            types.TbxElement.Xref,
          ]
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
          {
            childElement: types.TbxElement.Transac,
            grpElement: types.TbxElement.TransacGrp,
          },
          tables.transacTable,
          [
            types.TbxElement.Date,
            types.TbxElement.Note,
            types.TbxElement.Ref,
            types.TbxElement.TransacNote,
            types.TbxElement.Xref,
          ]
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

    const auxElements: TbxElement[] = [];
    while (!auxElementsQueue.isEmpty()) {
      auxElements.push(
        auxElementsQueue.dequeue()
      );
    }

    return auxElements;
  }

  private async constructAuxInfo(
    parentEntity: TbxEntity, 
    transacClient: TransacClient
  ): Promise<TbxElement[]> {
    return await this.constructAuxElements(
      parentEntity,
      transacClient,
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

  private async constructNoteLinkInfo(
    parentEntity: TbxEntity, 
    transacClient: TransacClient
  ): Promise<TbxElement[]> {
    return await this.constructAuxElements(
      parentEntity,
      transacClient,
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

  private async constructGrpAndChildElements(
    elementNames: {
      childName: types.TbxElement,
      grpName: types.TbxElement,
    },
    parentEntity: TbxEntity, 
    table: TbxTable, 
    transacClient: TransacClient
  ): Promise<TbxElement[]> {
    const grpAndChildElements: TbxElement[] = [];
    const conditionalDbField = `is_${table.tableName}_grp`;
    const grpIdField = `${table.tableName}_grp_id`;
    const rows = await this.getChildTables(
      parentEntity,
      table,
      transacClient
    );

    for (const row of rows) {
      const childElement = new TbxElement(
        elementNames.childName,
        row,
      );

      if (row[conditionalDbField]) { 
        const entity = new TbxEntity({
          ...table,
          uuid: row.uuid,
        });
        
        await describe("Construct grp element", async () => {
          const grpElement = new TbxElement(
            elementNames.grpName,
            {
              id: row[grpIdField],
              order: row[dbTypes.AuxiliaryAttribute.Order],
            }
          );

          await describe("Construct child element", async () => {
            grpElement.addChild(childElement);
          });

          await describe("Construct NoteLinkInfo", async () => {
            const grpAuxInfo = await this.constructNoteLinkInfo(entity, transacClient);
            grpAuxInfo.forEach((aux) => grpElement.addChild(aux));
          });

          grpAndChildElements.push(grpElement);
        });                
        continue;  
      }

      grpAndChildElements.push(childElement);
    }

    return grpAndChildElements;
  }

  private async constructBackElement(transacClient: TransacClient): Promise<TbxElement | null> {
    const backRows = 
      await transacClient.transact<dbTypes.Back>(tables.backTable.fullTableName)
        .where({
          termbase_uuid: transacClient.data.termbaseUUID
        })
        .select("*");

    const backRow = backRows[0];
    
    if (!isDefined(backRow)) return null; // back element does not exist

    const backElement = new TbxElement(
      types.TbxElement.Back,
      backRow,
    );

    await describe("Construct refObjectSec elemnets", async () => {
      const refObjectSecRows = 
        await transacClient.transact<dbTypes.RefObjectSec>(tables.refObjectSecTable.fullTableName)
          .where({
            termbase_uuid: transacClient.data.termbaseUUID
          })
          .orderBy(
            "order",
            "asc",
          )
          .select("*");

      for (const refObjectSecRow of refObjectSecRows) {
        const refObjectSecElement = new TbxElement(
          types.TbxElement.RefObjectSec,
          refObjectSecRow,
        );

        const refObjectSecEntity = new TbxEntity({
          ...tables.refObjectSecTable,
          uuid: refObjectSecRow.uuid,
        });

        await describe("Construct refObject elements", async () => {
          const refObjectRows = await this.getChildTables<dbTypes.RefObject>(
            refObjectSecEntity, 
            tables.refObjectTable,
            transacClient
          );

          for (const refObjectRow of refObjectRows) {
            const refObjectElement = new TbxElement(
              types.TbxElement.RefObject,
              refObjectRow
            );

            const refObjectEntity = new TbxEntity({
              ...tables.refObjectTable,
              uuid: refObjectRow.uuid,
            });

            const refObjectChildrenQueue = new MinPriorityQueue((tbxElement: TbxElement) => tbxElement.order);
            
            await describe("Construct itemSet elements", async () => {
              const itemSetRows = await this.getChildTables<dbTypes.ItemSet>(
                refObjectEntity, 
                tables.itemSetTable,
                transacClient
              );

              for (const itemSetRow of itemSetRows) {
                const itemSetElement = new TbxElement(
                  types.TbxElement.ItemSet,
                  itemSetRow,
                );
                const itemSetEntity = new TbxEntity({
                  ...tables.itemSetTable,
                  uuid: itemSetRow.uuid,
                });

                await describe("Construct item and itemGrp elements", async () => {
                  const itemAndItemGrpElements = await this.constructGrpAndChildElements(
                    {
                      childName: types.TbxElement.Item,
                      grpName: types.TbxElement.ItemGrp,
                    },
                    itemSetEntity,
                    tables.itemTable,
                    transacClient
                  );
                  itemAndItemGrpElements.forEach((aux) => refObjectChildrenQueue.enqueue(aux));
                });

                refObjectElement.addChild(itemSetElement);
              }
            }); 
            
            await describe("Construct item and itemGrp elements", async () => {
              const itemAndItemGrpElements = await this.constructGrpAndChildElements(
                {
                  childName: types.TbxElement.Item,
                  grpName: types.TbxElement.ItemGrp,
                },
                refObjectEntity,
                tables.itemTable,
                transacClient
              );
              itemAndItemGrpElements.forEach((aux) => refObjectChildrenQueue.enqueue(aux));
            });

            while (!refObjectChildrenQueue.isEmpty()) {
              refObjectElement.addChild(
                refObjectChildrenQueue.dequeue()
              );
            }

            refObjectSecElement.addChild(refObjectElement);
          }
        });

        backElement.addChild(refObjectSecElement);
      }
    });

    return backElement;
  }

  private async constructBodyElement(
    transacClient: TransacClient, 
    constructorConfig: ConstructorConfig
  ): Promise<TbxElement | null>{
    const {
      globalStore,
      conceptEntryCount,
      sessionId
    } = constructorConfig;

    const bodyRows = 
      await transacClient.transact<dbTypes.Body>(tables.bodyTable.fullTableName)
        .where({
          termbase_uuid: transacClient.data.termbaseUUID
        })
        .select("*");

    const bodyRow = bodyRows[0];
    
    if (!isDefined(bodyRow)) return null; // body element does not exist

    const bodyElement = new TbxElement(
      types.TbxElement.Body, 
      bodyRow
    );
    
    await describe("Construct conceptEntry elements", async () => {
      const conceptEntryRows = 
        await transacClient.transact<dbTypes.ConceptEntry>(tables.conceptEntryTable.fullTableName)
          .where({
            termbase_uuid: transacClient.data.termbaseUUID
          })
          .orderBy(
            "order",
            "asc",
          )
          .select("*");

      let conceptEntryNumber = 0;

      for (const conceptEntryRow of conceptEntryRows) {
        const conceptEntryElement = new TbxElement(
          types.TbxElement.ConceptEntry, 
          conceptEntryRow
        );

        const conceptEntryEntity = new TbxEntity({
          ...tables.conceptEntryTable,
          uuid: conceptEntryRow.uuid,
        });

        await describe("Construct AuxInfo", async () => {
          const conceptEntryAuxInfo = await this.constructAuxInfo(conceptEntryEntity, transacClient);
          conceptEntryAuxInfo.forEach((aux) => conceptEntryElement.addChild(aux));
        });

        await describe("Construct langSec elements", async () => {
          const langSecRows = await this.getChildTables<dbTypes.LangSec>(
            conceptEntryEntity, 
            tables.langSecTable,
            transacClient
          );

          for (const langSecRow of langSecRows) {
            const langSecElement = new TbxElement(
              types.TbxElement.LangSec, 
              langSecRow
            );

            const langSecEntity = new TbxEntity({
              ...tables.langSecTable,
              uuid: langSecRow.uuid,
            });

            await describe("Construct AuxInfo", async () => {
              const langSecAuxInfo = await this.constructAuxInfo(langSecEntity, transacClient);
              langSecAuxInfo.forEach((aux) => langSecElement.addChild(aux));
            });

            await describe("Construct termSec elements", async () => {
              const termRows = await this.getChildTables<dbTypes.Term>(
                langSecEntity,
                tables.termTable,
                transacClient
              );

              for (const termRow of termRows) {
                const termElement = new TbxElement(
                  types.TbxElement.Term, 
                  termRow
                );

                const termSecElement = new TbxElement(
                  types.TbxElement.TermSec, 
                  {
                    id: termRow.term_sec_id,
                  }
                );

                const termEntity = new TbxEntity({
                  ...tables.termTable,
                  uuid: termRow.uuid,
                });

                await describe("Construct term element", async () => {
                  termSecElement.addChild(termElement);
                });

                await describe("Construct termNote and termNoteGrp elements", async () => {
                  const termNoteAndTermNoteGrpElements = await this.constructGrpAndChildElements(
                    {
                      childName: types.TbxElement.TermNote,
                      grpName: types.TbxElement.TermNoteGrp,
                    },
                    termEntity,
                    tables.termNoteTable,
                    transacClient
                  );

                  termNoteAndTermNoteGrpElements.forEach((aux) => termSecElement.addChild(aux));
                });

                await describe("Construct AuxInfo", async () => {
                  const termSecAuxInfo = await this.constructAuxInfo(termEntity, transacClient);
                  termSecAuxInfo.forEach((aux) => termSecElement.addChild(aux));
                });

                langSecElement.addChild(termSecElement);
              }
            });

            conceptEntryElement.addChild(langSecElement);
          }


        });

        bodyElement.addChild(conceptEntryElement);

        ++conceptEntryNumber;

        globalStore.set(sessionId, {
          type: "export",
          conceptEntryCount,
          conceptEntryNumber,
          status: "in progress",
        });
      }
    });

    return bodyElement;
  }

  private async constructTextElement(
    transacClient: TransacClient,
    constructionConfig: ConstructorConfig
  ): Promise<TbxElement> {
    const textRows = 
      await transacClient.transact<dbTypes.Text>(tables.textTable.fullTableName)
        .where({
          termbase_uuid: transacClient.data.termbaseUUID
        })
        .select("*");

    const textRow = textRows[0];
    
    const textElement = new TbxElement(
      types.TbxElement.Text, 
      textRow
    );

    const bodyElement = await this.constructBodyElement(
      transacClient, 
      constructionConfig
    );
    const backElement = await this.constructBackElement(transacClient);

    if(bodyElement !== null) textElement.addChild(bodyElement);
    if(backElement !== null) textElement.addChild(backElement);

    return textElement;
  }

  private async constructTbxHeaderElement(transacClient: TransacClient): Promise<TbxElement> {
    const headerRows = 
      await transacClient.transact<dbTypes.Header>(tables.headerTable.fullTableName)
        .where({
          termbase_uuid: transacClient.data.termbaseUUID
        })
        .select("*");

    const headerRow = headerRows[0];

    const tbxHeaderElement = new TbxElement(
      types.TbxElement.TbxHeader, 
      headerRow
    );

    await describe("Construct fileDesc element", async () => {
      const fileDescRows = 
        await transacClient.transact<dbTypes.FileDesc>(tables.fileDescTable.fullTableName)
          .where({
            termbase_uuid: transacClient.data.termbaseUUID
          })
          .select("*");

      const fileDescRow = fileDescRows[0];

      const fileDescElement = new TbxElement(
        types.TbxElement.FileDesc, 
        fileDescRow
      );

      await describe("Construct publicationStmt element", async () => {
        const publicationStmtRows = 
          await transacClient.transact<dbTypes.PublicationStmt>(tables.publicationStmtTable.fullTableName)
            .where({
              termbase_uuid: transacClient.data.termbaseUUID
            })
            .select("*");

        const publicationStmtRow = publicationStmtRows[0];
      
        if (!isDefined(publicationStmtRow)) return; // publicationStmt element does not exist
       
        const publicationStmtElement = new TbxElement(
          types.TbxElement.PublicationStmt, 
          publicationStmtRow
        );

        const publicationStmtEntity = new TbxEntity({
          ...tables.publicationStmtTable,
          uuid: publicationStmtRow.uuid,
        });

        await describe("Construct p elements", async () => {
          await this.constructHeaderNoteElements(
            publicationStmtElement,
            publicationStmtEntity,
            types.TbxElement.P,
            transacClient
          );
        });

        fileDescElement.addChild(publicationStmtElement);
      });

      await describe("Construct titleStmt element", async () => {
        const titleRows = 
          await transacClient.transact<dbTypes.Title>(tables.titleTable.fullTableName)
            .where({
              termbase_uuid: transacClient.data.termbaseUUID
            })
            .select("*");

        const titleRow = titleRows[0];
        
        if (!isDefined(titleRow)) return; // titleStmt element does not exist
        
        const titleElement = new TbxElement(
          types.TbxElement.Title,
          titleRow,
        );

        const titleStmtElement = new TbxElement(
          types.TbxElement.TitleStmt,
          {
            id: titleRow.statement_id,
          }
        );

        const titleEntity = new TbxEntity({
          ...tables.titleTable,
          uuid: titleRow.uuid,
        });

        await describe("Construct title element", async () => {
          titleStmtElement.addChild(titleElement);
        });

        await describe("Construct note elements", async () => {
          await this.constructHeaderNoteElements(
            titleStmtElement,
            titleEntity,
            types.TbxElement.Note,
            transacClient
          );
        });

        fileDescElement.addChild(titleStmtElement);
      });

      await describe("Construct sourceDesc element", async () => {
        const sourceDescRows = 
          await transacClient.transact<dbTypes.SourceDesc>(tables.sourceDescTable.fullTableName)
            .where({
              termbase_uuid: transacClient.data.termbaseUUID
            })
            .select("*");

        const sourceDescRow = sourceDescRows[0];
        
        const sourceDescElement = new TbxElement(
          types.TbxElement.SourceDesc, 
          sourceDescRow
        );
        
        const sourceDescEntity = new TbxEntity({
          ...tables.sourceDescTable,
          uuid: sourceDescRow.uuid,
        });

        await describe("Construct p elements", async () => {
          await this.constructHeaderNoteElements(
            sourceDescElement,
            sourceDescEntity,
            types.TbxElement.P,
            transacClient
          );
        });

        fileDescElement.addChild(sourceDescElement);
      });

      tbxHeaderElement.addChild(fileDescElement);

    });

    await describe("Construct encodingDesc element", async () => {
      const encodingDescRows = 
        await transacClient.transact<dbTypes.EncodingDesc>(tables.encodingDescTable.fullTableName)
          .where({
            termbase_uuid: transacClient.data.termbaseUUID
          })
          .select("*");

      const encodingDescRow = encodingDescRows[0];
      
      if (!isDefined(encodingDescRow)) return; // encodingDesc element does not exist

      const encodingDescElement = new TbxElement(
        types.TbxElement.EncodingDesc, 
        encodingDescRow
      );

      const encodingDescEntity = new TbxEntity({
        ...tables.encodingDescTable,
        uuid: encodingDescRow.uuid,
      });

      await describe("Construct p elements", async () => {
        await this.constructHeaderNoteElements(
          encodingDescElement,
          encodingDescEntity,
          types.TbxElement.P,
          transacClient
        );
      });

      tbxHeaderElement.addChild(encodingDescElement);
    });

    await describe("Construct revisionDesc element", async () => {
      const revisionDescRows = 
        await transacClient.transact<dbTypes.RevisionDesc>(tables.revisionDescTable.fullTableName)
          .where({
            termbase_uuid: transacClient.data.termbaseUUID
          })
          .select("*");

      const revisionDescRow = revisionDescRows[0];
      
      if (!isDefined(revisionDescRow)) return; // revisionDesc element does not exist

      const revisionDescElement = new TbxElement(
        types.TbxElement.RevisionDesc, 
        revisionDescRow
      );

      await describe("Construct change elements", async () => {
        const revisionDescChangeRows = 
          await transacClient.transact<dbTypes.RevisionDescChange>(tables.revisionDescChangeTable.fullTableName)
            .where({
              termbase_uuid: transacClient.data.termbaseUUID
            })
            .orderBy(
              "order",
              "asc",
            )
            .select("*");

        for (const revisionDescChangeRow of revisionDescChangeRows) {
          const changeElement = new TbxElement(
            types.TbxElement.Change,
            revisionDescChangeRow
          );

          const revisionDescChangeEntity = new TbxEntity({
            ...tables.revisionDescChangeTable,
            uuid: revisionDescChangeRow.uuid,
          });
  
          await describe("Construct p elements", async () => {
            await this.constructHeaderNoteElements(
              changeElement,
              revisionDescChangeEntity,
              types.TbxElement.P,
              transacClient
            );
          });

          revisionDescElement.addChild(changeElement);
        }
      });

      tbxHeaderElement.addChild(revisionDescElement);
    });

    return tbxHeaderElement;
  }

  public async export(constructorConfig: ConstructorConfig): Promise<void> {
    const {
      termbaseUUID,
      globalStore,
      conceptEntryCount,
      sessionId
    } = constructorConfig;
    
    let tbxElement: undefined | TbxElement;

    await this.dbClient.transaction(async (transact) => {
      await describe("Retrieve termbase using uuid", async () => {
        const baseRows = 
          await transact<dbTypes.Base>(tables.baseTable.fullTableName)
            .where({
              termbase_uuid: termbaseUUID
            })
            .select("*");

        const baseRow = baseRows[0];

        const transacClient: TransacClient  =  {
          transact,
          data: {
            termbaseUUID
          }
        };

        await describe("Construct tbx file", async () => {
          tbxElement = new TbxElement(
            types.TbxElement.Tbx, 
            baseRow,
            true,
          );
         
          tbxElement.addChild(
            await this.constructTbxHeaderElement(transacClient)
          );

          tbxElement.addChild(
            await this.constructTextElement(
              transacClient,
              constructorConfig
            )
          );
        });
      }); 
    });

    // Update session info
    globalStore.set(sessionId, {
      type: "export",
      conceptEntryCount,
      conceptEntryNumber: conceptEntryCount,
      status: "completed",
      data: tbxElement?.toString(),
    });
  }
}

export default TBXConstructor;