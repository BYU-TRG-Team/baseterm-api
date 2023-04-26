import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@typings";

declare global{
  namespace Express {
      interface Request {
          userId: UUID;
          role: Role;
      }
  }
}