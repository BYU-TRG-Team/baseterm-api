import { Role } from "@byu-trg/express-user-management";
import { UUID } from "@byu-trg/express-user-management/dist/types";

declare global{
  namespace Express {
      interface Request {
          userId: UUID;
          role: Role;
      }
  }
}