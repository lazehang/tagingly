import { v5 as uuidv5 } from "uuid";
import { l2Normalize } from "./faceVectors.js";
import { loadEnv } from "../env.js";

const FACE_CLASS = "FaceEmbedding";
const NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

type WeaviateGraphQLResponse = {
  data?: {
    Get?: Record<
      string,
      Array<{
        userId?: string;
        _additional?: { id?: string; certainty?: number; distance?: number };
      }>
    >;
    Aggregate?: unknown;
  };
  errors?: Array<{ message: string }>;
};

function headers(): Record<string, string> {
  const env = loadEnv();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (env.WEAVIATE_API_KEY) {
    h["Authorization"] = `Bearer ${env.WEAVIATE_API_KEY}`;
  }
  return h;
}

async function gql(query: string): Promise<WeaviateGraphQLResponse> {
  const env = loadEnv();
  const res = await fetch(`${env.WEAVIATE_URL}/v1/graphql`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Weaviate HTTP ${res.status}: ${t}`);
  }
  return (await res.json()) as WeaviateGraphQLResponse;
}

export async function ensureWeaviateSchema(): Promise<void> {
  const env = loadEnv();
  const schemaRes = await fetch(`${env.WEAVIATE_URL}/v1/schema`, {
    headers: headers(),
  });
  if (!schemaRes.ok) {
    throw new Error(`Weaviate schema list failed: ${await schemaRes.text()}`);
  }
  const schema = (await schemaRes.json()) as {
    classes?: Array<{ class: string }>;
  };
  const exists = schema.classes?.some((c) => c.class === FACE_CLASS);
  if (exists) return;

  const create = await fetch(`${env.WEAVIATE_URL}/v1/schema`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      class: FACE_CLASS,
      vectorizer: "none",
      properties: [
        { name: "userId", dataType: ["text"] },
        { name: "eventId", dataType: ["text"] },
        { name: "source", dataType: ["text"] },
        { name: "photoId", dataType: ["text"] },
        { name: "faceIndex", dataType: ["int"] },
      ],
    }),
  });
  if (!create.ok) {
    throw new Error(`Weaviate create class: ${await create.text()}`);
  }
}

export async function addSelfieEmbedding(args: {
  userId: string;
  eventId: string;
  selfieKey: string;
  vector: number[];
}): Promise<void> {
  const env = loadEnv();
  const id = uuidv5(`${args.userId}-${args.selfieKey}`, NAMESPACE);

  const vector = l2Normalize(args.vector);
  const res = await fetch(`${env.WEAVIATE_URL}/v1/objects`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      id,
      class: FACE_CLASS,
      properties: {
        userId: args.userId,
        eventId: args.eventId,
        source: "selfie",
        photoId: args.selfieKey,
        faceIndex: 0,
      },
      vector,
    }),
  });
  if (!res.ok) {
    throw new Error(`Weaviate insert: ${await res.text()}`);
  }
}

export async function deleteSelfieEmbeddingByKey(
  userId: string,
  selfieKey: string
): Promise<void> {
  const id = uuidv5(`${userId}-${selfieKey}`, NAMESPACE);
  const env = loadEnv();
  await fetch(
    `${env.WEAVIATE_URL}/v1/objects/${id}?class=${FACE_CLASS}`,
    { method: "DELETE", headers: headers() }
  );
}

export async function deleteSelfieEmbeddings(userId: string): Promise<void> {
  const q = `{
    Get {
      ${FACE_CLASS}(
        where: {
          operator: And,
          operands: [
            { path: ["userId"], operator: Equal, valueText: "${userId}" },
            { path: ["source"], operator: Equal, valueText: "selfie" }
          ]
        }
      ) {
        _additional { id }
      }
    }
  }`;
  const data = await gql(q);
  const rows = data.data?.Get?.[FACE_CLASS] ?? [];
  const env = loadEnv();
  for (const row of rows) {
    const wid = row._additional?.id;
    if (!wid) continue;
    await fetch(
      `${env.WEAVIATE_URL}/v1/objects/${wid}?class=${FACE_CLASS}`,
      {
        method: "DELETE",
        headers: headers(),
      }
    );
  }
}

export type AggregatedFaceMatch = {
  userId: string;
  certainty: number;
  hitCount: number;
};

/** Best match per user (max certainty across their selfie embeddings). */
export async function matchUsersByFace(args: {
  vector: number[];
  eventId: string;
  limit?: number;
  minCertainty?: number;
}): Promise<AggregatedFaceMatch[]> {
  const limit = args.limit ?? 32;
  const minCertainty = args.minCertainty ?? 0.55;
  const vectorJson = JSON.stringify(l2Normalize(args.vector));
  const q = `{
    Get {
      ${FACE_CLASS}(
        nearVector: {
          vector: ${vectorJson}
          certainty: ${minCertainty}
        }
        where: {
          operator: And,
          operands: [
            { path: ["eventId"], operator: Equal, valueText: "${args.eventId}" },
            { path: ["source"], operator: Equal, valueText: "selfie" }
          ]
        }
        limit: ${limit}
      ) {
        userId
        _additional { certainty distance }
      }
    }
  }`;
  const data = await gql(q);
  if (data.errors?.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
  }
  const rows = data.data?.Get?.[FACE_CLASS] ?? [];
  const byUser = new Map<string, AggregatedFaceMatch>();
  for (const r of rows) {
    const uid = r.userId;
    const certainty = r._additional?.certainty;
    if (!uid || typeof certainty !== "number") continue;
    const prev = byUser.get(uid);
    if (!prev) {
      byUser.set(uid, { userId: uid, certainty, hitCount: 1 });
    } else {
      byUser.set(uid, {
        userId: uid,
        certainty: Math.max(prev.certainty, certainty),
        hitCount: prev.hitCount + 1,
      });
    }
  }
  return [...byUser.values()].sort((a, b) => b.certainty - a.certainty);
}
