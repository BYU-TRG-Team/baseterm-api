import { Knex } from "knex";
import * as tables from "@db/tables";
import * as tbxAdminTypes from "@typings/data-categories";

class TermbaseService {
  private dbClient: Knex<any, unknown[]>;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
  ) {
    this.dbClient = dbClient;
  }

  public async getAllLanguages(
    termbaseUUID: string
  ): Promise<string[]> {
    return (
      await this.dbClient.select<{
      "xml_lang": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT DISTINCT xml_lang
                    FROM ${tables.langSecTable.fullTableName}
                      WHERE termbase_uuid=?
                ) as tb
              `,
            termbaseUUID
          )
        )
    ).map((obj) => obj.xml_lang);
  }

  public async getAllPartsOfSpeech(
    termbaseUUID: string
  ): Promise<string[]> {
    return (
      await this.dbClient.select<{
      "part_of_speech": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT DISTINCT value as part_of_speech
                    FROM ${tables.termNoteTable.fullTableName}
                      WHERE termbase_uuid=? 
                        AND type=? 
                ) as tb
              `,
            [
              termbaseUUID,
              tbxAdminTypes.TermNoteType.PartOfSpeech
            ],
          )
        )
    ).map((obj) => obj.part_of_speech); 
  }

  public async getAllCustomers(
    termbaseUUID: string
  ): Promise<string[]> {
    return (
      await this.dbClient.select<{
      "customer": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT DISTINCT admin.value as customer
                    FROM ${tables.adminTable.fullTableName} as admin
                      WHERE admin.termbase_uuid=? 
                        AND admin.type=?
                          AND admin.uuid IN (
                            SELECT term_admin.admin_uuid as uuid
                              FROM ${tables.termAdminTable.fullTableName} as term_admin
                          ) 
                ) as tb
              `,
            [
              termbaseUUID,
              tbxAdminTypes.TermAdminType.Customer
            ]
          )
        )
    ).map((obj) => obj.customer); 
  }

  public async getAllConceptIds(
    termbaseUUID: string
  ): Promise<string[]> {
    return (
      await this.dbClient.select<{
      "id": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT concept_entry.id as id
                    FROM ${tables.conceptEntryTable.fullTableName} as concept_entry
                      WHERE concept_entry.termbase_uuid=? 
                        ORDER BY concept_entry.id ASC
                ) as tb
              `,
            [
              termbaseUUID,
            ]
          )
        )
    ).map((obj) => obj.id); 
  }


  public async getAllSubjectFields(
    termbaseUUID: string,
  ) {
    return (
      await this.dbClient.select<{
      "subject_field": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT DISTINCT descrip.value as subject_field
                    FROM ${tables.descripTable.fullTableName} as descrip
                      WHERE descrip.termbase_uuid=? 
                        AND descrip.type=?
                          AND descrip.uuid IN (
                            SELECT concept_entry_descrip.descrip_uuid as uuid
                              FROM ${tables.conceptEntryDescripTable.fullTableName} as concept_entry_descrip
                          ) 
                ) as tb
              `,
            [
              termbaseUUID,
              tbxAdminTypes.ConceptEntryDescripType.SubjectField
            ],
          )
        )
    ).map((obj) => obj.subject_field); 
  }

  public async getAllApprovalStatuses(
    termbaseUUID: string,
  ) {
    return (
      await this.dbClient.select<{
      "approval_status": string;
    }[]>("*")
        .fromRaw(
          this.dbClient.raw(
            `(
                 SELECT DISTINCT value as approval_status
                    FROM ${tables.termNoteTable.fullTableName}
                      WHERE termbase_uuid=? 
                        AND type=?
                ) as tb
              `,
            [
              termbaseUUID,
              tbxAdminTypes.TermNoteType.ApprovalStatus
            ],
          )
        )
    ).map((obj) => obj.approval_status); 
  }
}

export default TermbaseService;