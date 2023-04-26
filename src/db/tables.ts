import { Schema } from "@db/types";
import { TbxTable } from "@db/classes";

export const { 
  termbaseSchema, 
  termbaseHeaderSchema, 
  termbaseAuxSchema, 
  termbaseTextSchema 
} = Schema;

/*
* Top Level
*/

export const baseTable = new TbxTable({ schema: termbaseSchema, tableName: "base"} );
export const idTable = new TbxTable({ schema: termbaseSchema, tableName: "id"});


/*
* Header
*/

export const headerTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "header"});
export const encodingDescTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "encoding_desc"});
export const revisionDescTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "revision_desc"});
export const fileDescTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "file_desc"});
export const revisionDescChangeTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "revision_desc_change"});
export const publicationStmtTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "publication_stmt"});
export const sourceDescTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "source_desc"});
export const titleTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "title"});
export const headerNoteTable = new TbxTable({ schema: termbaseHeaderSchema, tableName: "header_note"});

/*
/* Auxiliary 
*/
export const adminTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "admin"});
export const descripTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "descrip"});
export const transacTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "transac"});
export const xrefTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "xref"});
export const refTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "ref"});
export const dateTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "date"});
export const auxNoteTable = new TbxTable({ schema: termbaseAuxSchema, tableName: "aux_note"});

/*
* Text
*/

export const textTable = new TbxTable({ schema: termbaseTextSchema, tableName: "text"});
export const bodyTable = new TbxTable({ schema: termbaseTextSchema, tableName: "body"});
export const conceptEntryTable = new TbxTable({ schema: termbaseTextSchema, tableName: "concept_entry"});
export const langSecTable = new TbxTable({ schema: termbaseTextSchema, tableName: "lang_sec"});
export const termNoteTable = new TbxTable({ schema: termbaseTextSchema, tableName: "term_note"});
export const termTable = new TbxTable({ schema: termbaseTextSchema, tableName: "term"});
export const backTable = new TbxTable({ schema: termbaseTextSchema, tableName: "back"});
export const refObjectSecTable = new TbxTable({ schema: termbaseTextSchema, tableName: "ref_object_sec"});
export const refObjectTable = new TbxTable({ schema: termbaseTextSchema, tableName: "ref_object"});
export const itemSetTable = new TbxTable({ schema: termbaseTextSchema, tableName: "item_set"});
export const itemTable = new TbxTable({ schema: termbaseTextSchema, tableName: "item"});

/*
* Relational
*/

export const termAdminTable = new TbxTable({ schema: termbaseTextSchema, tableName: "term_admin"});
export const termTermNoteTable = new TbxTable({ schema: termbaseTextSchema, tableName: "term_term_note"});
export const langSecTermTable = new TbxTable({ schema: termbaseTextSchema, tableName: "lang_sec_term"});
export const conceptEntryLangSecTable = new TbxTable({ schema: termbaseTextSchema, tableName: "concept_entry_lang_sec"});
export const conceptEntryDescripTable = new TbxTable({ schema: termbaseTextSchema, tableName: "concept_entry_descrip"});