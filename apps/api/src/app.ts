import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadEnv } from "./env.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
import { verifyBlobToken } from "./lib/jwt.js";
import { pipeObjectToResponse } from "./lib/storage.js";

export function createApp() {
  const env = loadEnv();
  const app = express();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/blobs", async (req, res, next) => {
    try {
      const token =
        typeof req.query.token === "string" ? req.query.token : "";
      if (!token) {
        res.status(400).send("Missing token");
        return;
      }
      const key = verifyBlobToken(token);
      await pipeObjectToResponse(key, res);
    } catch (e) {
      next(e);
    }
  });

  app.use("/auth", authRoutes);
  app.use("/events", eventRoutes);
  app.use("/users", userRoutes);
  app.use("/admin", adminRoutes);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // Express requires four arguments for error middleware
      __: express.NextFunction
    ) => {
      void __;
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}
