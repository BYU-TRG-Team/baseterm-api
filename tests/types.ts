import { 
  AuxElement, 
  ConceptEntryPreview, 
  LanguageSectionPreview, 
  TermFullView, 
  TermNote, 
  UUID 
} from "@typings";

export interface TestAPIClientResponse<T> {
    body: T,
    status: number,
}

export interface TestData {
    conceptEntry: ConceptEntryPreview,
    langSec: LanguageSectionPreview,
    term: TermFullView,
    auxElement: AuxElement,
    termNote: TermNote,
    termbaseUUID: UUID,
}