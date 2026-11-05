import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { l2Normalize } from "./faceVectors.js";

describe("l2Normalize", () => {
  it("returns unit vector for non-zero input", () => {
    const out = l2Normalize([3, 4]);
    const norm = Math.sqrt(out[0]! * out[0]! + out[1]! * out[1]!);
    assert.ok(Math.abs(norm - 1) < 1e-6);
    assert.ok(Math.abs(out[0]! - 0.6) < 1e-6);
    assert.ok(Math.abs(out[1]! - 0.8) < 1e-6);
  });

  it("passes through zero vector unchanged", () => {
    const out = l2Normalize([0, 0, 0]);
    assert.deepEqual(out, [0, 0, 0]);
  });
});
