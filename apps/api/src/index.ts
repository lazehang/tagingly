import { loadEnv } from "./env.js";
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
