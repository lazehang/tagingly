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
