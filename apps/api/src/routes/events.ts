import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { Event } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadObject, getSignedReadUrl } from "../lib/storage.js";
import { processEventPhoto } from "../lib/processPhoto.js";
import type { EventDto, PhotoDto } from "@repo/types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 },
});

const router = Router();

function toEventDto(e: Event): EventDto {
  return {
    id: e.id,
    name: e.name,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/:id/public", async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
  });
  if (!event) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toEventDto(event));
});

router.get("/", requireAdmin, async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ events: events.map(toEventDto) });
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      name: z.string().min(1),
      date: z.string().min(1),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const event = await prisma.event.create({
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
    },
  });
  res.status(201).json({ event: toEventDto(event) });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
  } catch {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.post(
  "/:eventId/photos",
  requireAdmin,
  upload.array("photos", 30),
  async (req, res) => {
    const eventId = req.params.eventId;
    if (!eventId) {
      res.status(400).json({ error: "Missing event id" });
      return;
    }
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "No photos uploaded" });
      return;
    }

    const photos: PhotoDto[] = [];
    for (const f of files) {
      const ext = f.mimetype.includes("png") ? "png" : "jpg";
      const key = `events/${eventId}/photos/${randomUUID()}.${ext}`;
      await uploadObject(key, f.buffer, f.mimetype);
      const photo = await prisma.photo.create({
        data: {
          eventId,
          storageKey: key,
        },
      });
      setImmediate(() => {
        void processEventPhoto(photo.id);
      });
      photos.push({
        id: photo.id,
        eventId: photo.eventId,
        storageKey: photo.storageKey,
        taggedUserIds: photo.taggedUserIds,
        status: photo.status,
        photoUrl: await getSignedReadUrl(photo.storageKey),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
      });
    }
    res.status(201).json({ photos });
  }
);

router.get("/:eventId/photos", requireAdmin, async (req, res) => {
  const eventId = req.params.eventId;
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  const list = await prisma.photo.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
  const photos: PhotoDto[] = await Promise.all(
    list.map(async (p) => ({
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
  res.json({ photos });
});

export default router;
