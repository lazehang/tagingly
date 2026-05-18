import { Router } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { toUserPublic } from "../lib/userDto.js";
import { requireAuth } from "../middleware/auth.js";
import { getSignedReadUrl } from "../lib/storage.js";
import { createSelfiesFromRegistration, listUserSelfies } from "../lib/selfies.js";

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
  upload.fields([
    { name: "selfies", maxCount: 5 },
    { name: "selfie", maxCount: 1 },
  ]),
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

    const files = req.files as
      | { selfies?: Express.Multer.File[]; selfie?: Express.Multer.File[] }
      | undefined;
    const selfieFiles =
      files?.selfies?.length
        ? files.selfies
        : files?.selfie?.length
          ? files.selfie
          : [];
    if (selfieFiles.length === 0) {
      res.status(400).json({ error: "At least one selfie is required" });
      return;
    }
    if (selfieFiles.length > 5) {
      res.status(400).json({ error: "Maximum 5 selfies allowed" });
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

    const passwordHash = await bcrypt.hash(body.data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        passwordHash,
        name: body.data.name,
        role: UserRole.USER,
        eventId: body.data.eventId,
      },
    });

    try {
      const primaryKey = await createSelfiesFromRegistration({
        userId: user.id,
        eventId: body.data.eventId,
        files: selfieFiles,
      });
      if (!primaryKey) {
        await prisma.user.delete({ where: { id: user.id } });
        res.status(400).json({ error: "No face detected in any selfie" });
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { selfieKey: primaryKey },
      });
    } catch (e) {
      console.error(e);
      await prisma.user.delete({ where: { id: user.id } });
      res.status(500).json({ error: "Failed to index face embeddings" });
      return;
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      eventId: user.eventId,
    });
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    res.status(201).json({ token, user: toUserPublic(refreshed!) });
  }
);

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.sub },
    include: { event: true },
  });
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const dto = toUserPublic(user);
  const selfies = await listUserSelfies(user.id);
  res.json({
    user: {
      ...dto,
      selfieUrl: user.selfieKey
        ? await getSignedReadUrl(user.selfieKey)
        : undefined,
      selfies,
    },
    event: user.event
      ? {
          id: user.event.id,
          name: user.event.name,
          allowUserDownloads: user.event.allowUserDownloads,
        }
      : undefined,
  });
});

export default router;
