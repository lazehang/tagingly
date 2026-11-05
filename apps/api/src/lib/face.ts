import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import type { Canvas, Image } from "canvas";
import * as ort from "onnxruntime-node";
import { loadEnv } from "../env.js";
import { l2Normalize } from "./faceVectors.js";
import { alignFaceTo112 } from "./faceAlign.js";
import { detectFacesYunet } from "./yunetDetect.js";

const OPENCV_ZOO_BASE =
  "https://github.com/opencv/opencv_zoo/raw/main/models";

const MODEL_SPECS = [
  {
    envFile: "FACE_YUNET_MODEL" as const,
    defaultName: "face_detection_yunet_2023mar.onnx",
    zooPath: "face_detection_yunet/face_detection_yunet_2023mar.onnx",
  },
  {
    envFile: "FACE_SFACE_MODEL" as const,
    defaultName: "face_recognition_sface_2021dec.onnx",
    zooPath: "face_recognition_sface/face_recognition_sface_2021dec.onnx",
  },
];

let modelsReady = false;
let modelsInit: Promise<void> | null = null;

type FaceRuntime = {
  canvas: typeof import("canvas");
  loadImage: (buffer: Buffer) => Promise<Image>;
};

let runtime: FaceRuntime | null = null;
let yunetSession: ort.InferenceSession | null = null;
let sfaceSession: ort.InferenceSession | null = null;

function resolveModelsDir(): string {
  const env = loadEnv();
  const dir = env.FACE_MODELS_DIR ?? "face-models";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

function modelPath(filename: string): string {
  return path.join(resolveModelsDir(), filename);
}

async function ensureModelsOnDisk(): Promise<void> {
  const env = loadEnv();
  const dir = resolveModelsDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const spec of MODEL_SPECS) {
    const filename =
      spec.envFile === "FACE_YUNET_MODEL"
        ? env.FACE_YUNET_MODEL
        : env.FACE_SFACE_MODEL;
    const dest = path.join(dir, filename);
    if (existsSync(dest)) continue;

    if (env.FACE_MODELS_REQUIRED) {
      throw new Error(
        `Missing face model ${dest} (FACE_MODELS_REQUIRED=true)`
      );
    }

    const url = `${OPENCV_ZOO_BASE}/${spec.zooPath}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await import("node:fs/promises").then((fs) => fs.writeFile(dest, buf));
  }
}

async function loadRuntime(): Promise<FaceRuntime> {
  if (runtime) return runtime;
  const canvas = await import("canvas");
  runtime = { canvas, loadImage: canvas.loadImage };
  return runtime;
}

async function createSessions(): Promise<void> {
  const env = loadEnv();
  const yunetPath = modelPath(env.FACE_YUNET_MODEL);
  const sfacePath = modelPath(env.FACE_SFACE_MODEL);
  if (!existsSync(yunetPath) || !existsSync(sfacePath)) {
    throw new Error(
      `Face ONNX models not found under ${resolveModelsDir()} (expected ${env.FACE_YUNET_MODEL} and ${env.FACE_SFACE_MODEL})`
    );
  }
  yunetSession = await ort.InferenceSession.create(yunetPath);
  sfaceSession = await ort.InferenceSession.create(sfacePath);
}

export async function initFaceModels(): Promise<void> {
  if (modelsReady) return;
  if (!modelsInit) {
    modelsInit = (async () => {
      await ensureModelsOnDisk();
      await createSessions();
      modelsReady = true;
      console.info(
        `[face] YuNet + SFace ready (embedding model: sface-2021dec, dir: ${resolveModelsDir()})`
      );
    })();
  }
  await modelsInit;
}

/** @deprecated Use initFaceModels — kept for call-site compatibility. */
export const initFaceApi = initFaceModels;

async function embedAlignedFace(alignedChw: Float32Array): Promise<Float32Array> {
  if (!sfaceSession) throw new Error("SFace session not loaded");
  const tensor = new ort.Tensor("float32", alignedChw, [1, 3, 112, 112]);
  const out = await sfaceSession.run({ data: tensor });
  const fc1 = out.fc1!;
  const raw = fc1.data as Float32Array;
  return new Float32Array(l2Normalize(raw));
}

type FaceDetectionImage = {
  canvas: Canvas;
  pixelScale: number;
};

async function loadCanvasForFaceDetection(
  buffer: Buffer
): Promise<FaceDetectionImage> {
  const { loadImage, canvas } = await loadRuntime();
  const img = await loadImage(buffer);
  const maxDim = loadEnv().PHOTO_MAX_IMAGE_DIMENSION;
  const longest = Math.max(img.width, img.height);
  let pixelScale = 1;
  let w = img.width;
  let h = img.height;
  if (longest > maxDim) {
    pixelScale = maxDim / longest;
    w = Math.max(1, Math.round(img.width * pixelScale));
    h = Math.max(1, Math.round(img.height * pixelScale));
  }
  const surface = canvas.createCanvas(w, h);
  const ctx = surface.getContext("2d");
  if (!ctx) {
    const c = canvas.createCanvas(img.width, img.height);
    c.getContext("2d")?.drawImage(img as never, 0, 0);
    return { canvas: c, pixelScale: 1 };
  }
  ctx.drawImage(img as never, 0, 0, w, h);
  return { canvas: surface, pixelScale };
}

async function detectAndEmbed(
  buffer: Buffer,
  singleFace: boolean
): Promise<
  Array<{ descriptor: Float32Array; faceArea: number; score: number }>
> {
  await initFaceModels();
  if (!yunetSession) throw new Error("YuNet session not loaded");

  const env = loadEnv();
  const { canvas, pixelScale } = await loadCanvasForFaceDetection(buffer);
  const areaScale = pixelScale * pixelScale;

  const detected = await detectFacesYunet({
    session: yunetSession,
    sourceCanvas: canvas,
    scoreThreshold: env.FACE_YUNET_SCORE_THRESHOLD,
    nmsThreshold: env.FACE_YUNET_NMS_THRESHOLD,
    topK: env.FACE_YUNET_TOP_K,
    areaScale,
  });

  const picked = singleFace
    ? detected.length
      ? [detected.sort((a, b) => b.score - a.score)[0]!]
      : []
    : detected;

  const results: Array<{
    descriptor: Float32Array;
    faceArea: number;
    score: number;
  }> = [];

  for (const face of picked) {
    const aligned = alignFaceTo112(canvas, face.row);
    const descriptor = await embedAlignedFace(aligned);
    results.push({
      descriptor,
      faceArea: face.faceArea,
      score: face.score,
    });
  }
  return results;
}

export async function descriptorFromSelfieImage(
  buffer: Buffer
): Promise<Float32Array | null> {
  const faces = await detectAndEmbed(buffer, true);
  return faces[0]?.descriptor ?? null;
}

export async function descriptorsFromEventPhoto(
  buffer: Buffer
): Promise<Array<{ descriptor: Float32Array; faceArea: number; score: number }>> {
  return detectAndEmbed(buffer, false);
}

/** Best-effort cleanup between queued jobs. */
export function releaseFacePipelineMemory(): void {
  if (global.gc) global.gc();
}

/** Dispose ORT sessions (tests / shutdown). */
export async function disposeFaceModels(): Promise<void> {
  if (yunetSession) {
    await yunetSession.release();
    yunetSession = null;
  }
  if (sfaceSession) {
    await sfaceSession.release();
    sfaceSession = null;
  }
  modelsReady = false;
  modelsInit = null;
}
