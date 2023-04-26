/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import * as tbxAdminTypes from "@typings/data-categories";
import * as types from "@typings";
import Helpers from "@helpers";
import { IPaginateParams } from "knex-paginate";
import { TbxEntity } from "@db/classes";
import { 
  UUID,
  TermPreview,
  TermPartialView,
  TermFullView,
  TermNote,
} from "@typings";
import AuxElementService from "@services/db/aux-element";
import TermNoteService from "@services/db/term-note";
import TransactionService from "@services/db/transaction";

export interface FilterOptions {
  termFilter: string,
  partOfSpeechFilter: string,
  customerFilter: string,
  conceptIdFilter: string,
  languageFilter: string;
  approvalStatusFilter: string;
  subjectField: string;
}

class TermService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
  private auxElementService: AuxElementService;
  private termNoteService: TermNoteService;
  private transactionService: TransactionService;

  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
    auxElementService: AuxElementService,
    termNoteService: TermNoteService,
    transactionService: TransactionService,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
    this.auxElementService = auxElementService;
    this.termNoteService = termNoteService;
    this.transactionService = transactionService;
  }

  private createFilters(
    filterOptions: FilterOptions,
    initialFilter = "",
    initialFilterDependencies: any[] = []
  ) {

    let filter = initialFilter;
    const filterDependencies = [...initialFilterDependencies];
    
    const injectFilter = (
      newFilter: string,
      dependencies: string[],
    ) => {
      filter += ` AND ${newFilter}`;
      filterDependencies.push(...dependencies);
    };

    if (filterOptions.customerFilter.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT term_admin.term_uuid as uuid FROM 
            ${tables.termAdminTable.fullTableName} as term_admin
              WHERE term_admin.admin_uuid IN (
                SELECT admin.uuid as uuid FROM 
                  ${tables.adminTable.fullTableName} as admin
                    WHERE admin.type = ?
                      AND admin.value = ?
              )
        )`,
        [
          tbxAdminTypes.TermAdminType.Customer,
          filterOptions.customerFilter
        ]
      );
    }

    if (filterOptions.conceptIdFilter.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT lang_sec_term.term_uuid as uuid FROM 
            ${tables.langSecTermTable.fullTableName} as lang_sec_term
              WHERE lang_sec_term.lang_sec_uuid IN (
                SELECT concept_entry_lang_sec.lang_sec_uuid as uuid FROM 
                  ${tables.conceptEntryLangSecTable.fullTableName} as concept_entry_lang_sec
                    WHERE concept_entry_lang_sec.concept_entry_uuid IN (
                      SELECT concept_entry.uuid as uuid FROM
                        ${tables.conceptEntryTable.fullTableName} as concept_entry
                          WHERE concept_entry.id = ?
                    )
                )
        )`,
        [
          filterOptions.conceptIdFilter
        ]
      );
    }

    if (filterOptions.subjectField.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT lang_sec_term.term_uuid as uuid FROM 
            ${tables.langSecTermTable.fullTableName} as lang_sec_term
              WHERE lang_sec_term.lang_sec_uuid IN (
                SELECT concept_entry_lang_sec.lang_sec_uuid as uuid FROM 
                  ${tables.conceptEntryLangSecTable.fullTableName} as concept_entry_lang_sec
                    WHERE concept_entry_lang_sec.concept_entry_uuid IN (
                      SELECT concept_entry_descrip.concept_entry_uuid as uuid FROM
                        ${tables.conceptEntryDescripTable.fullTableName} as concept_entry_descrip
                          WHERE concept_entry_descrip.descrip_uuid IN (
                            SELECT descrip.uuid as uuid FROM
                              ${tables.descripTable.fullTableName} as descrip
                                WHERE descrip.type = ?
                                  AND descrip.value = ?
                          )
                    )
                )
        )`,
        [
          tbxAdminTypes.ConceptEntryDescripType.SubjectField,
          filterOptions.subjectField
        ]
      );
    }

    if (filterOptions.partOfSpeechFilter.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT term_term_note.term_uuid as uuid FROM 
            ${tables.termTermNoteTable.fullTableName} as term_term_note
              WHERE term_term_note.term_note_uuid IN (
                SELECT term_note.uuid as uuid FROM 
                  ${tables.termNoteTable.fullTableName} as term_note
                    WHERE term_note.type = ? 
                      AND term_note.value = ?
              )
        )`,
        [
          tbxAdminTypes.TermNoteType.PartOfSpeech,
          filterOptions.partOfSpeechFilter
        ]
      );
    }

    if (filterOptions.languageFilter.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT lang_sec_term.term_uuid as uuid FROM 
            ${tables.langSecTermTable.fullTableName} as lang_sec_term
              WHERE lang_sec_term.lang_sec_uuid IN (
                SELECT lang_sec.uuid as uuid FROM 
                  ${tables.langSecTable.fullTableName} as lang_sec
                    WHERE lang_sec.xml_lang = ?
              )
        )`,
        [
          filterOptions.languageFilter
        ]
      );
    }

    if (filterOptions.approvalStatusFilter.length > 0) {
      injectFilter(
        `uuid IN (
          SELECT term_term_note.term_uuid as uuid FROM 
            ${tables.termTermNoteTable.fullTableName} as term_term_note
              WHERE term_term_note.term_note_uuid IN (
                SELECT term_note.uuid as uuid FROM 
                  ${tables.termNoteTable.fullTableName} as term_note
                    WHERE term_note.type = ? 
                      AND term_note.value = ?
              )
        )`,
        [
          tbxAdminTypes.TermNoteType.ApprovalStatus,
          filterOptions.approvalStatusFilter,
        ]
      );
    }

    if (filterOptions.termFilter.length > 0) {
      injectFilter(
        "LOWER(value) ILIKE ?",
        [
          `%${filterOptions.termFilter.trim().toLocaleLowerCase()}%`
        ]
      );
    }

    return {
      filter,
      filterDependencies
    };
  }
  

  public async getAllTerms(
    termbaseUUID: string,
    paginationOptions: IPaginateParams,
    filterOptions: FilterOptions,
  ) {

    const {
      filter,
      filterDependencies
    } = this.createFilters(
      filterOptions,
      "termbase_uuid=?",
      [
        termbaseUUID,
      ]
    );

    const termRows = await this.dbClient<dbTypes.Term>(tables.termTable.fullTableName)
      .whereRaw(
        filter,
        filterDependencies
      )
      .select("*")
      .fromRaw<dbTypes.Term>(
        this.dbClient.raw(
          `(
           SELECT *
              FROM ${tables.termTable.fullTableName}
              ORDER BY LOWER(value)
          ) as tb
        `,
        )
      )
      .paginate(paginationOptions);

    return termRows.data;
  }

  public async getSynonymsAndTranslations(
    termEntity: TbxEntity,
    langSecEntity: TbxEntity,
    conceptEntryEntity: TbxEntity,
  ) {
    const synonyms = 
      (
        await this.helpers.getChildTables<dbTypes.Term>(
          langSecEntity,
          tables.termTable,
          this.dbClient,
        )
      ).filter((term) => term.uuid !== termEntity.uuid);
    
    const synonymUUIDs: UUID[] = 
      synonyms
        .map((term) => term.uuid);   

    const translations = 
      (
        await this.dbClient.select<dbTypes.Term[]>("*")
          .fromRaw(
            this.dbClient.raw(
              `(
                SELECT * FROM 
                  ${tables.termTable.fullTableName} as t
                    WHERE t.uuid IN
                      (
                        SELECT term_uuid as uuid FROM
                          ${langSecEntity.fullTableName}_term as ls
                            WHERE ls.lang_sec_uuid IN
                              (
                                SELECT lang_sec_uuid FROM
                                  ${conceptEntryEntity.fullTableName}_lang_sec as ce
                                    WHERE ce.concept_entry_uuid=?
                              )
                      )
                ) as tb
              `,
              conceptEntryEntity.uuid
            )
          )
      )
        .filter((term) => (
          !synonymUUIDs.includes(term.uuid) &&
          term.uuid !== termEntity.uuid
        ));
                      

    return {
      translations: 
        await Promise.all(translations.map(term => this.retrieveTerm(term, "PREVIEW"))),
      synonyms:
        await Promise.all(synonyms.map(term => this.retrieveTerm(term, "PREVIEW"))),
    };
  }

  public async getTotalTermCount(
    termbaseUUID: string,
    filterOptions: FilterOptions
  ): Promise<number> {

    const {
      filter,
      filterDependencies
    } = this.createFilters(
      filterOptions,
      "termbase_uuid=?",
      [
        termbaseUUID,
      ]
    );

    return Number(
      (
        await this.dbClient.select("*")
          .fromRaw(
            this.dbClient.raw(
              `(
                 SELECT COUNT(*) as count
                    FROM ${tables.termTable.fullTableName}
                      WHERE ${filter}
                ) as tb
              `,
              filterDependencies
            )
          )
      )[0].count
    ); 
  }

  public async retrieveTerm(
    termRow: dbTypes.Term,
    termType: "PREVIEW" | "PARTIAL" | "FULL",
  ): Promise<TermPreview | TermPartialView | TermFullView> {
    
    // Helpers
    const mapToValues = <ListType extends { value: string}>(list: ListType[]) => {
      return list.map((row) => row.value);
    };

    const termEntity = new TbxEntity({
      ...tables.termTable,
      uuid: termRow.uuid,
    });

    const langSecRow = 
      await this.helpers.getParentTable<dbTypes.LangSec>(
        termEntity,
        tables.langSecTable,
        this.dbClient
      );

    if (langSecRow === null) {
      throw new Error(`No langSec exists for term with uuid: ${termRow.uuid}`);
    } 

    const langSecEntity = new TbxEntity({
      ...tables.langSecTable,
      uuid: langSecRow.uuid,
    });

    const termPreview: TermPreview = {
      uuid: termEntity.uuid,
      id: termRow.id || "",
      value: termRow.value,
      termSecId: termRow.term_sec_id,
      termbaseUUID: termRow.termbase_uuid,
      order: termRow.order,
      language: langSecRow.xml_lang,
    };
    
    if (termType === "PREVIEW") return termPreview;
    
    const conceptEntryRow = 
      await this.helpers.getParentTable<dbTypes.ConceptEntry>(
        langSecEntity,
        tables.conceptEntryTable,
        this.dbClient
      );

    if (conceptEntryRow === null) {
      throw new Error(`No conceptEntry exists for term with uuid: ${termRow.uuid}`);
    } 

    const conceptEntryEntity = new TbxEntity({
      ...tables.conceptEntryTable,
      uuid: conceptEntryRow.uuid,
    });

    const { 
      synonyms,
      translations
    } = await this.getSynonymsAndTranslations(
      termEntity,
      langSecEntity,
      conceptEntryEntity,
    );


    const conceptId = conceptEntryRow.id;

    const partOfSpeech = 
      this.helpers.pluckOneValue<dbTypes.TermNote>(
        await this.helpers.getChildTables<dbTypes.TermNote>(
          termEntity,
          tables.termNoteTable,
          this.dbClient,
          {
            type: tbxAdminTypes.TermNoteType.PartOfSpeech
          }
        ),
      );

    const approvalStatus = 
      this.helpers.pluckOneValue<dbTypes.TermNote>(
        await this.helpers.getChildTables<dbTypes.TermNote>(
          termEntity,
          tables.termNoteTable,
          this.dbClient,
          {
            type: tbxAdminTypes.TermNoteType.ApprovalStatus
          }
        )
      );

    const customers = 
      mapToValues<dbTypes.Admin>(
        await this.helpers.getChildTables<dbTypes.Admin>(
          termEntity,
          tables.adminTable,
          this.dbClient,
          {
            type: tbxAdminTypes.TermAdminType.Customer
          }
        )
      );
            
    const subjectField = 
      this.helpers.pluckOneValue<dbTypes.Descrip>(
        await this.helpers.getChildTables<dbTypes.Descrip>(
          conceptEntryEntity,
          tables.descripTable,
          this.dbClient,
          {
            type: tbxAdminTypes.ConceptEntryDescripType.SubjectField
          }
        )
      );
          

    const partialTerm: TermPartialView = {
      ...termPreview,
      synonyms,
      conceptId,
      translations,
      customers,
      partOfSpeech,
      approvalStatus,
      subjectField,
    };

    if (termType === "PARTIAL") {
      return partialTerm;
    }

    const termNoteRows = await this.helpers.getChildTables<dbTypes.TermNote>(
      termEntity,
      tables.termNoteTable,
      this.dbClient
    );

    const termNotes: TermNote[] = [];

    for (const termNote of termNoteRows) {
      const termNoteEntity = new TbxEntity({
        ...tables.termNoteTable,
        uuid: termNote.uuid,
      });

      termNotes.push(
        {
          uuid: termNote.uuid,
          xmlLang: termNote.xml_lang,
          target: termNote.target,
          id: termNote.id,
          grpId: termNote.term_note_grp_id,
          elementType: 
            termNote.is_term_note_grp ?
              types.TbxElement.TermNoteGrp :
              types.TbxElement.TermNote,
          termbaseUUID: termNote.termbase_uuid,
          datatype: termNote.datatype,
          type: termNote.type,
          value: termNote.value,
          order: termNote.order,
          ...(
            termNote.is_term_note_grp &&
              {
                auxElements: await this.auxElementService.retrieveAuxNoteLinkInfo(
                  termNoteEntity,
                )
              } 
          )
        }
      );
    }
    
    const fullTerm: TermFullView = {
      ...partialTerm,
      termSecId: termRow.term_sec_id,
      conceptEntry: {
        uuid: conceptEntryRow.uuid,
        termbaseUUID: conceptEntryRow.termbase_uuid,
        id: conceptEntryRow.id,
      },
      languageSection: {
        uuid: langSecRow.uuid,
        termbaseUUID: langSecRow.termbase_uuid,
        xmlLang: langSecRow.xml_lang,
        order: langSecRow.order,
      },
      auxElements: await this.auxElementService.retrieveAuxInfo(
        termEntity
      ),
      termNotes,
    };

    return fullTerm;
  }

  public async deleteTerm(
    termUUID: UUID,
    dbClient: types.DBClient = this.dbClient
  ) {
    const termEntity = new TbxEntity({
      ...tables.termTable,
      uuid: termUUID,
    });

    await this.helpers.deleteChildTables(
      termEntity,
      tables.termNoteTable,
      dbClient,
      {
        onDelete: async (childRow) => {
          await this.termNoteService.deleteTermNote(
            childRow.uuid,
            dbClient
          );
        }
      }
    );

    await this.auxElementService.deleteAuxInfo(
      termEntity,
      dbClient
    );

    await dbClient<dbTypes.Term>(tables.termTable.fullTableName)
      .where({
        uuid: termEntity.uuid
      })
      .delete();
  }

  public async constructTerm(
    value: string,
    termEntity: TbxEntity,
    langSecEntity: TbxEntity,
    termbaseUUID: UUID,
    userId: UUID,
    dbClient: types.DBClient = this.dbClient
  ): Promise<UUID> {

    await dbClient<dbTypes.Term>(tables.termTable.fullTableName)
      .insert({
        uuid: termEntity.uuid,
        value,
        termbase_uuid: termbaseUUID,
        order: await this.helpers.computeNestedNextOrder(
          langSecEntity,
          tables.termTable,
          dbClient
        )
      });

    await this.helpers.saveChildTable(
      langSecEntity,
      termEntity,
      dbClient,
    );

    // Construct origination transaction
    await this.transactionService.constructTransaction(
      termbaseUUID,
      termEntity,
      {
        transactionType: "origination",
        userId: userId,
      },
      dbClient
    );

    return termEntity.uuid;
  }
}

export default TermService;