/** L2-normalize so Weaviate cosine / certainty scores are comparable. */
export function l2Normalize(vector: number[] | Float32Array): number[] {
  const arr = Array.from(vector);
  let sumSq = 0;
  for (const x of arr) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (!norm || !Number.isFinite(norm)) return arr;
  return arr.map((x) => x / norm);
}
