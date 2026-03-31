import jwt from "jsonwebtoken";
import { loadEnv } from "../env.js";

export type AccessPayload = {
  sub: string;
  role: "ADMIN" | "USER";
  eventId: string | null;
};

export function signAccessToken(payload: AccessPayload): string {
  const { JWT_SECRET } = loadEnv();
  return jwt.sign(
    { role: payload.role, eventId: payload.eventId },
    JWT_SECRET,
    {
      subject: payload.sub,
      expiresIn: "7d",
    }
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const { JWT_SECRET } = loadEnv();
  const decoded = jwt.verify(token, JWT_SECRET, {
    complete: false,
  }) as jwt.JwtPayload & { role: "ADMIN" | "USER"; eventId: string | null };
  if (!decoded.sub) {
    throw new Error("Invalid token");
  }
  return {
    sub: decoded.sub,
    role: decoded.role,
    eventId: decoded.eventId ?? null,
  };
}

export function signBlobToken(storageKey: string): string {
  const { JWT_SECRET, SIGNED_URL_TTL_SECONDS } = loadEnv();
  return jwt.sign({ sk: storageKey, aud: "blob" }, JWT_SECRET, {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

export function verifyBlobToken(token: string): string {
  const { JWT_SECRET } = loadEnv();
  const decoded = jwt.verify(token, JWT_SECRET, {
    audience: "blob",
    complete: false,
  }) as jwt.JwtPayload & { sk: string };
  if (!decoded.sk || typeof decoded.sk !== "string") {
    throw new Error("Invalid blob token");
  }
  return decoded.sk;
}
