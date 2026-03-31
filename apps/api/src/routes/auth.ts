import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { toUserPublic } from "../lib/userDto.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadObject } from "../lib/storage.js";
import { descriptorFromSelfieImage } from "../lib/face.js";
import { upsertSelfieEmbedding } from "../lib/weaviate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signAccessToken({
    sub: user.id,
    role: user.role,
    eventId: user.eventId,
  });
  res.json({ token, user: toUserPublic(user) });
});

router.post(
  "/register",
  upload.fields([{ name: "selfie", maxCount: 1 }]),
  async (req, res) => {
    const body = z
      .object({
        eventId: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid registration fields" });
      return;
    }

    const files = req.files as { selfie?: Express.Multer.File[] } | undefined;
    const selfie = files?.selfie?.[0];
    if (!selfie) {
      res.status(400).json({ error: "Selfie required" });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: body.data.eventId },
    });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.data.email },
    });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
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

    const passwordHash = await bcrypt.hash(body.data.password, 10);
    const storageKey = `events/${body.data.eventId}/selfies/${randomUUID()}.jpg`;
    await uploadObject(
      storageKey,
      selfie.buffer,
      selfie.mimetype || "image/jpeg"
    );

    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        passwordHash,
        name: body.data.name,
        role: UserRole.USER,
        eventId: body.data.eventId,
        selfieKey: storageKey,
      },
    });

    try {
      await upsertSelfieEmbedding({
        userId: user.id,
        eventId: body.data.eventId,
        vector: Array.from(desc),
      });
    } catch (e) {
      console.error(e);
      await prisma.user.delete({ where: { id: user.id } });
      res.status(500).json({ error: "Failed to index face embedding" });
      return;
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      eventId: user.eventId,
    });
    res.status(201).json({ token, user: toUserPublic(user) });
  }
);

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.sub },
  });
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ user: toUserPublic(user) });
});

export default router;
