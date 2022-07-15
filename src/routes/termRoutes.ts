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
    `${routeBase}/termbase/:termbaseUUID/terms`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User,
    ]),
    di.GetTermsController.handle.bind(di.GetTermsController)
  );
  
  app.get(
    `${routeBase}/termbase/:termbaseUUID/term/:termUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User
    ]),
    di.GetTermController.handle.bind(di.GetTermController),
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID/term/:termUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.DeleteTermController.handle.bind(di.DeleteTermController),
  );

  app.post(
    `${routeBase}/termbase/:termbaseUUID/term`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostTermController.handle.bind(di.PostTermController)
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID/term/:termUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PatchTermController.handle.bind(di.PatchTermController)
  );
};