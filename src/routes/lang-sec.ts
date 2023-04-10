import { Express } from "express";
import { DIContainer } from "../di";
import { 
  verifyToken, 
  checkVerification, 
  checkRole,
  Role
} from "@byu-trg/express-user-management";

export default (app: Express, di: DIContainer, routeBase: string) => {
  app.get(
    `${routeBase}/termbase/:termbaseUUID/langSec/:langSecUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User,
    ]),
    di.GetLanguageSectionController.handle.bind(di.GetLanguageSectionController),
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID/langSec/:langSecUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.DeleteLangSecController.handle.bind(di.DeleteLangSecController),
  );

  app.post(
    `${routeBase}/termbase/:termbaseUUID/langSec`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostLangSecController.handle.bind(di.PostLangSecController),
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID/langSec/:langSecUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PatchLangSecController.handle.bind(di.PatchLangSecController),
  );
};