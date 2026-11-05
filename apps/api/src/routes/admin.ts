import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireSuperadmin } from "../middleware/auth.js";
import { toUserPublic } from "../lib/userDto.js";
import { addEventOrganizer, assertStaffRole } from "../lib/eventAccess.js";
import type { EventOrganizerDto } from "@repo/types";

const router = Router();

router.use(requireSuperadmin);

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  res.json({
    users: users.map((u) => toUserPublic(u)),
  });
});

router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const parsed = z
    .object({
      role: z.enum(["SUPERADMIN", "ORGANIZER", "USER"]),
    })
    .safeParse(req.body);
  if (!userId || !parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (existing.role === "SUPERADMIN" && parsed.data.role !== "SUPERADMIN") {
    const superCount = await prisma.user.count({
      where: { role: UserRole.SUPERADMIN },
    });
    if (superCount <= 1) {
      res.status(400).json({ error: "Cannot demote the last superadmin" });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  });
  res.json({ user: toUserPublic(user) });
});

router.get("/users/:userId/events", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: "Missing user id" });
    return;
  }
  const rows = await prisma.eventOrganizer.findMany({
    where: { userId },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
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

router.post("/users/:userId/events", async (req, res) => {
  const { userId } = req.params;
  const parsed = z
    .object({
      eventId: z.string().min(1),
      role: z.enum(["OWNER", "ORGANIZER"]).default("ORGANIZER"),
    })
    .safeParse(req.body);
  if (!userId || !parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    assertStaffRole(user.role);
  } catch {
    res.status(400).json({
      error: "User must have Organizer or Superadmin role before event access is granted",
    });
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const row = await addEventOrganizer(
    parsed.data.eventId,
    userId,
    parsed.data.role
  );
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

router.delete("/users/:userId/events/:eventId", async (req, res) => {
  const { userId, eventId } = req.params;
  if (!userId || !eventId) {
    res.status(400).json({ error: "Missing ids" });
    return;
  }
  try {
    await prisma.eventOrganizer.delete({
      where: { eventId_userId: { eventId, userId } },
    });
  } catch {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
