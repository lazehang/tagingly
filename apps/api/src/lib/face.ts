import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { loadImage } from "canvas";

import * as faceapi from "@vladmandic/face-api";
import * as canvas from "canvas";

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

export async function initFaceApi(): Promise<void> {
  if (faceApiReady) return;
  await import("@tensorflow/tfjs-node");
  faceapi.env.monkeyPatch({
    Canvas: canvas.Canvas as never,
    Image: canvas.Image as never,
    ImageData: canvas.ImageData as never,
  });
  const modelDir = path.join(process.cwd(), "face-models");
  await ensureModels(modelDir);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
  faceApiReady = true;
}

export async function descriptorFromSelfieImage(
  buffer: Buffer
): Promise<Float32Array | null> {
  await initFaceApi();
  const img = await loadImage(buffer);
  const det = await faceapi
    .detectSingleFace(img as never)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return det?.descriptor ?? null;
}

export async function descriptorsFromEventPhoto(
  buffer: Buffer
): Promise<Array<{ descriptor: Float32Array; faceArea: number; score: number }>> {
  await initFaceApi();
  const img = await loadImage(buffer);
  const dets = await faceapi
    .detectAllFaces(img as never)
    .withFaceLandmarks()
    .withFaceDescriptors();
  return dets.map((d) => ({
    descriptor: d.descriptor,
    faceArea: Math.max(0, d.detection.box.width * d.detection.box.height),
    score: d.detection.score ?? 0,
  }));
}
