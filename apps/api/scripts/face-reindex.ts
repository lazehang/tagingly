/**
 * Wipe FaceEmbedding vectors and rebuild from Prisma UserSelfie blobs (SFace).
 *
 * Usage: npm run face:reindex --workspace=api [-- --dry-run]
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/prisma.js";
import { getObjectBuffer } from "../src/lib/storage.js";
import {
  addSelfieEmbedding,
  deleteAllFaceEmbeddings,
  ensureWeaviateSchema,
} from "../src/lib/weaviate.js";
import {
  descriptorFromSelfieImage,
  disposeFaceModels,
  initFaceModels,
  releaseFacePipelineMemory,
} from "../src/lib/face.js";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const dryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const selfies = await prisma.userSelfie.findMany({
    include: { user: { select: { eventId: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.info(
    `[face:reindex] ${dryRun ? "DRY RUN — " : ""}found ${selfies.length} selfies in Postgres`
  );

  if (dryRun) {
    console.info(
      "[face:reindex] dry-run complete (no Weaviate or embedding changes)"
    );
    return;
  }

  await ensureWeaviateSchema();
  const removed = await deleteAllFaceEmbeddings();
  console.info(`[face:reindex] removed ${removed} FaceEmbedding object(s)`);

  await initFaceModels();

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const selfie of selfies) {
    const eventId = selfie.user.eventId;
    if (!eventId) {
      console.warn(
        `[face:reindex] skip ${selfie.id}: user ${selfie.userId} has no eventId`
      );
      skipped++;
      continue;
    }
    try {
      const buffer = await getObjectBuffer(selfie.storageKey);
      const desc = await descriptorFromSelfieImage(buffer);
      releaseFacePipelineMemory();
      if (!desc) {
        console.warn(
          `[face:reindex] skip ${selfie.id}: no face in ${selfie.storageKey}`
        );
        skipped++;
        continue;
      }
      await addSelfieEmbedding({
        userId: selfie.userId,
        eventId,
        selfieKey: selfie.storageKey,
        vector: Array.from(desc),
      });
      indexed++;
    } catch (e) {
      failed++;
      console.error(`[face:reindex] failed ${selfie.id}:`, e);
    }
  }

  await disposeFaceModels();
  await prisma.$disconnect();

  console.info(
    `[face:reindex] done — indexed=${indexed} skipped=${skipped} failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("[face:reindex] fatal:", e);
  process.exit(1);
});
