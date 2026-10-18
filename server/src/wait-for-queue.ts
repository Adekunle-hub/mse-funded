import { setTimeout as sleep } from 'node:timers/promises';

import type { Queue } from 'bullmq';

export async function waitForQueue(queue: Queue, minutes: number): Promise<string> {
  const stopAt = Date.now() + minutes * 60_000;
  for (;;) {
    if ((await queue.getWaitingCount()) + (await queue.getActiveCount()) + (await queue.getDelayedCount()) === 0) return 'finished';
    if (await queue.isPaused()) return 'paused';
    if (Date.now() > stopAt) return `stopped after ${minutes} minutes, the rest waits for the next run`;
    await sleep(2_000);
  }
}
