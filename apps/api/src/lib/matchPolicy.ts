export type FaceMatchCandidate = {
  userId: string;
  certainty: number;
  /** How many of this user's selfie embeddings appeared in the vector search. */
  hitCount: number;
};

export type MatchThresholds = {
  minCertainty: number;
  minMargin: number;
  minCertaintySingleCandidate: number;
  minSelfieHits: number;
};

/** Whether a top-ranked candidate should be tagged for this detected face. */
export function acceptFaceMatch(
  ranked: FaceMatchCandidate[],
  thresholds: MatchThresholds
): FaceMatchCandidate | null {
  if (ranked.length === 0) return null;

  const top1 = ranked[0]!;
  const top2 = ranked[1];
  const margin = top2 ? top1.certainty - top2.certainty : 1;

  const strongEnough =
    top1.certainty >= thresholds.minCertainty &&
    (top1.hitCount >= thresholds.minSelfieHits ||
      top1.certainty >= thresholds.minCertaintySingleCandidate);

  const separated =
    !top2 ||
    margin >= thresholds.minMargin ||
    top1.certainty >= thresholds.minCertaintySingleCandidate;

  if (!strongEnough || !separated) return null;
  return top1;
}
