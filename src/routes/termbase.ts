import { Express } from "express";
import { DIContainer } from "@di";
import { 
  verifyToken, 
  checkVerification, 
  checkRole,
  Role
} from "@byu-trg/express-user-management";

export default (app: Express, di: DIContainer, routeBase: string) => {
  app.get(
    `${routeBase}/termbases`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User,
    ]),
    di.GetTermbasesController.handle.bind(di.GetTermbasesController),
  );

  app.get(
    `${routeBase}/termbase/:termbaseUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User,
    ]),
    di.GetTermbaseController.handle.bind(di.GetTermbaseController)
  );
  
  app.post(
    `${routeBase}/termbase`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostTermbaseController.handle.bind(di.PostTermbaseController),
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin
    ]),
    di.DeleteTermbaseController.handle.bind(di.DeleteTermbaseController)
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff
    ]),
    di.PatchTermbaseController.handle.bind(di.PatchTermbaseController)
  );
};