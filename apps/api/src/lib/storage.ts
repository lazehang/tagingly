import { createReadStream, mkdirSync, writeFileSync, existsSync } from "node:fs";
import type { Readable } from "node:stream";
import path from "node:path";
import type { Response } from "express";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { loadEnv } from "../env.js";
import { signBlobToken } from "./jwt.js";

let s3: S3Client | null = null;

function getS3(): S3Client {
  const env = loadEnv();
  if (!s3) {
    s3 = new S3Client({
      region: env.B2_REGION ?? "us-west-000",
      endpoint: env.B2_ENDPOINT,
      credentials: {
        accessKeyId: env.B2_APPLICATION_KEY_ID ?? "",
        secretAccessKey: env.B2_APPLICATION_KEY ?? "",
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

function localRoot(): string {
  return path.join(process.cwd(), "data", "blob");
}

export function ensureLocalDir(): void {
  const root = localRoot();
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
}

export async function uploadObject(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const env = loadEnv();
  if (env.USE_LOCAL_STORAGE || !env.B2_BUCKET_NAME) {
    ensureLocalDir();
    const full = path.join(localRoot(), storageKey);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
    return;
  }
  const client = getS3();
  await client.send(
    new PutObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(storageKey: string): Promise<void> {
  const env = loadEnv();
  if (env.USE_LOCAL_STORAGE || !env.B2_BUCKET_NAME) {
    const full = path.join(localRoot(), storageKey);
    if (existsSync(full)) {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(full);
    }
    return;
  }
  const client = getS3();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.B2_BUCKET_NAME!,
      Key: storageKey,
    })
  );
}

export async function getObjectBuffer(storageKey: string): Promise<Buffer> {
  const env = loadEnv();
  if (env.USE_LOCAL_STORAGE || !env.B2_BUCKET_NAME) {
    const full = path.join(localRoot(), storageKey);
    const { readFileSync } = await import("node:fs");
    return readFileSync(full);
  }
  const client = getS3();
  const out = await client.send(
    new GetObjectCommand({
      Bucket: env.B2_BUCKET_NAME!,
      Key: storageKey,
    })
  );
  const bytes = await out.Body?.transformToByteArray();
  if (!bytes) throw new Error("Empty object");
  return Buffer.from(bytes);
}

function mimeForKey(storageKey: string): string {
  const ext = storageKey.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export async function pipeObjectAsAttachment(
  storageKey: string,
  res: Response,
  filename: string
): Promise<void> {
  res.setHeader("Content-Type", mimeForKey(storageKey));
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename.replace(/"/g, "")}"`
  );
  await pipeObjectToResponse(storageKey, res);
}

export async function pipeObjectToResponse(
  storageKey: string,
  res: Response
): Promise<void> {
  const env = loadEnv();
  if (env.USE_LOCAL_STORAGE || !env.B2_BUCKET_NAME) {
    const full = path.join(localRoot(), storageKey);
    createReadStream(full).pipe(res);
    return;
  }
  const client = getS3();
  const out = await client.send(
    new GetObjectCommand({
      Bucket: env.B2_BUCKET_NAME!,
      Key: storageKey,
    })
  );
  if (out.ContentType) res.setHeader("Content-Type", out.ContentType);
  (out.Body as Readable).pipe(res);
}

export async function getSignedReadUrl(storageKey: string): Promise<string> {
  const env = loadEnv();
  if (env.USE_LOCAL_STORAGE || !env.B2_BUCKET_NAME) {
    const port = env.PORT;
    const base =
      process.env["API_PUBLIC_URL"]?.replace(/\/$/, "") ??
      `http://localhost:${port}`;
    const token = signBlobToken(storageKey);
    return `${base}/blobs?token=${encodeURIComponent(token)}`;
  }
  const client = getS3();
  const cmd = new GetObjectCommand({
    Bucket: env.B2_BUCKET_NAME!,
    Key: storageKey,
  });
  return getSignedUrl(client, cmd, {
    expiresIn: env.SIGNED_URL_TTL_SECONDS,
  });
}
