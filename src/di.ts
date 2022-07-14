// Services
import RNGValidatorService from "./services/RNGValidatorService";
import TermService from "./services/TermService";
import TermbaseService from "./services/TermbaseService";
import AuxElementService from "./services/AuxElementService";
import TermNoteService from "./services/TermNoteService";
import LangSecService from "./services/LangSecService";
import EntryService from "./services/EntryService";
import RefService from "./services/RefService";
import TransactionService from "./services/TransactionService";

// Support
import TBXValidator from "./support/TBXValidator";
import TBXConsumer from "./support/TBXConsumer";
import TBXConstructor from "./support/TBXConstructor";

// Controllers
import ValidationController from "./controllers/FileServices/ValidationController";
import ImportController from "./controllers/FileServices/ImportController";
import ExportController from "./controllers/FileServices/ExportController";
import PostTermbaseController from "./controllers/Termbase/PostTermbaseController";
import GetTermbasesController from "./controllers/Termbase/GetTermbasesController";
import SessionController from "./controllers/FileServices/SessionController";
import GetTermbaseController from "./controllers/Termbase/GetTermbaseController";
import DeleteTermbaseController from "./controllers/Termbase/DeleteTermbaseController";
import GetTermsController from "./controllers/Term/GetTermsController";
import PatchTermbaseController from "./controllers/Termbase/PatchTermbaseController";
import PostEntryController from "./controllers/Entry/PostEntryController";
import GetTermController from "./controllers/Term/GetTermController";
import GetEntryController from "./controllers/Entry/GetEntryController";
import GetLanguageSectionController from "./controllers/LangSec/GetLangSecController";
import PatchEntryController from "./controllers/Entry/PatchEntryController";
import PostLangSecController from "./controllers/LangSec/PostlangSecController";
import DeleteEntryController from "./controllers/Entry/DeleteEntryController";
import DeleteLangSecController from "./controllers/LangSec/DeleteLangSecController";
import DeleteTermController from "./controllers/Term/DeleteTermController";
import PostTermController from "./controllers/Term/PostTermController";
import PatchTermController from "./controllers/Term/PatchTermController";
import PatchLangSecController from "./controllers/LangSec/PatchLangSecController";
import PostTermNoteController from "./controllers/TermNote/PostTermNoteController";
import PatchTermNoteController from "./controllers/TermNote/PatchTermNoteController";
import PostAuxElementController from "./controllers/AuxElement/PostAuxElementController";
import PatchAuxElementController from "./controllers/AuxElement/PatchAuxElementController";
import DeleteAuxElementController from "./controllers/AuxElement/DeleteAuxElementController";
import DeleteTermNoteController from "./controllers/TermNote/DeleteTermNoteController";
import PostPersonRefObjectController from "./controllers/RefObject/PostPersonRefObjectController";

// Validator
import CoreValidator from "./validators/CoreValidator";

// Pub Sub
import EventEmitter from "events";

// DB
import dbClient from "./db";

// Global Store
import GlobalStore from "./services/GlobalStore";

// Helpers
import Helpers from "./helpers";

// Logger
import logger from "./logger";
import { Logger } from "winston";
import { DBClient } from "types";


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

  // Support
  const tbxValidator = new TBXValidator(rngValidator);
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
    transacService
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
  };
};

export default dependencyInjection;

