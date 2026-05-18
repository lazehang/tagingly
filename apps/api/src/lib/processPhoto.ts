import { PhotoStatus, type Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { getObjectBuffer } from "./storage.js";
import { matchUsersByFace } from "./weaviate.js";
import { loadEnv } from "../env.js";
import {
  getExcludedUserIds,
  type ProposedMatchMetaEntry,
} from "./tagging.js";
import { acceptFaceMatch } from "./matchPolicy.js";

export async function processEventPhoto(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  try {
    const env = loadEnv();
    const excluded = await getExcludedUserIds(photoId);
    let buffer = await getObjectBuffer(photo.storageKey);
    const face = await import("./face.js");
    let faces;
    try {
      faces = await face.descriptorsFromEventPhoto(buffer);
    } finally {
      buffer = Buffer.alloc(0);
      face.releaseFacePipelineMemory();
    }

    const matched = new Map<string, number>();
    const thresholds = {
      minCertainty: env.MATCH_MIN_CERTAINTY,
      minMargin: env.MATCH_MIN_MARGIN,
      minCertaintySingleCandidate: env.MATCH_MIN_CERTAINTY_SINGLE_CANDIDATE,
      minSelfieHits: env.MATCH_MIN_SELFIE_HITS,
    };
    const weaviateFloor = Math.max(0.5, env.MATCH_MIN_CERTAINTY - 0.06);

    for (const faceResult of faces) {
      if (faceResult.faceArea < env.MATCH_MIN_FACE_AREA) continue;
      if (faceResult.score < env.MATCH_MIN_DETECTION_SCORE) continue;

      const candidates = await matchUsersByFace({
        vector: Array.from(faceResult.descriptor),
        eventId: photo.eventId,
        limit: 32,
        minCertainty: weaviateFloor,
      });
      const filtered = candidates.filter((c) => !excluded.has(c.userId));
      const accepted = acceptFaceMatch(filtered, thresholds);
      if (!accepted) continue;

      const prev = matched.get(accepted.userId);
      if (prev === undefined || accepted.certainty > prev) {
        matched.set(accepted.userId, accepted.certainty);
      }
    }

    const proposedMeta: ProposedMatchMetaEntry[] = [];
    const newConfirmed: string[] = [];

    for (const [userId, certainty] of matched) {
      if (certainty >= env.MATCH_AUTO_CONFIRM_CERTAINTY) {
        newConfirmed.push(userId);
      }
      proposedMeta.push({ userId, certainty });
    }

    const proposedUserIds = proposedMeta
      .filter((m) => !newConfirmed.includes(m.userId))
      .map((m) => m.userId);

    const confirmedUserIds = Array.from(
      new Set([...photo.confirmedUserIds, ...newConfirmed])
    );

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        proposedUserIds,
        proposedMatchMeta: proposedMeta as unknown as Prisma.InputJsonValue,
        confirmedUserIds,
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
