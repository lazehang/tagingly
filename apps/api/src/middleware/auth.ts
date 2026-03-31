import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

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

export const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.authUser?.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
};
