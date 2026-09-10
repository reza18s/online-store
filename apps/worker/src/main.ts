import { environment } from '@nova/config';
import { DatabaseClient } from '@nova/db';

import {
  processNotificationBatch,
  UnconfiguredNotificationSender,
} from './notification-worker';

const database = new DatabaseClient();
const sender = new UnconfiguredNotificationSender();
let timer: ReturnType<typeof setInterval> | undefined;
let tickInFlight = false;
let shuttingDown = false;

async function tick(): Promise<void> {
  if (tickInFlight || shuttingDown) return;
  tickInFlight = true;
  try {
    const result = await processNotificationBatch(database, sender);
    if (result.claimed > 0) {
      console.info(
        `[nova-worker] notification batch claimed=${result.claimed} sent=${result.sent} retried=${result.retried} failed=${result.failed}`,
      );
    }
  } finally {
    tickInFlight = false;
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  if (timer) clearInterval(timer);
  await database.$disconnect();
  console.info(`[nova-worker] received ${signal}; shutting down.`);
  process.exitCode = 0;
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

async function main(): Promise<void> {
  await database.$connect();
  await tick();
  timer = setInterval(() => void tick(), 5_000);
  console.info(`[nova-worker] notification outbox active in ${environment.NODE_ENV} mode.`);
}

void main().catch(async (error: unknown) => {
  console.error('[nova-worker] failed to start notification outbox.', error instanceof Error ? error.message : 'unknown-error');
  await database.$disconnect();
  process.exitCode = 1;
});
