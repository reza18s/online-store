import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  NOTIFICATION_MAX_ATTEMPTS,
  processNotificationBatch,
  type NotificationJobRecord,
  type NotificationSender,
} from './notification-worker';

interface FakeJob extends NotificationJobRecord {
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  availableAt: Date;
  createdAt: Date;
  processedAt: Date | null;
  lastError: string | null;
}

function createDatabase(initial: FakeJob[]) {
  const jobs = initial.map((job) => ({ ...job }));
  const database = {
    notificationJob: {
      findMany: async ({ take, select }: { take: number; select: unknown }) => {
        void select;
        return jobs
          .filter(
            (job) =>
              (job.status === 'PENDING' || job.status === 'PROCESSING') &&
              job.availableAt <= NOW,
          )
          .sort((left, right) => left.availableAt.getTime() - right.availableAt.getTime())
          .slice(0, take);
      },
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const job = jobs.find((candidate) => candidate.id === where.id);
        if (!job) return { count: 0 };
        const status = where.status as 'PENDING' | 'PROCESSING' | { in: string[] } | undefined;
        const statusMatches =
          status === undefined ||
          (typeof status === 'object' && 'in' in status
            ? status.in.includes(job.status)
            : job.status === status);
        if (!statusMatches) return { count: 0 };
        const availableAt = where.availableAt as { lte: Date } | undefined;
        if (availableAt && job.availableAt > availableAt.lte) return { count: 0 };
        job.status = data.status as FakeJob['status'];
        if (data.attempts && typeof data.attempts === 'object') {
          job.attempts += Number((data.attempts as { increment: number }).increment);
        }
        if (data.availableAt instanceof Date) job.availableAt = data.availableAt;
        if ('processedAt' in data) job.processedAt = (data.processedAt as Date) ?? null;
        if ('lastError' in data) job.lastError = (data.lastError as string) ?? null;
        return { count: 1 };
      },
    },
  };
  return { database: database as never, jobs };
}

const NOW = new Date('2026-09-09T08:00:00.000Z');

function job(overrides: Partial<FakeJob> = {}): FakeJob {
  return {
    id: 'job-1',
    kind: 'PAYMENT_SUCCEEDED',
    recipient: '+989121234567',
    payload: { orderNumber: 'NV-100' },
    attempts: 0,
    status: 'PENDING',
    availableAt: NOW,
    createdAt: NOW,
    processedAt: null,
    lastError: null,
    ...overrides,
  };
}

test('claims and marks a notification job sent once', async () => {
  const fixture = createDatabase([job()]);
  const delivered: string[] = [];
  const sender: NotificationSender = {
    send: async (candidate) => {
      delivered.push(candidate.id);
    },
  };

  const result = await processNotificationBatch(fixture.database, sender, NOW);

  assert.deepEqual(result, { claimed: 1, sent: 1, retried: 0, failed: 0 });
  assert.deepEqual(delivered, ['job-1']);
  assert.equal(fixture.jobs[0]?.status, 'SENT');
  assert.equal(fixture.jobs[0]?.attempts, 1);
});

test('retries provider failures and terminally fails after the attempt limit', async () => {
  const fixture = createDatabase([job({ attempts: NOTIFICATION_MAX_ATTEMPTS - 1 })]);
  const sender: NotificationSender = {
    send: async () => {
      throw new Error('provider response must not be persisted');
    },
  };

  const result = await processNotificationBatch(fixture.database, sender, NOW);

  assert.deepEqual(result, { claimed: 1, sent: 0, retried: 0, failed: 1 });
  assert.equal(fixture.jobs[0]?.status, 'FAILED');
  assert.equal(fixture.jobs[0]?.lastError, 'notification-delivery-failed');
});
