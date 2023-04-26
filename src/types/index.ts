import { Knex } from "knex";

export enum AppEnv {
  Dev = "dev",
  Prod = "prod"
}

export type NullableString = string | null;
export type UUID = string;
export type DBClient = Knex.Transaction<any, any[]> | Knex<any, unknown[]>;
export type GenericObject<T = any> = {[key: string]: T};

export enum TbxElement {
  Tbx = "tbx",
  TbxHeader = "tbxHeader",
  EncodingDesc = "encodingDesc",
  P = "p",
  RevisionDesc = "revisionDec",
  Change = "change",
  FileDesc = "fileDesc",
  PublicationStmt = "publicationStmt",
  SourceDesc = "sourceDesc",
  TitleStmt = "titleStmt",
  Title = "title",
  Note = "note",
  Text = "text",
  Body = "body",
  ConceptEntry = "conceptEntry",
  LangSec = "langSec",
  TermSec = "termSec",
  Term = "term",
  TermNoteGrp = "termNoteGrp",
  TermNote = "termNote",
  Back = "back",
  RefObjectSec = "refObjectSec",
  RefObject = "refObject",
  ItemSet = "itemSet",
  ItemGrp = "itemGrp",
  Item = "item",
  Admin = "admin",
  AdminGrp = "adminGrp",
  AdminNote = "adminNote",
  Descrip = "descrip",
  DescripGrp = "descripGrp",
  DescripNote = "descripNote",
  Date = "date",
  Ref = "ref",
  Transac = "transac",
  TransacGrp = "transacGrp",
  TransacNote = "transacNote",
  Xref = "xref",
}

export type TbxAuxElement =
  Extract<
    TbxElement,
    TbxElement.Admin |
    TbxElement.AdminGrp |
    TbxElement.Descrip |
    TbxElement.DescripGrp |
    TbxElement.Transac |
    TbxElement.TransacGrp |
    TbxElement.Note |
    TbxElement.Ref |
    TbxElement.Xref |
    TbxElement.Date |
    TbxElement.AdminNote |
    TbxElement.DescripNote |
    TbxElement.TransacNote
  >;

export enum TbxElementTitle {
  Admin = "Admin",
  AdminGrp = "Admin Group",
  Descrip = "Descrip",
  DescripGrp = "Descrip Group",
  Transac = "Transac",
  TransacGrp = "Transac Group",
  Note = "Note",
  Ref = "Ref",
  Xref = "Xref",
  ConceptEntry = "Concept Entry",
  LangSec = "Language Section",
  Term = "Term",
  AdminNote = "Admin Note",
  DescripNote = "Descrip Note",
  TransacNote = "Transac Note",
  Date = "Date",
  TermNote = "Term Note",
  TermNoteGrp = "Term Note Group"
}

export interface Termbase {
  type: string;
  style: string;
  xmlns: string;
  name: string;
  termbaseUUID: UUID;
  xmlLang: string;
  enforceBasicDialect: boolean;
}

export interface PersonRefObjectPreview {
  uuid: UUID,
  id: string,
  source: "BaseTerm" | "External"
}

export interface PersonRefObject extends PersonRefObjectPreview {
  fullName: string,
  email: string,
  role: string,
  rawId: string,
} 

export interface ConceptEntryPreview {
  uuid: UUID;
  id: string;
  termbaseUUID: string;
}

export interface ConceptEntry extends ConceptEntryPreview {
  languageSections: LanguageSectionPreview[];
  auxElements: AuxElement[];
}

export interface LanguageSectionPreview {
  uuid: UUID;
  termbaseUUID: string;
  xmlLang: string;
  order: number;
}

export interface LanguageSection extends LanguageSectionPreview {
  conceptEntry: ConceptEntryPreview;
  auxElements: AuxElement[];
  terms: TermPreview[];
}

export interface AuxElement {
  order: number;
  id?: NullableString;
  termbaseUUID?: UUID;
  target?: NullableString;
  xmlLang?: NullableString;
  datatype?: NullableString;
  type?: NullableString;
  auxElements?: AuxElement[];
  grpId?: NullableString;
  uuid: UUID;
  value: string;
  elementType: TbxAuxElement,
}

export interface TermNotePreview {
  uuid: UUID;
  xmlLang: NullableString;
  target: NullableString;
  termbaseUUID: UUID;
  type: string;
  value: string;
  order: number;
  elementType: TbxElement.TermNote | TbxElement.TermNoteGrp
}

export interface TermNote extends TermNotePreview {
  id: NullableString;
  grpId: NullableString;
  datatype: NullableString;
  auxElements?: AuxElement[]
}

export interface TermPreview {
  uuid: UUID;
  termSecId: NullableString;
  id: NullableString;
  value: string;
  language: string;
  termbaseUUID: UUID;
  order: number;
}

export interface TermPartialView extends TermPreview {
  synonyms: TermPreview[];
  translations: TermPreview[];
  conceptId: string;
  customers: string[];
  partOfSpeech: string;
  approvalStatus: string; 
  subjectField: string;
}

export interface TermFullView extends TermPartialView {
  conceptEntry: ConceptEntryPreview;
  languageSection: LanguageSectionPreview;
  auxElements: AuxElement[];
  termNotes: TermNote[];
}

export enum SessionType {
  Export = "export",
  Import = "import"
}

export enum TBXAttribute {
  xmlLang = "xml:lang",
  type = "type",
  style = "style",
  xmlns = "xmlns",
  target = "target",
  id = "id",
  datatype = "datatype",
}