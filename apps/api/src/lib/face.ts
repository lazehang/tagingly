import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import type { Image } from "canvas";
import { loadEnv } from "../env.js";
import { l2Normalize } from "./faceVectors.js";

const MODEL_FILES = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

let faceApiReady = false;
let faceApiInit: Promise<void> | null = null;

type FaceRuntime = {
  faceapi: typeof import("@vladmandic/face-api");
  canvas: typeof import("canvas");
  loadImage: (buffer: Buffer) => Promise<Image>;
};

let runtime: FaceRuntime | null = null;

async function ensureModels(dir: string): Promise<void> {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const base =
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
  for (const f of MODEL_FILES) {
    const dest = path.join(dir, f);
    if (existsSync(dest)) continue;
    const url = `${base}/${f}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await import("node:fs/promises").then((fs) => fs.writeFile(dest, buf));
  }
}

async function loadRuntime(): Promise<FaceRuntime> {
  if (runtime) return runtime;
  await import("@tensorflow/tfjs-node");
  const [faceapi, canvas] = await Promise.all([
    import("@vladmandic/face-api"),
    import("canvas"),
  ]);
  faceapi.env.monkeyPatch({
    Canvas: canvas.Canvas as never,
    Image: canvas.Image as never,
    ImageData: canvas.ImageData as never,
  });
  runtime = { faceapi, canvas, loadImage: canvas.loadImage };
  return runtime;
}

export async function initFaceApi(): Promise<void> {
  if (faceApiReady) return;
  if (!faceApiInit) {
    faceApiInit = (async () => {
      const { faceapi } = await loadRuntime();
      const modelDir = path.join(process.cwd(), "face-models");
      await ensureModels(modelDir);
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
      faceApiReady = true;
    })();
  }
  await faceApiInit;
}

type FaceDetectionImage = { image: Image; pixelScale: number };

async function loadImageForFaceDetection(
  buffer: Buffer
): Promise<FaceDetectionImage> {
  const { loadImage, canvas } = await loadRuntime();
  const img = await loadImage(buffer);
  const maxDim = loadEnv().PHOTO_MAX_IMAGE_DIMENSION;
  const longest = Math.max(img.width, img.height);
  if (longest <= maxDim) return { image: img, pixelScale: 1 };

  const pixelScale = maxDim / longest;
  const w = Math.max(1, Math.round(img.width * pixelScale));
  const h = Math.max(1, Math.round(img.height * pixelScale));
  const surface = canvas.createCanvas(w, h);
  const ctx = surface.getContext("2d");
  if (!ctx) return { image: img, pixelScale: 1 };
  ctx.drawImage(img as never, 0, 0, w, h);
  const scaled = await loadImage(surface.toBuffer("image/jpeg"));
  return { image: scaled, pixelScale };
}

export async function descriptorFromSelfieImage(
  buffer: Buffer
): Promise<Float32Array | null> {
  await initFaceApi();
  const { faceapi } = await loadRuntime();
  const { image } = await loadImageForFaceDetection(buffer);
  const det = await faceapi
    .detectSingleFace(image as never)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!det?.descriptor) return null;
  return new Float32Array(l2Normalize(det.descriptor));
}

export async function descriptorsFromEventPhoto(
  buffer: Buffer
): Promise<Array<{ descriptor: Float32Array; faceArea: number; score: number }>> {
  await initFaceApi();
  const { faceapi } = await loadRuntime();
  const { image, pixelScale } = await loadImageForFaceDetection(buffer);
  const dets = await faceapi
    .detectAllFaces(image as never)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const areaScale = pixelScale * pixelScale;
  return dets.map((d) => ({
    descriptor: new Float32Array(l2Normalize(d.descriptor)),
    faceArea: Math.max(
      0,
      (d.detection.box.width * d.detection.box.height) / areaScale
    ),
    score: d.detection.score ?? 0,
  }));
}

/** Best-effort cleanup between queued jobs (TensorFlow.js retains tensors otherwise). */
export function releaseFacePipelineMemory(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tf = require("@tensorflow/tfjs-node") as {
      disposeVariables?: () => void;
    };
    tf.disposeVariables?.();
  } catch {
    /* tfjs-node not loaded yet */
  }
  if (global.gc) global.gc();
}
