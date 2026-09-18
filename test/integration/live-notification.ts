import { randomUUID } from 'node:crypto';

import {
  processNotificationBatch,
  UnconfiguredNotificationSender,
} from '../../apps/worker/src/notification-worker';
import { DatabaseClient, type Prisma } from '../../packages/db/src/client';

const DISPOSABLE_DATABASE_PREFIX = 'nova_worker_validation_';
const DISPOSABLE_DATABASE_NAME_PATTERN = /^nova_worker_validation_[a-z0-9-]+$/;
const NOTIFICATION_DELIVERY_ERROR = 'notification-delivery-failed';

interface DatabaseTarget {
  databaseName: string;
  host: 'loopback';
  protocol: 'postgresql';
}

interface PersistedEvidence {
  availableAtLater: boolean;
  attempts: number;
  lastError: string | null;
  matchingRows: number;
  processedAt: null;
  status: 'PENDING';
}

interface CleanupEvidence {
  deletedRows: number;
  remainingRows: number;
}

interface NotificationEvidence {
  cleanup: CleanupEvidence;
  databaseTarget: DatabaseTarget;
  persisted: PersistedEvidence;
  tick: {
    claimed: number;
    failed: number;
    retried: number;
    sent: number;
  };
}

function scopedNotificationDatabase(database: DatabaseClient, jobId: string): DatabaseClient {
  const notificationJob = {
    findMany: (args: Prisma.NotificationJobFindManyArgs) =>
      database.notificationJob.findMany({
        ...args,
        where: { AND: [args.where ?? {}, { id: jobId }] },
      }),
    updateMany: (args: Prisma.NotificationJobUpdateManyArgs) =>
      database.notificationJob.updateMany(args),
  };

  // Keep the real worker implementation and database updates, but scope candidate discovery to
  // the synthetic row so an unexpected writer can never make this harness claim another job.
  return { notificationJob } as unknown as DatabaseClient;
}

class HarnessFailure extends Error {
  public constructor(public readonly code: string) {
    super(code);
  }
}

function fail(code: string): never {
  throw new HarnessFailure(code);
}

function failureCode(error: unknown, fallback: string): string {
  return error instanceof HarnessFailure ? error.code : fallback;
}

function assertCondition(condition: unknown, code: string): asserts condition {
  if (!condition) fail(code);
}

function parseDatabaseTarget(databaseUrl: string): DatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    fail('notification-database-url-invalid');
  }

  assertCondition(
    parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:',
    'notification-database-url-not-postgresql',
  );

  const hostname = parsed.hostname.toLowerCase();
  assertCondition(
    hostname === '127.0.0.1' || hostname === 'localhost',
    'notification-database-url-not-loopback',
  );
  assertCondition(!parsed.hash, 'notification-database-url-fragment');
  const targetOverrideParameters = new Set([
    'database',
    'dbname',
    'host',
    'hostaddr',
    'port',
    'service',
  ]);
  assertCondition(
    [...parsed.searchParams.keys()].every(
      (parameter) => !targetOverrideParameters.has(parameter.toLowerCase()),
    ),
    'notification-database-url-target-override',
  );

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    fail('notification-database-name-invalid');
  }
  assertCondition(
    databaseName.startsWith(DISPOSABLE_DATABASE_PREFIX) &&
      DISPOSABLE_DATABASE_NAME_PATTERN.test(databaseName),
    'notification-database-url-not-disposable',
  );

  return {
    databaseName: 'disposable validation database',
    host: 'loopback',
    protocol: 'postgresql',
  };
}

function dueNotificationWhere(now: Date) {
  return {
    OR: [
      { status: 'PENDING' as const, availableAt: { lte: now } },
      { status: 'PROCESSING' as const, availableAt: { lte: now } },
    ],
  };
}

async function main(): Promise<void> {
  const syntheticJobId = `live-notification-${randomUUID()}`;
  const marker = `live-notification:${syntheticJobId}`;
  const now = new Date();
  let database: DatabaseClient | null = null;
  let identityUniquenessEstablished = false;
  let syntheticJobCreated = false;
  let primaryFailure: string | null = null;
  let cleanupFailure: string | null = null;
  let disconnectFailure: string | null = null;
  let evidence: NotificationEvidence | null = null;
  let cleanup: CleanupEvidence | null = null;

  try {
    const databaseUrl = process.env.NOVA_NOTIFICATION_DATABASE_URL?.trim();
    assertCondition(databaseUrl, 'notification-database-url-missing');
    const databaseTarget = parseDatabaseTarget(databaseUrl);

    database = new DatabaseClient({ connectionString: databaseUrl });
    await database.$connect();

    const dueBeforeCreate = await database.notificationJob.count({
      where: dueNotificationWhere(now),
    });
    assertCondition(dueBeforeCreate === 0, 'notification-database-has-due-jobs');

    const [existingJob, existingMarker] = await Promise.all([
      database.notificationJob.findUnique({
        where: { id: syntheticJobId },
        select: { id: true },
      }),
      database.notificationJob.findUnique({
        where: { dedupeKey: marker },
        select: { id: true },
      }),
    ]);
    assertCondition(!existingJob && !existingMarker, 'notification-marker-already-exists');
    identityUniquenessEstablished = true;

    const jobsBeforeCreate = await database.notificationJob.count();
    assertCondition(jobsBeforeCreate === 0, 'notification-database-not-empty');

    await database.notificationJob.create({
      data: {
        id: syntheticJobId,
        dedupeKey: marker,
        kind: 'live-notification-validation',
        recipient: 'synthetic-live-notification-recipient',
        payload: { harness: 'live-notification' },
        status: 'PENDING',
        attempts: 0,
        availableAt: now,
        createdAt: now,
      },
    });
    syntheticJobCreated = true;

    const jobsAfterCreate = await database.notificationJob.count();
    assertCondition(jobsAfterCreate === 1, 'notification-database-gained-unrelated-job');

    const tick = await processNotificationBatch(
      scopedNotificationDatabase(database, syntheticJobId),
      new UnconfiguredNotificationSender(),
      now,
      1,
    );
    assertCondition(
      tick.claimed === 1 && tick.sent === 0 && tick.retried === 1 && tick.failed === 0,
      'notification-tick-result-unexpected',
    );

    const persisted = await database.notificationJob.findUnique({
      where: { id: syntheticJobId },
      select: {
        dedupeKey: true,
        attempts: true,
        availableAt: true,
        lastError: true,
        processedAt: true,
        status: true,
      },
    });
    assertCondition(persisted, 'notification-job-missing-after-tick');
    assertCondition(
      persisted.dedupeKey === marker &&
        persisted.status === 'PENDING' &&
        persisted.attempts === 1 &&
        persisted.lastError === NOTIFICATION_DELIVERY_ERROR &&
        persisted.processedAt === null &&
        persisted.availableAt.getTime() > now.getTime(),
      'notification-job-persistence-unexpected',
    );

    evidence = {
      cleanup: { deletedRows: 0, remainingRows: 0 },
      databaseTarget,
      persisted: {
        availableAtLater: persisted.availableAt.getTime() > now.getTime(),
        attempts: persisted.attempts,
        lastError: persisted.lastError,
        matchingRows: 1,
        processedAt: null,
        status: 'PENDING',
      },
      tick,
    };
  } catch (error) {
    primaryFailure = failureCode(error, 'notification-primary-operation-failed');
  } finally {
    if (database) {
      const cleanupErrors: string[] = [];
      let deletedRows = 0;
      let remainingRows = -1;

      if (identityUniquenessEstablished) {
        try {
          const deleted = await database.notificationJob.deleteMany({
            where: { id: syntheticJobId, dedupeKey: marker },
          });
          deletedRows = deleted.count;
          if (syntheticJobCreated && deletedRows !== 1) {
            cleanupErrors.push('delete-count-unexpected');
          }
        } catch {
          cleanupErrors.push('delete-failed');
        }
      }

      try {
        remainingRows = await database.notificationJob.count({
          where: { id: syntheticJobId, dedupeKey: marker },
        });
        if (remainingRows !== 0) cleanupErrors.push('rows-remain');
      } catch {
        cleanupErrors.push('verify-failed');
      }

      if (cleanupErrors.length) {
        cleanupFailure = `notification-cleanup-${cleanupErrors.join('-')}`;
      } else {
        cleanup = { deletedRows, remainingRows };
      }

      try {
        await database.$disconnect();
      } catch {
        disconnectFailure = 'notification-disconnect-failed';
      }
    } else {
      cleanupFailure = 'notification-cleanup-not-run-no-client';
      disconnectFailure = 'notification-disconnect-not-run-no-client';
    }
  }

  if (evidence && cleanup) {
    evidence.cleanup = cleanup;
  }

  if (primaryFailure || cleanupFailure || disconnectFailure || !evidence || !cleanup) {
    const details = [
      `primary=${primaryFailure ?? 'none'}`,
      `cleanup=${cleanupFailure ?? 'none'}`,
      `disconnect=${disconnectFailure ?? 'none'}`,
      !evidence ? 'evidence=missing' : null,
      !cleanup ? 'cleanup-evidence=missing' : null,
    ].filter((detail): detail is string => detail !== null);
    fail(details.join(';'));
  }

  console.log(JSON.stringify(evidence));
}

await main().catch((error: unknown) => {
  const code = error instanceof HarnessFailure ? error.code : 'notification-harness-failed';
  console.error(`[FAIL] live notification: ${code}`);
  process.exitCode = 1;
});
