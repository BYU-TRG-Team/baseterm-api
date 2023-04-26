import { Express } from "express";
import { DIContainer } from "@di";
import { 
  verifyToken, 
  checkVerification, 
  checkRole,
  Role
} from "@byu-trg/express-user-management";

export default (app: Express, di: DIContainer, routeBase: string) => {
  app.post(
    `${routeBase}/termbase/:termbaseUUID/auxElement`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PostAuxElementController.handle.bind(di.PostAuxElementController),
  );

  app.patch(
    `${routeBase}/termbase/:termbaseUUID/auxElement/:auxElementUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.PatchAuxElementController.handle.bind(di.PatchAuxElementController),
  );

  app.delete(
    `${routeBase}/termbase/:termbaseUUID/auxElement/:auxElementUUID`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
    ]),
    di.DeleteAuxElementController.handle.bind(di.DeleteAuxElementController),
  );
};