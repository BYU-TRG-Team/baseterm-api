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
    `${routeBase}/termbase/:termbaseUUID/termNote`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostTermNoteController.handle.bind(di.PostTermNoteController)
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID/termNote/:termNoteUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PatchTermNoteController.handle.bind(di.PatchTermNoteController),
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID/termNote/:termNoteUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.DeleteTermNoteController.handle.bind(di.DeleteTermNoteController),
  );
};