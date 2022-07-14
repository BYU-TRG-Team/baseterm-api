import { 
  UUID,
  TermPartialView,
  TermFullView,
  Termbase,
  ConceptEntry,
  LanguageSection,
  ConceptEntryPreview,
  TermPreview,
  LanguageSectionPreview,
  AuxElement,
  PersonRefObjectPreview,
  TermNotePreview
} from "../types";

import { FileServiceSession } from "./sessions";

export interface PaginationResponse {
  page: number;
  perPage: number;
  pageCount: number;
  totalCount: number;
}

export interface ValidationEndpointResponse {
  tbx: {[key:string]: any},
}

export interface ImportEndpointResponse {
  sessionId: UUID;
  termbaseUUID: UUID;
}

export interface ExportEndpointResponse {
  sessionId: UUID;
}

export interface PostTermbaseEndpointResponse {
  uuid: UUID,
}

export interface GetTermbasesEndpointResponse {
  termbases: Termbase[];
  pagination: PaginationResponse;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SessionSSEEndpointResponse extends FileServiceSession {}

export interface GetTermbaseEndpointResponse extends Termbase {
  metadata: {
    languages: string[],
    partsOfSpeech: string[],
    customers: string[],
    conceptIds: string[],
    approvalStatuses: string[],
    subjectFields: string[],
    personRefs: PersonRefObjectPreview[],
  }
}

export interface GetTermbaseTermsEndpointResponse {
  pagination: PaginationResponse;
  terms: TermPartialView[];
}

export interface PostEntryEndpointResponse {
  uuid: UUID;
}

export interface PostTermbaseEndpointResponse {
  uuid: UUID;
}

export interface PostLangSecEndpointResponse {
  uuid: UUID;
}

export interface PostTermEndpointResponse {
  uuid: UUID;
}

export interface PostTermNoteEndpointResponse {
  uuid: UUID;
}

export interface PostAuxElementEndpointResponse {
  uuid: UUID;
}

export interface PostPersonRefObjectEndpointResponse {
  uuid: UUID;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchTermNoteEndpointResponse extends TermNotePreview {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetTermEndpointResponse extends TermFullView {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchTermbaseEndpointResponse extends Termbase {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchTermEndpointResponse extends TermPreview {}; 

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetEntryEndpointResponse extends ConceptEntry {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetLanguageSectionEndpointResponse extends LanguageSection {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchEntryEndpointResponse extends ConceptEntryPreview {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchLangSecEndpointResponse extends LanguageSectionPreview {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatchAuxElementEndpointResponse extends AuxElement {};