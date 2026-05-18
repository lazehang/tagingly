import { PhotoStatus, type Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { getObjectBuffer } from "./storage.js";
import { descriptorsFromEventPhoto } from "./face.js";
import { matchUsersByFace } from "./weaviate.js";
import { loadEnv } from "../env.js";
import {
  getExcludedUserIds,
  type ProposedMatchMetaEntry,
} from "./tagging.js";

export async function processEventPhoto(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  try {
    const env = loadEnv();
    const excluded = await getExcludedUserIds(photoId);
    const buffer = await getObjectBuffer(photo.storageKey);
    const faces = await descriptorsFromEventPhoto(buffer);
    const matched = new Map<string, number>();

    for (const face of faces) {
      if (face.faceArea < env.MATCH_MIN_FACE_AREA) continue;
      if (face.score < env.MATCH_MIN_DETECTION_SCORE) continue;
      const candidates = await matchUsersByFace({
        vector: Array.from(face.descriptor),
        eventId: photo.eventId,
        limit: 10,
        minCertainty: Math.max(0, env.MATCH_MIN_CERTAINTY - 0.08),
      });
      if (candidates.length === 0) continue;

      const bestByUser = new Map<string, number>();
      for (const c of candidates) {
        if (excluded.has(c.userId)) continue;
        const prev = bestByUser.get(c.userId);
        if (prev === undefined || c.certainty > prev) {
          bestByUser.set(c.userId, c.certainty);
        }
      }
      const sorted = [...bestByUser.entries()]
        .map(([userId, certainty]) => ({ userId, certainty }))
        .sort((a, b) => b.certainty - a.certainty);

      if (sorted.length === 0) continue;

      const top1 = sorted[0]!;
      const top2 = sorted[1];
      const margin = top2 ? top1.certainty - top2.certainty : 0;

      const accept =
        top1.certainty >= env.MATCH_MIN_CERTAINTY &&
        (top2
          ? margin >= env.MATCH_MIN_MARGIN
          : top1.certainty >= env.MATCH_MIN_CERTAINTY_SINGLE_CANDIDATE);

      if (accept && !excluded.has(top1.userId)) {
        const prev = matched.get(top1.userId);
        if (prev === undefined || top1.certainty > prev) {
          matched.set(top1.userId, top1.certainty);
        }
      }
    }

    const proposedMatchMeta: ProposedMatchMetaEntry[] = [...matched.entries()].map(
      ([userId, certainty]) => ({ userId, certainty })
    );
    const proposedUserIds = proposedMatchMeta.map((m) => m.userId);

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        proposedUserIds,
        proposedMatchMeta:
          proposedMatchMeta as unknown as Prisma.InputJsonValue,
        status: PhotoStatus.PROCESSED,
      },
    });
  } catch (e) {
    console.error("processEventPhoto", photoId, e);
    await prisma.photo.update({
      where: { id: photoId },
      data: { status: PhotoStatus.FAILED },
    });
  }
}
