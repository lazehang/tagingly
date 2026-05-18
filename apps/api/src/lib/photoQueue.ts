import { loadEnv } from "../env.js";

const queue: string[] = [];
const queued = new Set<string>();
let active = 0;
let shuttingDown = false;

function maxConcurrency(): number {
  return loadEnv().PHOTO_PROCESS_CONCURRENCY;
}

/** Process photos sequentially by default to avoid TF/canvas OOM on bulk reprocess. */
export function enqueuePhotoProcessing(photoId: string): void {
  if (shuttingDown || queued.has(photoId)) return;
  queued.add(photoId);
  queue.push(photoId);
  pump();
}

export function getPhotoQueueStats(): {
  queued: number;
  active: number;
  shuttingDown: boolean;
} {
  return { queued: queue.length, active, shuttingDown };
}

/** Wait for in-flight jobs during graceful shutdown (Railway SIGTERM). */
export function drainPhotoQueue(timeoutMs = 25_000): Promise<void> {
  shuttingDown = true;
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (active === 0 && queue.length === 0) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        console.warn(
          `photoQueue drain timeout (${active} active, ${queue.length} queued)`
        );
        resolve();
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  });
}

function pump(): void {
  if (shuttingDown) return;
  while (active < maxConcurrency() && queue.length > 0) {
    const photoId = queue.shift()!;
    active++;
    void runJob(photoId)
      .catch((e) => {
        console.error("photoQueue", photoId, e);
      })
      .finally(() => {
        queued.delete(photoId);
        active--;
        pump();
      });
  }
}

async function runJob(photoId: string): Promise<void> {
  const { processEventPhoto } = await import("./processPhoto.js");
  await processEventPhoto(photoId);
}
