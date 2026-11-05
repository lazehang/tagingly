import * as ort from "onnxruntime-node";
import type { Canvas } from "canvas";
import { createCanvas } from "canvas";

export type DetectedFace = {
  /** Full YuNet row: x, y, w, h, 10 landmark coords, score. */
  row: Float32Array;
  score: number;
  faceArea: number;
};

const YUNET_INPUT = 640;
const STRIDES = [8, 16, 32] as const;

const OUTPUT_NAMES = [
  "cls_8",
  "cls_16",
  "cls_32",
  "obj_8",
  "obj_16",
  "obj_32",
  "bbox_8",
  "bbox_16",
  "bbox_32",
  "kps_8",
  "kps_16",
  "kps_32",
] as const;

export function nmsFaceRows(
  rows: Float32Array[],
  scoreThreshold: number,
  nmsThreshold: number,
  topK: number
): Float32Array[] {
  if (rows.length <= 1) return rows;

  type Box = { x: number; y: number; w: number; h: number };
  const boxes: Box[] = rows.map((r) => ({
    x: r[0]!,
    y: r[1]!,
    w: r[2]!,
    h: r[3]!,
  }));
  const scores = rows.map((r) => r[14]!);

  const order = scores
    .map((s, i) => i)
    .filter((i) => scores[i]! >= scoreThreshold)
    .sort((a, b) => scores[b]! - scores[a]!);

  const keep: number[] = [];
  while (order.length > 0 && keep.length < topK) {
    const i = order.shift()!;
    keep.push(i);
    for (let k = order.length - 1; k >= 0; k--) {
      const j = order[k]!;
      const a = boxes[i]!;
      const b = boxes[j]!;
      const x1 = Math.max(a.x, b.x);
      const y1 = Math.max(a.y, b.y);
      const x2 = Math.min(a.x + a.w, b.x + b.w);
      const y2 = Math.min(a.y + a.h, b.y + b.h);
      const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      const iou = inter / (a.w * a.h + b.w * b.h - inter);
      if (iou > nmsThreshold) order.splice(k, 1);
    }
  }
  return keep.map((i) => rows[i]!);
}

function postProcessYunetOutputs(
  outputs: ort.InferenceSession.OnnxValueMapType,
  padW: number,
  padH: number,
  scoreThreshold: number
): Float32Array[] {
  const faces: Float32Array[] = [];

  for (let si = 0; si < STRIDES.length; si++) {
    const st = STRIDES[si]!;
    const cols = Math.floor(padW / st);
    const rows = Math.floor(padH / st);
    const cls = outputs[`cls_${st}`]!.data as Float32Array;
    const obj = outputs[`obj_${st}`]!.data as Float32Array;
    const bbox = outputs[`bbox_${st}`]!.data as Float32Array;
    const kps = outputs[`kps_${st}`]!.data as Float32Array;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        let clsScore = cls[idx]!;
        let objScore = obj[idx]!;
        clsScore = Math.min(1, Math.max(0, clsScore));
        objScore = Math.min(1, Math.max(0, objScore));
        const score = Math.sqrt(clsScore * objScore);
        if (score < scoreThreshold) continue;

        const cx = (c + bbox[idx * 4 + 0]!) * st;
        const cy = (r + bbox[idx * 4 + 1]!) * st;
        const w = Math.exp(bbox[idx * 4 + 2]!) * st;
        const h = Math.exp(bbox[idx * 4 + 3]!) * st;

        const row = new Float32Array(15);
        row[0] = cx - w / 2;
        row[1] = cy - h / 2;
        row[2] = w;
        row[3] = h;
        for (let n = 0; n < 5; n++) {
          row[4 + 2 * n] = (kps[idx * 10 + 2 * n]! + c) * st;
          row[4 + 2 * n + 1] = (kps[idx * 10 + 2 * n + 1]! + r) * st;
        }
        row[14] = score;
        faces.push(row);
      }
    }
  }
  return faces;
}

/** Letterbox source image into 640×640 BGR NCHW tensor (OpenCV YuNet). */
export function buildYunetInputTensor(source: Canvas): {
  tensor: ort.Tensor;
  padW: number;
  padH: number;
  scale: number;
} {
  const padW = YUNET_INPUT;
  const padH = YUNET_INPUT;
  const scale = Math.min(padW / source.width, padH / source.height);
  const sw = Math.round(source.width * scale);
  const sh = Math.round(source.height * scale);

  const letter = createCanvas(padW, padH);
  const ctx = letter.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, padW, padH);
  ctx.drawImage(source as never, 0, 0, sw, sh);

  const data = ctx.getImageData(0, 0, padW, padH).data;
  const chw = new Float32Array(3 * padH * padW);
  for (let y = 0; y < padH; y++) {
    for (let x = 0; x < padW; x++) {
      const i = (y * padW + x) * 4;
      const o = y * padW + x;
      chw[0 * padH * padW + o] = data[i + 2]!;
      chw[1 * padH * padW + o] = data[i + 1]!;
      chw[2 * padH * padW + o] = data[i]!;
    }
  }
  return {
    tensor: new ort.Tensor("float32", chw, [1, 3, padH, padW]),
    padW,
    padH,
    scale,
  };
}

function mapFaceToSourceCoords(
  row: Float32Array,
  yunetScale: number
): Float32Array {
  const inv = 1 / yunetScale;
  const out = new Float32Array(15);
  for (let i = 0; i < 14; i++) out[i] = row[i]! * inv;
  out[14] = row[14]!;
  return out;
}

export async function detectFacesYunet(args: {
  session: ort.InferenceSession;
  sourceCanvas: Canvas;
  scoreThreshold: number;
  nmsThreshold: number;
  topK: number;
  areaScale: number;
}): Promise<DetectedFace[]> {
  const { tensor, padW, padH, scale } = buildYunetInputTensor(
    args.sourceCanvas
  );
  const outputs = await args.session.run({ input: tensor });
  for (const name of OUTPUT_NAMES) {
    if (!outputs[name]) {
      throw new Error(`YuNet output missing: ${name}`);
    }
  }

  let rows = postProcessYunetOutputs(
    outputs,
    padW,
    padH,
    args.scoreThreshold
  );
  rows = nmsFaceRows(rows, args.scoreThreshold, args.nmsThreshold, args.topK);
  rows = rows.map((r) => mapFaceToSourceCoords(r, scale));

  return rows.map((row) => ({
    row,
    score: row[14]!,
    faceArea: Math.max(0, (row[2]! * row[3]!) / args.areaScale),
  }));
}
