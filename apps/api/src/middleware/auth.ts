import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { assertCanAccessEvent } from "../lib/eventAccess.js";
import { isStaff, isSuperadmin } from "../lib/roles.js";
import { PermissionError } from "../lib/permissions.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.authUser = verifyAccessToken(h.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

/** Superadmin only — manage users and global roles. */
export const requireSuperadmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!isSuperadmin(req.authUser?.role ?? "")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
};

/** Superadmin or event organizer staff. */
export const requireOrganizer: RequestHandler = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!isStaff(req.authUser?.role ?? "")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
};

/** @deprecated Use requireOrganizer */
export const requireAdmin = requireOrganizer;

export const requireEventAccess: RequestHandler = (req, res, next) => {
  requireOrganizer(req, res, () => {
    void (async () => {
      try {
        const eventId = req.params.eventId ?? req.params.id;
        if (!eventId) {
          res.status(400).json({ error: "Missing event id" });
          return;
        }
        await assertCanAccessEvent(req.authUser!, eventId);
        next();
      } catch (e) {
        if (e instanceof PermissionError) {
          res.status(e.status).json({ error: e.message });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    })();
  });
};
