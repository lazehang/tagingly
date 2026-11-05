import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { acceptFaceMatch } from "./matchPolicy.js";

const thresholds = {
  minCertainty: 0.82,
  minMargin: 0.18,
  minCertaintySingleCandidate: 0.9,
  minSelfieHits: 1,
};

describe("acceptFaceMatch", () => {
  it("accepts clear top match", () => {
    const result = acceptFaceMatch(
      [
        { userId: "a", certainty: 0.95, hitCount: 1 },
        { userId: "b", certainty: 0.7, hitCount: 1 },
      ],
      thresholds
    );
    assert.equal(result?.userId, "a");
  });

  it("rejects when margin is too small", () => {
    const result = acceptFaceMatch(
      [
        { userId: "a", certainty: 0.85, hitCount: 1 },
        { userId: "b", certainty: 0.8, hitCount: 1 },
      ],
      thresholds
    );
    assert.equal(result, null);
  });

  it("accepts single candidate above single-candidate floor", () => {
    const result = acceptFaceMatch(
      [{ userId: "a", certainty: 0.91, hitCount: 1 }],
      thresholds
    );
    assert.equal(result?.userId, "a");
  });
});
