import { Express } from "express";
import { DIContainer } from "../di";
import { 
  verifyToken, 
  checkVerification, 
  checkRole,
  Role
} from "@byu-trg/express-user-management";

export default (app: Express, di: DIContainer, routeBase: string) => {
  app.post(
    `${routeBase}/termbase/:termbaseUUID/entry`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostEntryController.handle.bind(di.PostEntryController),
  );

  app.get(
    `${routeBase}/termbase/:termbaseUUID/entry/:entryUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User
    ]),
    di.GetEntryController.handle.bind(di.GetEntryController),
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID/entry/:entryUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PatchEntryController.handle.bind(di.PatchEntryController)
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID/entry/:entryUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.DeleteEntryController.handle.bind(di.DeleteEntryController)
  );
};