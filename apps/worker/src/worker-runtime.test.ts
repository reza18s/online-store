import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { NotificationJobRecord, NotificationSender } from './notification-worker';
import type { WorkerInfoEvent, WorkerLogger, WorkerErrorEvent } from './observability';
import { NotificationWorkerRuntime } from './worker-runtime';

const NOW = new Date('2026-09-09T08:00:00.000Z');

interface RuntimeJob extends NotificationJobRecord {
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  availableAt: Date;
}

function createRuntimeDatabase(initial: RuntimeJob[] = []) {
  const jobs = initial.map((job) => ({ ...job }));
  let connected = 0;
  let disconnected = 0;
  const database = {
    $connect: async () => {
      connected += 1;
    },
    $disconnect: async () => {
      disconnected += 1;
    },
    notificationJob: {
      findMany: async () =>
        jobs.filter(
          (job) =>
            (job.status === 'PENDING' || job.status === 'PROCESSING') &&
            job.availableAt <= new Date(),
        ),
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        const job = jobs.find((candidate) => candidate.id === where.id);
        if (!job) return { count: 0 };
        const status = where.status as 'PENDING' | 'PROCESSING' | { in: string[] } | undefined;
        const statusMatches =
          status === undefined ||
          (typeof status === 'object' && 'in' in status
            ? status.in.includes(job.status)
            : job.status === status);
        const availableAt = where.availableAt as { lte: Date } | undefined;
        if (!statusMatches || (availableAt && job.availableAt > availableAt.lte))
          return { count: 0 };
        job.status = data.status as RuntimeJob['status'];
        if (data.availableAt instanceof Date) job.availableAt = data.availableAt;
        return { count: 1 };
      },
    },
  };
  return {
    database: database as never,
    jobs,
    disconnect: async () => {
      disconnected += 1;
    },
    getConnected: () => connected,
    getDisconnected: () => disconnected,
  };
}

function createLogger() {
  const info: WorkerInfoEvent[] = [];
  const errors: WorkerErrorEvent[] = [];
  const logger: WorkerLogger = {
    info: (event) => info.push(event),
    error: (event) => errors.push(event),
  };
  return { logger, info, errors };
}

function job(): RuntimeJob {
  return {
    id: 'job-1',
    kind: 'PAYMENT_SUCCEEDED',
    recipient: '+989121234567',
    payload: { orderNumber: 'NV-100' },
    attempts: 0,
    status: 'PENDING',
    availableAt: NOW,
  };
}

test('suppresses overlapping ticks and waits for the active tick before disconnecting', async () => {
  const fixture = createRuntimeDatabase([job()]);
  const logs = createLogger();
  let releaseDelivery!: () => void;
  let deliveryStarted!: () => void;
  const deliveryStartedPromise = new Promise<void>((resolve) => {
    deliveryStarted = resolve;
  });
  const deliveryHeld = new Promise<void>((resolve) => {
    releaseDelivery = resolve;
  });
  let deliveries = 0;
  const sender: NotificationSender = {
    send: async () => {
      deliveries += 1;
      deliveryStarted();
      await deliveryHeld;
    },
  };
  const runtime = new NotificationWorkerRuntime({
    database: fixture.database,
    sender,
    environment: 'test',
    logger: logs.logger,
  });

  const firstTick = runtime.tick();
  await deliveryStartedPromise;
  await runtime.tick();
  const shutdown = runtime.shutdown('SIGTERM');
  assert.equal(fixture.getDisconnected(), 0);
  releaseDelivery();
  await firstTick;
  await shutdown;
  await runtime.shutdown('SIGINT');

  assert.equal(deliveries, 1);
  assert.equal(fixture.getDisconnected(), 1);
  assert.deepEqual(logs.info, [
    { event: 'notification_batch', claimed: 1, sent: 1, retried: 0, failed: 0 },
    { event: 'worker_shutdown', signal: 'SIGTERM', disconnect: 'ok' },
  ]);
});

test('turns tick failures into fixed secret-free error events', async () => {
  const logs = createLogger();
  const database = {
    notificationJob: {
      findMany: async () => {
        throw new Error('postgresql://user:password@example.test/nova recipient=+989121234567');
      },
    },
  } as never;
  const runtime = new NotificationWorkerRuntime({
    database,
    sender: { send: async () => {} },
    environment: 'test',
    logger: logs.logger,
  });

  await runtime.tick();

  assert.deepEqual(logs.errors, [
    { event: 'notification_tick_failed', errorCode: 'notification-tick-failed' },
  ]);
  assert.doesNotMatch(JSON.stringify(logs), /password|989121234567|postgresql/);
});

test('startup failure disconnects once and stays secret-free across repeated shutdown', async () => {
  const fixture = createRuntimeDatabase();
  const logs = createLogger();
  const database = {
    $connect: async () => {
      throw new Error('DATABASE_URL=postgresql://user:password@example.test/nova');
    },
    $disconnect: fixture.disconnect,
  } as never;
  const runtime = new NotificationWorkerRuntime({
    database,
    sender: { send: async () => {} },
    environment: 'test',
    logger: logs.logger,
  });

  await assert.rejects(runtime.start(), { message: 'worker-start-failed' });
  await runtime.shutdown('SIGTERM');

  assert.equal(fixture.getDisconnected(), 1);
  assert.deepEqual(logs.errors, [
    { event: 'worker_start_failed', errorCode: 'worker-start-failed' },
  ]);
  assert.deepEqual(logs.info, [
    { event: 'worker_shutdown', signal: 'startup-failure', disconnect: 'ok' },
  ]);
  assert.doesNotMatch(JSON.stringify(logs), /password|DATABASE_URL|postgresql/);
});

test('starts with one immediate batch, schedules future ticks, and shares shutdown work', async () => {
  const fixture = createRuntimeDatabase([job()]);
  const logs = createLogger();
  let scheduledTick: (() => void) | undefined;
  let clearedTimers = 0;
  const runtime = new NotificationWorkerRuntime({
    database: fixture.database,
    sender: { send: async () => {} },
    environment: 'test',
    logger: logs.logger,
    setIntervalFn: (callback) => {
      scheduledTick = callback;
      return {} as ReturnType<typeof setInterval>;
    },
    clearIntervalFn: () => {
      clearedTimers += 1;
    },
  });

  await runtime.start();

  assert.equal(fixture.getConnected(), 1);
  assert.ok(scheduledTick);
  assert.deepEqual(logs.info, [
    { event: 'notification_batch', claimed: 1, sent: 1, retried: 0, failed: 0 },
    { event: 'worker_started', environment: 'test' },
  ]);

  const firstShutdown = runtime.shutdown('SIGINT');
  const secondShutdown = runtime.shutdown('SIGTERM');
  assert.strictEqual(firstShutdown, secondShutdown);
  await firstShutdown;

  assert.equal(clearedTimers, 1);
  assert.equal(fixture.getDisconnected(), 1);
  assert.deepEqual(logs.info.at(-1), {
    event: 'worker_shutdown',
    signal: 'SIGINT',
    disconnect: 'ok',
  });
});

test('reports disconnect failures with a fixed error and still completes shutdown', async () => {
  const logs = createLogger();
  const database = {
    $disconnect: async () => {
      throw new Error('DATABASE_URL=postgresql://user:password@example.test/nova');
    },
  } as never;
  const runtime = new NotificationWorkerRuntime({
    database,
    sender: { send: async () => {} },
    environment: 'test',
    logger: logs.logger,
  });

  await runtime.shutdown('SIGTERM');

  assert.deepEqual(logs.errors, [
    { event: 'worker_shutdown_failed', errorCode: 'database-disconnect-failed' },
  ]);
  assert.deepEqual(logs.info, [
    { event: 'worker_shutdown', signal: 'SIGTERM', disconnect: 'failed' },
  ]);
  assert.doesNotMatch(JSON.stringify(logs), /password|DATABASE_URL|postgresql/);
});
