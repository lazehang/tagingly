import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { PhotoStatus, TagExclusionReason, type Event } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireEventAccess, requireOrganizer } from "../middleware/auth.js";
import {
  addEventOrganizer,
  assertCanManageEventOrganizers,
  canManageEventOrganizers,
  listAccessibleEvents,
} from "../lib/eventAccess.js";
import { isSuperadmin } from "../lib/roles.js";
import { uploadObject, getSignedReadUrl } from "../lib/storage.js";
import { processEventPhoto } from "../lib/processPhoto.js";
import type {
  EventDto,
  EventOrganizerDto,
  PhotoDto,
  PhotoDetailDto,
  EventUserSearchResult,
} from "@repo/types";
import {
  addManualConfirmedTag,
  bulkConfirmProposed,
  confirmProposedTag,
  rejectProposedTag,
  removeConfirmedTag,
  toPhotoDetailDto,
} from "../lib/tagging.js";
import {
  assertEventUser,
  getPhotoForEvent,
  PermissionError,
} from "../lib/permissions.js";

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
    allowUserDownloads: e.allowUserDownloads,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

async function toPhotoDto(photo: {
  id: string;
  eventId: string;
  storageKey: string;
  proposedUserIds: string[];
  confirmedUserIds: string[];
  status: PhotoStatus;
  createdAt: Date;
  updatedAt: Date;
}): Promise<PhotoDto> {
  return {
    id: photo.id,
    eventId: photo.eventId,
    storageKey: photo.storageKey,
    proposedUserIds: photo.proposedUserIds,
    confirmedUserIds: photo.confirmedUserIds,
    status: photo.status,
    photoUrl: await getSignedReadUrl(photo.storageKey),
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
  };
}

function handlePermissionError(res: import("express").Response, e: unknown): boolean {
  if (e instanceof PermissionError) {
    res.status(e.status).json({ error: e.message });
    return true;
  }
  return false;
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

router.get("/", requireOrganizer, async (req, res) => {
  const events = await listAccessibleEvents(req.authUser!);
  res.json({ events: events.map(toEventDto) });
});

router.post("/", requireOrganizer, async (req, res) => {
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
  const creatorId = req.authUser!.sub;
  const event = await prisma.event.create({
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      createdById: creatorId,
    },
  });
  await addEventOrganizer(event.id, creatorId, "OWNER");
  res.status(201).json({ event: toEventDto(event) });
});

router.patch("/:eventId", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  const parsed = z
    .object({ allowUserDownloads: z.boolean() })
    .safeParse(req.body);
  if (!eventId || !parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { allowUserDownloads: parsed.data.allowUserDownloads },
    });
    res.json({ event: toEventDto(event) });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

router.delete("/:eventId", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  if (!(await canManageEventOrganizers(req.authUser!, eventId))) {
    res.status(403).json({ error: "Only event owners can delete this event" });
    return;
  }
  try {
    await prisma.event.delete({ where: { id: eventId } });
  } catch {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.get("/:eventId/organizers", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  const rows = await prisma.eventOrganizer.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  const organizers: EventOrganizerDto[] = rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventName: r.event.name,
    userId: r.userId,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json({ organizers });
});

router.post("/:eventId/organizers", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  const parsed = z
    .object({
      email: z.string().email(),
      role: z.enum(["ORGANIZER"]).default("ORGANIZER"),
    })
    .safeParse(req.body);
  if (!eventId || !parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    await assertCanManageEventOrganizers(req.authUser!, eventId);
  } catch (e) {
    if (handlePermissionError(res, e)) return;
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: parsed.data.email, mode: "insensitive" },
    },
  });
  if (!user) {
    res.status(404).json({
      error: "No account with that email. Ask them to register or have a superadmin create an organizer account.",
    });
    return;
  }
  if (user.role === "USER") {
    res.status(400).json({
      error: "That user is an attendee. A superadmin must promote them to Organizer first.",
    });
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const row = await addEventOrganizer(eventId, user.id, parsed.data.role);
  res.status(201).json({
    organizer: {
      id: row.id,
      eventId: row.eventId,
      eventName: event.name,
      userId: row.userId,
      name: user.name,
      email: user.email,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    } satisfies EventOrganizerDto,
  });
});

router.delete(
  "/:eventId/organizers/:userId",
  requireEventAccess,
  async (req, res) => {
    const { eventId, userId } = req.params;
    if (!eventId || !userId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    try {
      await assertCanManageEventOrganizers(req.authUser!, eventId);
    } catch (e) {
      if (handlePermissionError(res, e)) return;
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const target = await prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!target) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (target.role === "OWNER") {
      const ownerCount = await prisma.eventOrganizer.count({
        where: { eventId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        res.status(400).json({ error: "Cannot remove the only event owner" });
        return;
      }
    }
    if (userId === req.authUser!.sub && !isSuperadmin(req.authUser!.role)) {
      res.status(400).json({ error: "Remove yourself via another owner or superadmin" });
      return;
    }

    await prisma.eventOrganizer.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    res.status(204).send();
  }
);

router.get("/:eventId/users/search", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  if (q.length < 2) {
    res.json({ users: [] as EventUserSearchResult[] });
    return;
  }
  const users = await prisma.user.findMany({
    where: {
      eventId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 20,
    orderBy: { name: "asc" },
  });
  res.json({ users });
});

router.post(
  "/:eventId/photos",
  requireEventAccess,
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
        data: { eventId, storageKey: key },
      });
      setImmediate(() => {
        void processEventPhoto(photo.id);
      });
      photos.push(await toPhotoDto(photo));
    }
    res.status(201).json({ photos });
  }
);

router.get("/:eventId/photos", requireEventAccess, async (req, res) => {
  const eventId = req.params.eventId;
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  const list = await prisma.photo.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
  const photos = await Promise.all(list.map(toPhotoDto));
  res.json({ photos });
});

router.get("/:eventId/photos/:photoId", requireEventAccess, async (req, res) => {
  const { eventId, photoId } = req.params;
  if (!eventId || !photoId) {
    res.status(400).json({ error: "Missing ids" });
    return;
  }
  const photo = await getPhotoForEvent(photoId, eventId);
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const detail: PhotoDetailDto = await toPhotoDetailDto(photo);
  res.json({ photo: detail });
});

router.post("/:eventId/photos/:photoId/confirm", requireEventAccess, async (req, res) => {
  const { eventId, photoId } = req.params;
  if (!eventId || !photoId) {
    res.status(400).json({ error: "Missing ids" });
    return;
  }
  const photo = await getPhotoForEvent(photoId, eventId);
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const updated = await bulkConfirmProposed({ photoId });
  res.json({ photo: await toPhotoDetailDto(updated) });
});

router.post(
  "/:eventId/photos/:photoId/proposed/:userId/confirm",
  requireEventAccess,
  async (req, res) => {
    const { eventId, photoId, userId } = req.params;
    if (!eventId || !photoId || !userId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    try {
      const photo = await getPhotoForEvent(photoId, eventId);
      if (!photo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      await assertEventUser(eventId, userId);
      const updated = await confirmProposedTag({ photoId, userId });
      res.json({ photo: await toPhotoDetailDto(updated) });
    } catch (e) {
      if (handlePermissionError(res, e)) return;
      const msg = e instanceof Error ? e.message : "Failed";
      res.status(400).json({ error: msg });
    }
  }
);

router.post(
  "/:eventId/photos/:photoId/proposed/:userId/reject",
  requireEventAccess,
  async (req, res) => {
    const { eventId, photoId, userId } = req.params;
    if (!eventId || !photoId || !userId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    try {
      const photo = await getPhotoForEvent(photoId, eventId);
      if (!photo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const updated = await rejectProposedTag({
        photoId,
        userId,
        createdByUserId: req.authUser!.sub,
      });
      res.json({ photo: await toPhotoDetailDto(updated) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      res.status(400).json({ error: msg });
    }
  }
);

router.post("/:eventId/photos/:photoId/set-confirmed", requireEventAccess, async (req, res) => {
  const { eventId, photoId } = req.params;
  const parsed = z.object({ userIds: z.array(z.string()) }).safeParse(req.body);
  if (!eventId || !photoId) {
    res.status(400).json({ error: "Missing ids" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const photo = await getPhotoForEvent(photoId, eventId);
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const updated = await prisma.photo.update({
    where: { id: photoId },
    data: { confirmedUserIds: parsed.data.userIds },
  });
  res.json({ photo: await toPhotoDetailDto(updated) });
});

router.post(
  "/:eventId/photos/:photoId/confirmed/add",
  requireEventAccess,
  async (req, res) => {
    const { eventId, photoId } = req.params;
    const parsed = z.object({ userId: z.string() }).safeParse(req.body);
    if (!eventId || !photoId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    try {
      const photo = await getPhotoForEvent(photoId, eventId);
      if (!photo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      await assertEventUser(eventId, parsed.data.userId);
      const updated = await addManualConfirmedTag({
        photoId,
        userId: parsed.data.userId,
      });
      res.json({ photo: await toPhotoDetailDto(updated) });
    } catch (e) {
      if (handlePermissionError(res, e)) return;
      res.status(400).json({ error: "Failed to add tag" });
    }
  }
);

router.post(
  "/:eventId/photos/:photoId/confirmed/remove",
  requireEventAccess,
  async (req, res) => {
    const { eventId, photoId } = req.params;
    const parsed = z.object({ userId: z.string() }).safeParse(req.body);
    if (!eventId || !photoId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    try {
      const photo = await getPhotoForEvent(photoId, eventId);
      if (!photo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const updated = await removeConfirmedTag({
        photoId,
        userId: parsed.data.userId,
        createdByUserId: req.authUser!.sub,
        reason: TagExclusionReason.ADMIN_REMOVE_CONFIRMED,
      });
      res.json({ photo: await toPhotoDetailDto(updated) });
    } catch (e) {
      res.status(400).json({ error: "Failed to remove tag" });
    }
  }
);

router.post(
  "/:eventId/photos/:photoId/reprocess",
  requireEventAccess,
  async (req, res) => {
    const { eventId, photoId } = req.params;
    if (!eventId || !photoId) {
      res.status(400).json({ error: "Missing ids" });
      return;
    }
    const photo = await getPhotoForEvent(photoId, eventId);
    if (!photo) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        proposedUserIds: [],
        proposedMatchMeta: [],
        status: PhotoStatus.PENDING,
      },
    });
    setImmediate(() => void processEventPhoto(photoId));
    res.json({ ok: true });
  }
);

router.post("/:eventId/photos/reprocess", requireEventAccess, async (req, res) => {
  const { eventId } = req.params;
  if (!eventId) {
    res.status(400).json({ error: "Missing event id" });
    return;
  }
  const parsed = z
    .object({ photoIds: z.array(z.string()).optional() })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const where = parsed.data.photoIds?.length
    ? { eventId, id: { in: parsed.data.photoIds } }
    : { eventId };

  const photos = await prisma.photo.findMany({
    where,
    select: { id: true },
  });

  await prisma.photo.updateMany({
    where,
    data: {
      proposedUserIds: [],
      proposedMatchMeta: [],
      status: PhotoStatus.PENDING,
    },
  });

  for (const p of photos) {
    setImmediate(() => void processEventPhoto(p.id));
  }

  res.json({ ok: true, count: photos.length });
});

export default router;
