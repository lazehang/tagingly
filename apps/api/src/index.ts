import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./env.js";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });
import { createApp } from "./app.js";
import { ensureWeaviateSchema } from "./lib/weaviate.js";

const env = loadEnv();
const app = createApp();

void ensureWeaviateSchema()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`API listening on http://localhost:${env.PORT}`);
    });
  })
  .catch((e) => {
    console.error("Failed to ensure Weaviate schema:", e);
    process.exit(1);
  });
