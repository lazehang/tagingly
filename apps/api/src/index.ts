import { config } from "dotenv";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./env.js";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

import { createApp } from "./app.js";
import { drainPhotoQueue } from "./lib/photoQueue.js";
import { ensureWeaviateSchema } from "./lib/weaviate.js";

const env = loadEnv();
const app = createApp();
const server = createServer(app);

let shutdownStarted = false;

async function shutdown(signal: string) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  console.log(`${signal}: draining photo queue and closing server…`);
  await drainPhotoQueue();
  server.close((err) => {
    if (err) console.error("Server close error:", err);
    process.exit(err ? 1 : 0);
  });
  setTimeout(() => {
    console.error("Forced exit after shutdown timeout");
    process.exit(1);
  }, 30_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

void ensureWeaviateSchema()
  .then(() => {
    server.listen(env.PORT, () => {
      console.log(`API listening on http://localhost:${env.PORT}`);
    });
  })
  .catch((e) => {
    console.error("Failed to ensure Weaviate schema:", e);
    process.exit(1);
  });
