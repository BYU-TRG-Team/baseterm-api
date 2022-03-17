import { Express } from "express";
import { DIContainer } from "../di";
import { eventsHandler } from "../middleware";
import { 
  verifyToken, 
  checkVerification, 
  checkRole,
  Role
} from "@byu-trg/express-user-management";

export default (app: Express, di: DIContainer, routeBase: string) => {
  app.post(
    `${routeBase}/validate`,
    di.ValidationController.handle.bind(di.ValidationController),
  );

  app.post(
    `${routeBase}/import`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.ImportController.handle.bind(di.ImportController),
  );

  app.get(
    `${routeBase}/export/:termbaseUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.ExportController.handle.bind(di.ExportController),
  );

  app.get(
    `${routeBase}/session/:sessionId`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    eventsHandler,
    di.SessionController.handle.bind(di.SessionController),
  );
};