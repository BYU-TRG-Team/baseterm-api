import express, { 
  Express ,
  Response,
  Request,
  NextFunction,
} from "express";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import constructFileRoutes from "@routes/file-service";
import constructTermbaseRoutes from "@routes/termbase";
import constructTermRoutes from "@routes/term";
import constructEntryRoutes from "@routes/entry";
import constructlangSecRoutes from "@routes/lang-sec";
import constructTermNoteRoutes from "@routes/term-note";
import constructAuxElementRoutes from "@routes/aux-element";
import constructRefObjectRoutes from "@routes/ref-object";
import constructYupExtensions from "@extensions/yup";
import dependencyInjection from "@di";
import cors from "cors";
import errorMessages from "@messages/errors";

const constructServer = (app: Express) => {
  const routeBase = process.env.API_ROUTE_BASE || "";

  // Middleware
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.urlencoded({
    extended: true,
  }));
  app.use(fileUpload({
    createParentPath: true,
  }));
  app.use(cors({
    origin: "*",
  }));

  // Depedency Injection
  const di = dependencyInjection();

  // routes
  constructFileRoutes(app, di, routeBase);
  constructTermbaseRoutes(app, di, routeBase);
  constructTermRoutes(app, di, routeBase);
  constructEntryRoutes(app, di, routeBase);
  constructlangSecRoutes(app, di, routeBase);
  constructTermNoteRoutes(app, di, routeBase);
  constructAuxElementRoutes(app, di, routeBase);
  constructRefObjectRoutes(app, di, routeBase);

  // extensions
  constructYupExtensions(di);

  // Default error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    di.Logger.error(err);
    res.status(500).json({
      error: errorMessages.unexpectedError
    });
    next();
  });

  return async () => {
    await di.DBClient.destroy();
  };
};

export default constructServer;
