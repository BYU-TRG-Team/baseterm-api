import {
  NullableString,
  UUID,
} from "@typings";

export enum Schema {
  termbaseSchema = "termbase",
  termbaseHeaderSchema = "termbase_header",
  termbaseTextSchema = "termbase_text",
  termbaseAuxSchema = "termbase_aux",
}

/*
* Top-Level 
*/

export interface Base {
  termbase_uuid: UUID;
  type: string;
  style: string;
  xml_lang: string;
  xmlns: string;
  name: string;
  enforce_basic_dialect: boolean;
}

export interface Id {
  termbase_uuid: UUID;
  id: string;
  entity_table: string;
  entity_uuid: NullableString;
  entity_type: NullableString;
}

/*
* Header Tables
*/

export interface Header {
  uuid: UUID;
  id: NullableString,
  termbase_uuid: UUID;
}

export interface HeaderNote {
  uuid: UUID;
  id: NullableString,
  termbase_uuid: UUID;
  xml_lang: NullableString;
  type: NullableString;
  value: string;
  order: number;
}

export interface EncodingDesc {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface EncodingDescHeaderNote {
  encoding_desc_uuid: UUID;
  header_note_uuid: UUID;
}

export interface RevisionDesc {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface FileDesc {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface RevisionDescChange {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  termbase_uuid: UUID;
  order: number;
}

export interface RevisionDescChangeHeaderNote {
  revision_desc_change_uuid: UUID;
  header_note_uuid: UUID;
}

export interface PublicationStmt {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface PublicationStmtHeaderNote {
  publication_stmt_uuid: UUID;
  header_note_uuid: UUID;
}

export interface SourceDesc {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface SourceDescHeaderNote {
  source_desc_uuid: UUID;
  header_note_uuid: UUID;
}

export interface Title {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  statement_xml_lang: NullableString;
  statement_id: NullableString;
  termbase_uuid: UUID;
  value: string;
}

export interface TitleHeaderNote {
  title_uuid: UUID;
  header_note_uuid: UUID;
}

/*
* Aux Tables
*/

export interface Admin {
  uuid: UUID;
  id: NullableString;
  target: NullableString;
  termbase_uuid: UUID;
  xml_lang: NullableString;
  datatype: NullableString;
  type: string;
  is_admin_grp: boolean;
  admin_grp_id: NullableString;
  value: string;
  order: number;
}

export interface Descrip {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  target: NullableString;
  termbase_uuid: UUID;
  datatype: NullableString;
  type: string;
  is_descrip_grp: boolean;
  descrip_grp_id: NullableString;
  value: string;
  order: number;
}

export interface Transac {
  uuid: UUID;
  xml_lang: NullableString;
  id: NullableString;
  target: NullableString;
  termbase_uuid: UUID;
  datatype: NullableString;
  type: string;
  is_transac_grp: boolean;
  transac_grp_id: NullableString;
  value: string;
  order: number;
}

export interface Xref {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
  target: string;
  type: string;
  value: string;
  order: number;
}

export interface Ref {
  uuid: UUID;
  id: NullableString;
  target: NullableString;
  termbase_uuid: UUID;
  xml_lang: NullableString;
  datatype: NullableString;
  type: string;
  value: string;
  order: number;
}

export interface Date {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
  value: string;
  order: number;
}

export interface AuxNote {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
  target: NullableString;
  xml_lang: NullableString;
  type: NullableString;
  is_generic_note: boolean;
  value: string;
  order: number;
}

export interface DescripAdmin {
  descrip_uuid: UUID;
  admin_uuid: UUID;
}

export interface DescripAuxNote {
  descrip_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface DescripRef {
  descrip_uuid: UUID;
  ref_uuid: UUID;
}

export interface DescripXref {
  descrip_uuid: UUID;
  xref_uuid: UUID;
}

export interface DescripTransac {
  descrip_uuid: UUID;
  transac_uuid: UUID;
}

export interface TransacDate {
  transac_uuid: UUID;
  date_uuid: UUID;
}

export interface TransacAuxNote {
  transac_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface TransacRef {
  transac_uuid: UUID;
  ref_uuid: UUID;
}

export interface TransacXref {
  transac_uuid: UUID;
  xref_uuid: UUID;
}

export interface AdminAuxNote {
  admin_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface AdminRef {
  admin_uuid: UUID;
  ref_uuid: UUID;
}

export interface AdminXref {
  admin_uuid: UUID;
  xref_uuid: UUID;
}

/*
* Text Tables
*/

export interface Text {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface Body {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface TermNote {
  uuid: UUID;
  xml_lang: NullableString;
  target: NullableString;
  id: NullableString;
  termbase_uuid: UUID;
  datatype: NullableString;
  type: string;
  is_term_note_grp: boolean;
  term_note_grp_id: NullableString;
  value: string;
  order: number;
}

export interface TermNoteAdmin {
  term_note_uuid: UUID;
  admin_uuid: UUID;
}

export interface TermNoteAuxNote {
  term_note_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface TermNoteRef {
  term_note_uuid: UUID;
  ref_uuid: UUID;
}

export interface TermNoteTransac {
  term_note_uuid: UUID;
  transac_uuid: UUID;
}

export interface TermNoteXref {
  term_note_uuid: UUID;
  xref_uuid: UUID;
}

export interface Term {
  uuid: UUID;
  id: NullableString;
  term_sec_id: NullableString;
  termbase_uuid: UUID;
  value: string;
  order: number;
}

export interface TermAdmin {
  term_uuid: UUID;
  admin_uuid: UUID;
}

export interface TermDescrip {
  term_uuid: UUID;
  descrip_uuid: UUID;
}

export interface TermAuxNote {
  term_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface TermRef {
  term_uuid: UUID;
  ref_uuid: UUID;
}

export interface TermTransac {
  term_uuid: UUID;
  transac_uuid: UUID;
}

export interface TermXref {
  term_uuid: UUID;
  xref_uuid: UUID;
}

export interface TermTermNote {
  term_uuid: UUID;
  term_note_uuid: UUID;
}

export interface LangSec {
  uuid: UUID;
  xml_lang: string;
  order: number;
  termbase_uuid: UUID;
}

export interface LangSecAdmin {
  lang_sec_uuid: UUID;
  admin_uuid: UUID;
}

export interface LangSecDescrip {
  lang_sec_uuid: UUID;
  descrip_uuid: UUID;
}

export interface LangSecAuxNote {
  lang_sec_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface LangSecRef {
  lang_sec_uuid: UUID;
  ref_uuid: UUID;
}

export interface LangSecTransac {
  lang_sec_uuid: UUID;
  transac_uuid: UUID;
}

export interface LangSecXref {
  lang_sec_uuid: UUID;
  xref_uuid: UUID;
}

export interface LangSecTerm {
  lang_sec_uuid: UUID;
  term_uuid: UUID;
}

export interface ConceptEntry {
  uuid: UUID;
  id: string;
  termbase_uuid: UUID;
  order: number;
}

export interface ConceptEntryAdmin {
  concept_entry_uuid: UUID;
  admin_uuid: UUID;
}

export interface ConceptEntryDescrip {
  concept_entry_uuid: UUID;
  descrip_uuid: UUID;
}

export interface ConceptEntryAuxNote {
  concept_entry_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface ConceptEntryRef {
  concept_entry_uuid: UUID;
  ref_uuid: UUID;
}

export interface ConceptEntryTransac {
  concept_entry_uuid: UUID;
  transac_uuid: UUID;
}

export interface ConceptEntryXref {
  concept_entry_uuid: UUID;
  xref_uuid: UUID;
}

export interface ConceptEntryLangSec {
  concept_entry_uuid: UUID;
  lang_sec_uuid: UUID;
}

export interface Back {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
}

export interface Item {
  uuid: UUID;
  id: NullableString;
  type: NullableString;
  item_grp_id: NullableString;
  is_item_grp: boolean;
  termbase_uuid: UUID;
  value: string;
  order: number;
}

export interface ItemAdmin {
  item_uuid: UUID;
  admin_uuid: UUID;
}

export interface ItemAuxNote {
  item_uuid: UUID;
  aux_note_uuid: UUID;
}

export interface ItemRef {
  item_uuid: UUID;
  ref_uuid: UUID;
}

export interface ItemTransac {
  item_uuid: UUID;
  transac_uuid: UUID;
}

export interface ItemXref {
  item_uuid: UUID;
  xref_uuid: UUID;
}

export interface ItemSet {
  uuid: UUID;
  id: NullableString;
  type: NullableString;
  termbase_uuid: UUID;
  order: number;
}

export interface ItemSetItem {
  item_set_uuid: UUID;
  item_uuid: UUID;
}

export interface RefObject {
  uuid: UUID;
  id: NullableString;
  termbase_uuid: UUID;
  order: number;
}

export interface RefObjectItemSet {
  ref_object_uuid: UUID;
  item_set_uuid: UUID;
}

export interface RefObjectItem {
  ref_object_uuid: UUID;
  item_uuid: UUID;
}

export interface RefObjectSec {
  uuid: UUID;
  type: string;
  id: NullableString;
  termbase_uuid: UUID;
  order: number;
}

export interface RefObjectSecRefObject {
  ref_object_sec_uuid: UUID;
  ref_object_uuid: UUID;
}

/*
* Misc
*/

export enum AuxiliaryAttribute {
  Order = "order",
}

export enum DBField {
  xmlLang = "xml_lang",
  type = "type",
  style = "style",
  xmlns = "xmlns",
  target = "target",
  id = "id",
  datatype = "datatype",
}

export const DBFields = [
  DBField.xmlLang,
  DBField.type,
  DBField.style,
  DBField.xmlns,
  DBField.target,
  DBField.id,
  DBField.datatype,
];


