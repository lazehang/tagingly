import type { Canvas, CanvasRenderingContext2D } from "canvas";

/** OpenCV FaceRecognizerSF reference landmarks (112×112). */
const DST_LANDMARKS: [number, number][] = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
];

const DST_MEAN: [number, number] = [56.0262, 71.9008];

/** YuNet face row: x, y, w, h, 5×(x,y), score — landmark order matches OpenCV. */
export type YunetFaceRow = Float32Array | number[];

function svd2x2(a00: number, a01: number, a10: number, a11: number) {
  const ata00 = a00 * a00 + a10 * a10;
  const ata01 = a00 * a01 + a10 * a11;
  const ata11 = a01 * a01 + a11 * a11;
  const trace = ata00 + ata11;
  const det = ata00 * ata11 - ata01 * ata01;
  const gap = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const s0 = trace / 2 + gap;
  const s1 = trace / 2 - gap;

  let u00 = 1;
  let u10 = 0;
  if (Math.abs(ata01) > 1e-12) {
    u10 = s0 - ata00;
    const n = Math.hypot(ata01, u10);
    u00 = ata01 / n;
    u10 = u10 / n;
  }
  const u01 = -u10;
  const u11 = u00;

  let vt00 = 1;
  let vt01 = 0;
  if (Math.abs(a00 * u00 + a01 * u10) > 1e-12) {
    vt00 = a00 * u00 + a01 * u10;
    vt01 = a00 * u01 + a01 * u11;
    const n = Math.hypot(vt00, vt01);
    vt00 /= n;
    vt01 /= n;
  }
  const vt10 = -vt01;
  const vt11 = vt00;

  return {
    s: [s0, s1] as [number, number],
    u: [
      [u00, u01],
      [u10, u11],
    ] as [[number, number], [number, number]],
    vt: [
      [vt00, vt01],
      [vt10, vt11],
    ] as [[number, number], [number, number]],
  };
}

/** Port of OpenCV FaceRecognizerSFImpl::getSimilarityTransformMatrix (2×3 warp). */
export function similarityTransformFromLandmarks(
  src: [number, number][]
): [number, number, number, number, number, number] {
  let avg0 = 0;
  let avg1 = 0;
  for (let j = 0; j < 5; j++) {
    avg0 += src[j]![0];
    avg1 += src[j]![1];
  }
  avg0 /= 5;
  avg1 /= 5;
  const srcMean: [number, number] = [avg0, avg1];

  const srcDemean: [number, number][] = [];
  const dstDemean: [number, number][] = [];
  for (let j = 0; j < 5; j++) {
    srcDemean.push([src[j]![0] - srcMean[0], src[j]![1] - srcMean[1]]);
    dstDemean.push([
      DST_LANDMARKS[j]![0] - DST_MEAN[0],
      DST_LANDMARKS[j]![1] - DST_MEAN[1],
    ]);
  }

  let a00 = 0;
  let a01 = 0;
  let a10 = 0;
  let a11 = 0;
  for (let i = 0; i < 5; i++) {
    a00 += dstDemean[i]![0] * srcDemean[i]![0];
    a01 += dstDemean[i]![0] * srcDemean[i]![1];
    a10 += dstDemean[i]![1] * srcDemean[i]![0];
    a11 += dstDemean[i]![1] * srcDemean[i]![1];
  }
  a00 /= 5;
  a01 /= 5;
  a10 /= 5;
  a11 /= 5;

  const d: [number, number] = [1, 1];
  const detA = a00 * a11 - a01 * a10;
  if (detA < 0) d[1] = -1;

  const { s, u, vt } = svd2x2(a00, a01, a10, a11);
  const smax = Math.max(s[0]!, s[1]!);
  const tol = smax * 2 * Number.EPSILON;
  let rank = 0;
  if (s[0]! > tol) rank++;
  if (s[1]! > tol) rank++;

  const detU = u[0]![0] * u[1]![1] - u[0]![1] * u[1]![0];
  const detVt = vt[0]![0] * vt[1]![1] - vt[0]![1] * vt[1]![0];

  let t00 = 1;
  let t01 = 0;
  let t10 = 0;
  let t11 = 1;

  const matMul = (
    m1: [[number, number], [number, number]],
    m2: [[number, number], [number, number]]
  ): [[number, number], [number, number]] => [
    [
      m1[0]![0] * m2[0]![0] + m1[0]![1] * m2[1]![0],
      m1[0]![0] * m2[0]![1] + m1[0]![1] * m2[1]![1],
    ],
    [
      m1[1]![0] * m2[0]![0] + m1[1]![1] * m2[1]![0],
      m1[1]![0] * m2[0]![1] + m1[1]![1] * m2[1]![1],
    ],
  ];

  if (rank === 1) {
    if (detU * detVt > 0) {
      const uvt = matMul(u, vt);
      t00 = uvt[0][0];
      t01 = uvt[0][1];
      t10 = uvt[1][0];
      t11 = uvt[1][1];
    } else {
      const dMat: [[number, number], [number, number]] = [
        [d[0], 0],
        [0, -d[1]],
      ];
      const dvt = matMul(dMat, vt);
      const uDvt = matMul(u, dvt);
      t00 = uDvt[0][0];
      t01 = uDvt[0][1];
      t10 = uDvt[1][0];
      t11 = uDvt[1][1];
    }
  } else {
    const dMat: [[number, number], [number, number]] = [
      [d[0], 0],
      [0, d[1]],
    ];
    const dvt = matMul(dMat, vt);
    const uDvt = matMul(u, dvt);
    t00 = uDvt[0][0];
    t01 = uDvt[0][1];
    t10 = uDvt[1][0];
    t11 = uDvt[1][1];
  }

  let var1 = 0;
  let var2 = 0;
  for (let i = 0; i < 5; i++) {
    var1 += srcDemean[i]![0] * srcDemean[i]![0];
    var2 += srcDemean[i]![1] * srcDemean[i]![1];
  }
  var1 /= 5;
  var2 /= 5;
  const scale =
    (1 / (var1 + var2)) * (s[0]! * d[0] + s[1]! * d[1]);

  const ts0 = t00 * srcMean[0] + t01 * srcMean[1];
  const ts1 = t10 * srcMean[0] + t11 * srcMean[1];
  const t02 = DST_MEAN[0] - scale * ts0;
  const t12 = DST_MEAN[1] - scale * ts1;

  return [scale * t00, scale * t01, t02, scale * t10, scale * t11, t12];
}

function sampleBilinear(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
): [number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const dx = x - x0;
  const dy = y - y0;
  const idx = (px: number, py: number) => (py * width + px) * 4;
  const i00 = idx(Math.max(0, x0), Math.max(0, y0));
  const i10 = idx(x1, Math.max(0, y0));
  const i01 = idx(Math.max(0, x0), y1);
  const i11 = idx(x1, y1);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const r =
    lerp(lerp(data[i00]!, data[i10]!, dx), lerp(data[i01]!, data[i11]!, dx), dy);
  const g =
    lerp(
      lerp(data[i00 + 1]!, data[i10 + 1]!, dx),
      lerp(data[i01 + 1]!, data[i11 + 1]!, dx),
      dy
    );
  const b =
    lerp(
      lerp(data[i00 + 2]!, data[i10 + 2]!, dx),
      lerp(data[i01 + 2]!, data[i11 + 2]!, dx),
      dy
    );
  return [r, g, b];
}

/** Warp face to 112×112 RGB (OpenCV alignCrop + SFace input layout). */
export function alignFaceTo112(
  sourceCanvas: Canvas,
  face: YunetFaceRow
): Float32Array {
  const srcLandmarks: [number, number][] = [];
  for (let row = 0; row < 5; row++) {
    srcLandmarks.push([face[4 + row * 2]!, face[4 + row * 2 + 1]!]);
  }
  const [m00, m01, m02, m10, m11, m12] =
    similarityTransformFromLandmarks(srcLandmarks);

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const ctx = sourceCanvas.getContext("2d") as CanvasRenderingContext2D;
  const srcData = ctx.getImageData(0, 0, srcW, srcH).data;

  const outSize = 112;
  const chw = new Float32Array(3 * outSize * outSize);
  for (let y = 0; y < outSize; y++) {
    for (let x = 0; x < outSize; x++) {
      const sx = m00 * x + m01 * y + m02;
      const sy = m10 * x + m11 * y + m12;
      let r = 0;
      let g = 0;
      let b = 0;
      if (sx >= 0 && sy >= 0 && sx < srcW - 1 && sy < srcH - 1) {
        [r, g, b] = sampleBilinear(srcData, srcW, srcH, sx, sy);
      }
      const o = y * outSize + x;
      chw[0 * outSize * outSize + o] = r;
      chw[1 * outSize * outSize + o] = g;
      chw[2 * outSize * outSize + o] = b;
    }
  }
  return chw;
}

export function landmarksFromFaceRow(face: YunetFaceRow): [number, number][] {
  const pts: [number, number][] = [];
  for (let row = 0; row < 5; row++) {
    pts.push([face[4 + row * 2]!, face[4 + row * 2 + 1]!]);
  }
  return pts;
}
