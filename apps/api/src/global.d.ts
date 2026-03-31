import type { AccessPayload } from "./lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: AccessPayload;
    }
  }
}

export {};
