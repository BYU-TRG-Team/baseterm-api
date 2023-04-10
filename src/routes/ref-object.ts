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
    `${routeBase}/termbase/:termbaseUUID/personRefObject`,
    verifyToken(process.env.AUTH_SECRET as string),
    checkVerification,
    checkRole([
      Role.Admin,
      Role.Staff,
      Role.User,
    ]),
    di.PostPersonRefObjectController.handle.bind(di.PostPersonRefObjectController),
  );
};