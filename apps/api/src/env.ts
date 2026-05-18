import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(3600),
  WEAVIATE_URL: z.string().url().default("http://localhost:8080"),
  WEAVIATE_API_KEY: z.string().optional(),
  MATCH_MIN_CERTAINTY: z.coerce.number().default(0.82),
  MATCH_MIN_MARGIN: z.coerce.number().default(0.18),
  MATCH_MIN_FACE_AREA: z.coerce.number().default(80 * 80),
  MATCH_MIN_DETECTION_SCORE: z.coerce.number().default(0.88),
  MATCH_MIN_CERTAINTY_SINGLE_CANDIDATE: z.coerce.number().default(0.9),
  /** Min Weaviate hits (selfie embeddings) for same user; use 1 if guests only upload one selfie. */
  MATCH_MIN_SELFIE_HITS: z.coerce.number().int().min(1).max(5).default(1),
  /** At or above this certainty, tag goes straight to confirmed (still shown in review meta). */
  MATCH_AUTO_CONFIRM_CERTAINTY: z.coerce.number().default(0.92),
  /** Concurrent photo jobs (1 recommended — face pipeline is memory-heavy). */
  PHOTO_PROCESS_CONCURRENCY: z.coerce.number().int().min(1).max(2).default(1),
  /** Max width/height before face detection (reduces RAM on large uploads). */
  PHOTO_MAX_IMAGE_DIMENSION: z.coerce.number().int().min(512).max(4096).default(1280),
  PHOTO_UPLOAD_MAX_FILE_MB: z.coerce.number().int().min(1).max(40).default(15),
  PHOTO_UPLOAD_MAX_FILES: z.coerce.number().int().min(1).max(30).default(8),
  USE_LOCAL_STORAGE: z
    .enum(["true", "false"])
    .or(z.boolean())
    .optional()
    .transform((v) => v === true || v === "true"),
  B2_APPLICATION_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_BUCKET_NAME: z.string().optional(),
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return parsed.data;
}
