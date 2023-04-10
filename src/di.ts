// Services
import RNGValidatorService from "./services/rng-validator";
import TermService from "./services/db/term";
import TermbaseService from "./services/db/termbase";
import AuxElementService from "./services/db/aux-element";
import TermNoteService from "./services/db/term-note";
import LangSecService from "./services/db/lang-sec";
import EntryService from "./services/db/entry";
import RefService from "./services/db/ref";
import TransactionService from "./services/db/transaction";
import LanguageCodeService from "@byu-trg/language-code-service";

// Support
import TBXValidator from "./support/tbx-validator";
import TBXConsumer from "./support/tbx-consumer";
import TBXConstructor from "./support/tbx-constructor";

// Controllers
import ValidationController from "./controllers/file-service/validation";
import ImportController from "./controllers/file-service/import";
import ExportController from "./controllers/file-service/export";
import PostTermbaseController from "./controllers/termbase/post";
import GetTermbasesController from "./controllers/termbase/get-all";
import SessionController from "./controllers/file-service/session";
import GetTermbaseController from "./controllers/termbase/get";
import DeleteTermbaseController from "./controllers/termbase/delete";
import GetTermsController from "./controllers/term/get-all";
import PatchTermbaseController from "./controllers/termbase/patch";
import PostEntryController from "./controllers/entry/post";
import GetTermController from "./controllers/term/get";
import GetEntryController from "./controllers/entry/get";
import GetLanguageSectionController from "./controllers/lang-sec/get";
import PatchEntryController from "./controllers/entry/patch";
import PostLangSecController from "./controllers/lang-sec/post";
import DeleteEntryController from "./controllers/entry/delete";
import DeleteLangSecController from "./controllers/lang-sec/delete";
import DeleteTermController from "./controllers/term/delete";
import PostTermController from "./controllers/term/post";
import PatchTermController from "./controllers/term/patch";
import PatchLangSecController from "./controllers/lang-sec/patch";
import PostTermNoteController from "./controllers/term-note/post";
import PatchTermNoteController from "./controllers/term-note/patch";
import PostAuxElementController from "./controllers/aux-element/post";
import PatchAuxElementController from "./controllers/aux-element/patch";
import DeleteAuxElementController from "./controllers/aux-element/delete";
import DeleteTermNoteController from "./controllers/term-note/delete";
import PostPersonRefObjectController from "./controllers/ref-object/post";

// Validator
import CoreValidator from "./validators/core-validator";

// Pub Sub
import EventEmitter from "events";

// DB
import dbClient from "./db";

// Global Store
import GlobalStore from "./services/store";

// Helpers
import Helpers from "./helpers";

// Logger
import logger from "./logger";
import { Logger } from "winston";
import { DBClient } from "./types";


export type DIContainer = {
  DBClient: DBClient,
  ValidationController: ValidationController;
  ImportController: ImportController;
  ExportController: ExportController;
  PostTermbaseController: PostTermbaseController;
  GetTermbasesController: GetTermbasesController;
  SessionController: SessionController;
  GetTermbaseController: GetTermbaseController;
  GetTermsController: GetTermsController;
  DeleteTermbaseController: DeleteTermbaseController;
  PatchTermbaseController: PatchTermbaseController;
  PostEntryController: PostEntryController;
  GetTermController: GetTermController;
  GetEntryController: GetEntryController;
  GetLanguageSectionController: GetLanguageSectionController,
  PatchEntryController: PatchEntryController,
  PostLangSecController: PostLangSecController,
  DeleteEntryController: DeleteEntryController,
  DeleteLangSecController: DeleteLangSecController,
  DeleteTermController: DeleteTermController,
  PostTermController: PostTermController,
  PatchTermController: PatchTermController,
  PatchLangSecController: PatchLangSecController,
  PostTermNoteController: PostTermNoteController,
  PatchTermNoteController: PatchTermNoteController,
  PostAuxElementController: PostAuxElementController,
  PatchAuxElementController: PatchAuxElementController,
  DeleteAuxElementController: DeleteAuxElementController,
  DeleteTermNoteController: DeleteTermNoteController,
  PostPersonRefObjectController: PostPersonRefObjectController,
  Logger: Logger,
  LanguageCodeService: LanguageCodeService
}

const dependencyInjection = (): DIContainer => {
  // Pub Sub
  const eventEmitter = new EventEmitter();

  // Global Store
  const globalStore = new GlobalStore(eventEmitter);  

  // Helpers
  const helpers = new Helpers();

  // Services
  const rngValidator = new RNGValidatorService(CoreValidator);
  const termbaseService  =new TermbaseService(
    dbClient
  );
  const refService = new RefService(
    dbClient,
    helpers
  );
  const transacService = new TransactionService(
    dbClient,
    helpers,
    refService
  );
  const auxElementService = new AuxElementService(
    dbClient,
    helpers
  );
  const termNoteService = new TermNoteService(
    dbClient,
    auxElementService
  );
  const termService = new TermService(
    dbClient,
    helpers,
    auxElementService,
    termNoteService,
    transacService
  );
  const langSecService = new LangSecService(
    dbClient,
    helpers,
    auxElementService,
    termService,
    transacService,
  );
  const entryService = new EntryService(
    dbClient,
    helpers,
    auxElementService,
    langSecService,
    transacService
  );
  const languageCodeService = new LanguageCodeService()

  // Support
  const tbxValidator = new TBXValidator(
    rngValidator,
    languageCodeService
  );
  const tbxConsumer = new TBXConsumer(
    dbClient,
    helpers,
  );
  const tbxConstructor = new TBXConstructor(dbClient);

  // Controllers
  const validationController = new ValidationController(tbxValidator);
  const importController = new ImportController(
    tbxValidator, 
    tbxConsumer, 
    globalStore, 
    logger
  );
  const exportController = new ExportController(
    tbxConstructor,
    globalStore,
    dbClient,
    helpers,
    logger
  );
  const postTermbaseController = new PostTermbaseController(
    dbClient,
    helpers,
    logger
  );
  const getTermbasesController = new GetTermbasesController(
    dbClient,
    logger,
  );
  const sessionController = new SessionController(
    globalStore, 
    eventEmitter,
    logger,
  );
  const getTermbaseController = new GetTermbaseController(
    dbClient,
    helpers,
    termbaseService,
    logger,
    refService
  );
  const getTermsController = new GetTermsController(
    dbClient,
    helpers,
    termService,
    logger
  );
  const deleteTermbaseController = new DeleteTermbaseController(
    dbClient,
    logger,
  );
  const patchTermbaseController = new PatchTermbaseController(
    dbClient,
    helpers,
    logger,
  );
  const postEntryController = new PostEntryController(
    dbClient,
    helpers,
    logger,
    entryService
  );
  const getTermController = new GetTermController(
    dbClient,
    helpers,
    termService,
    logger,
  );
  const getEntryController = new GetEntryController(
    dbClient,
    helpers,
    auxElementService,
    logger,
  );
  const getLanguageSectionController = new GetLanguageSectionController(
    dbClient,
    helpers,
    auxElementService,
    logger
  );
  const patchEntryController = new PatchEntryController(
    dbClient,
    helpers,
    logger,
    transacService
  );
  const postLangSecController = new PostLangSecController(
    dbClient,
    logger,
    langSecService
  );
  const deleteEntryController = new DeleteEntryController(
    dbClient,
    entryService,
    logger,
  );
  const deleteLangSecController = new DeleteLangSecController(
    dbClient,
    logger,
    langSecService,
    helpers,
  );
  const deleteTermController = new DeleteTermController(
    dbClient,
    logger,
    termService,
    helpers
  );
  const postTermController = new PostTermController(
    dbClient,
    logger,
    termService
  );
  const patchTermController = new PatchTermController(
    dbClient,
    helpers,
    logger,
    termService,
    transacService,
  );
  const patchLangSecController = new PatchLangSecController(
    dbClient,
    helpers,
    logger,
    transacService
  );
  const postTermNoteController = new PostTermNoteController(
    dbClient,
    helpers,
    logger,
  );
  const patchTermNoteController = new PatchTermNoteController(
    dbClient,
    helpers,
    logger,
  );
  const postAuxElementController = new PostAuxElementController(
    dbClient,
    helpers,
    logger,
  );
  const patchAuxElementController = new PatchAuxElementController(
    dbClient,
    helpers,
    auxElementService,
    logger,
  );  
  const deleteAuxElementController = new DeleteAuxElementController(
    dbClient,
    helpers,
    logger,
    auxElementService,
  );
  const deleteTermNoteController = new DeleteTermNoteController(
    dbClient,
    logger,
    termNoteService
  );
  const postPersonRefObjectController = new PostPersonRefObjectController(
    dbClient,
    logger,
    refService
  );
  
  return {
    DBClient: dbClient,
    ValidationController: validationController,
    ImportController: importController,
    ExportController: exportController,
    PostTermbaseController: postTermbaseController,
    GetTermbasesController: getTermbasesController,
    SessionController: sessionController,
    GetTermbaseController: getTermbaseController,
    GetTermsController: getTermsController,
    DeleteTermbaseController: deleteTermbaseController,
    PatchTermbaseController: patchTermbaseController,
    PostEntryController: postEntryController,
    GetTermController: getTermController,
    GetEntryController: getEntryController,
    GetLanguageSectionController: getLanguageSectionController,
    PatchEntryController: patchEntryController,
    PostLangSecController: postLangSecController,
    DeleteEntryController: deleteEntryController,
    DeleteLangSecController: deleteLangSecController,
    DeleteTermController: deleteTermController,
    PostTermController: postTermController,
    PatchTermController: patchTermController,
    PatchLangSecController: patchLangSecController,
    PostTermNoteController: postTermNoteController,
    PatchTermNoteController: patchTermNoteController,
    PostAuxElementController: postAuxElementController,
    PatchAuxElementController: patchAuxElementController,
    DeleteAuxElementController: deleteAuxElementController,
    DeleteTermNoteController: deleteTermNoteController,
    PostPersonRefObjectController: postPersonRefObjectController,
    Logger: logger,
    LanguageCodeService: languageCodeService
  };
};

export default dependencyInjection;

