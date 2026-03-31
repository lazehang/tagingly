import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { PhotoStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { toUserPublic } from "../lib/userDto.js";
import { uploadObject, getSignedReadUrl } from "../lib/storage.js";
import { descriptorFromSelfieImage } from "../lib/face.js";
import {
  deleteSelfieEmbeddings,
  upsertSelfieEmbedding,
} from "../lib/weaviate.js";
import type { PhotoDto } from "@repo/types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

router.put(
  "/me",
  requireAuth,
  upload.single("selfie"),
  async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.authUser!.sub },
    });
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const nameField =
      typeof req.body.name === "string" ? req.body.name : undefined;
    const nameParsed = nameField
      ? z.string().min(1).safeParse(nameField)
      : { success: true as const, data: undefined };
    if (!nameParsed.success) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }

    const selfie = req.file;

    let selfieKey = user.selfieKey;
    if (selfie) {
      if (!user.eventId) {
        res.status(400).json({ error: "Cannot upload selfie for admin user" });
        return;
      }
      let desc: Float32Array | null;
      try {
        desc = await descriptorFromSelfieImage(selfie.buffer);
      } catch (e) {
        console.error(e);
        res.status(400).json({ error: "Could not process selfie image" });
        return;
      }
      if (!desc) {
        res.status(400).json({ error: "No face detected in selfie" });
        return;
      }
      const key = `events/${user.eventId}/selfies/${randomUUID()}.jpg`;
      await uploadObject(
        key,
        selfie.buffer,
        selfie.mimetype || "image/jpeg"
      );
      await deleteSelfieEmbeddings(user.id);
      await upsertSelfieEmbedding({
        userId: user.id,
        eventId: user.eventId,
        vector: Array.from(desc),
      });
      selfieKey = key;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: nameParsed.data ?? user.name,
        selfieKey,
      },
    });
    res.json({ user: toUserPublic(updated) });
  }
);

router.get("/me/photos", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.sub },
  });
  if (!user?.eventId) {
    res.json({ photos: [] as PhotoDto[] });
    return;
  }
  const photos = await prisma.photo.findMany({
    where: {
      eventId: user.eventId,
      taggedUserIds: { has: user.id },
      status: PhotoStatus.PROCESSED,
    },
    orderBy: { createdAt: "desc" },
  });
  const out: PhotoDto[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      eventId: p.eventId,
      storageKey: p.storageKey,
      taggedUserIds: p.taggedUserIds,
      status: p.status,
      photoUrl: await getSignedReadUrl(p.storageKey),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
  res.json({ photos: out });
});

export default router;
