import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { PhotoStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { toUserPublic } from "../lib/userDto.js";
import { getSignedReadUrl, pipeObjectAsAttachment } from "../lib/storage.js";
import type { PhotoDto, UserPhotosResponse } from "@repo/types";
import {
  assertOwnUser,
  assertPhotoAccessibleToUser,
  PermissionError,
} from "../lib/permissions.js";
import { userRemoveSelfTag } from "../lib/tagging.js";
import {
  addUserSelfie,
  deleteUserSelfie,
  listUserSelfies,
} from "../lib/selfies.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

function handlePermissionError(res: import("express").Response, e: unknown): boolean {
  if (e instanceof PermissionError) {
    res.status(e.status).json({ error: e.message });
    return true;
  }
  return false;
}

router.put("/me", requireAuth, upload.none(), async (req, res) => {
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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: nameParsed.data ?? user.name },
  });
  res.json({ user: toUserPublic(updated) });
});

router.get("/me/selfies", requireAuth, async (req, res) => {
  const selfies = await listUserSelfies(req.authUser!.sub);
  res.json({ selfies });
});

router.post(
  "/me/selfies",
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
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Selfie file required" });
      return;
    }
    try {
      const selfie = await addUserSelfie({
        user,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });
      res.status(201).json({ selfie });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      res.status(400).json({ error: msg });
    }
  }
);

router.delete("/me/selfies/:selfieId", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.sub },
  });
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    assertOwnUser(req.authUser!.sub, user.id);
    await deleteUserSelfie({ user, selfieId: req.params.selfieId! });
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    res.status(400).json({ error: msg });
  }
});

router.get("/me/photos", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.sub },
    include: { event: true },
  });
  if (!user?.eventId) {
    res.json({ photos: [], allowUserDownloads: false } satisfies UserPhotosResponse);
    return;
  }
  const photos = await prisma.photo.findMany({
    where: {
      eventId: user.eventId,
      confirmedUserIds: { has: user.id },
      status: PhotoStatus.PROCESSED,
    },
    orderBy: { createdAt: "desc" },
  });
  const out: PhotoDto[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      eventId: p.eventId,
      storageKey: p.storageKey,
      proposedUserIds: p.proposedUserIds,
      confirmedUserIds: p.confirmedUserIds,
      status: p.status,
      photoUrl: await getSignedReadUrl(p.storageKey),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
  res.json({
    photos: out,
    allowUserDownloads: user.event?.allowUserDownloads ?? false,
  } satisfies UserPhotosResponse);
});

router.delete("/me/photos/:photoId/tag", requireAuth, async (req, res) => {
  const photoId = req.params.photoId;
  if (!photoId) {
    res.status(400).json({ error: "Missing photo id" });
    return;
  }
  try {
    await assertPhotoAccessibleToUser(photoId, req.authUser!.sub);
    await userRemoveSelfTag({ photoId, userId: req.authUser!.sub });
    res.json({ ok: true });
  } catch (e) {
    if (handlePermissionError(res, e)) return;
    res.status(400).json({ error: "Failed to remove tag" });
  }
});

router.get("/me/photos/:photoId/download", requireAuth, async (req, res) => {
  const photoId = req.params.photoId;
  if (!photoId) {
    res.status(400).json({ error: "Missing photo id" });
    return;
  }
  try {
    const { photo, user } = await assertPhotoAccessibleToUser(
      photoId,
      req.authUser!.sub
    );
    const event = await prisma.event.findUnique({
      where: { id: user.eventId! },
    });
    if (!event?.allowUserDownloads) {
      res.status(403).json({ error: "Downloads are not enabled for this event" });
      return;
    }
    const ext = photo.storageKey.split(".").pop() ?? "jpg";
    const filename = `photo-${photo.id}.${ext}`;
    await pipeObjectAsAttachment(photo.storageKey, res, filename);
  } catch (e) {
    if (handlePermissionError(res, e)) return;
    res.status(400).json({ error: "Download unavailable" });
  }
});

export default router;
