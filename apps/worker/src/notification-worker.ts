import type { DatabaseClient, Prisma } from '@nova/db';

export interface NotificationJobRecord {
  id: string;
  kind: string;
  recipient: string;
  payload: unknown;
  attempts: number;
}

export interface NotificationSender {
  send(job: NotificationJobRecord): Promise<void>;
}

export interface NotificationBatchResult {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
}

export const NOTIFICATION_BATCH_LIMIT = 20;
export const NOTIFICATION_LEASE_MS = 5 * 60_000;
export const NOTIFICATION_MAX_ATTEMPTS = 8;

const notificationJobSelect = {
  id: true,
  kind: true,
  recipient: true,
  payload: true,
  attempts: true,
} satisfies Prisma.NotificationJobSelect;

function retryDelayMs(attempt: number): number {
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), 60 * 60_000);
}

function deliveryErrorCode(): string {
  // Provider errors can contain secrets or recipient data; keep the outbox diagnostic stable.
  return 'notification-delivery-failed';
}

export async function processNotificationBatch(
  database: DatabaseClient,
  sender: NotificationSender,
  now = new Date(),
  limit = NOTIFICATION_BATCH_LIMIT,
): Promise<NotificationBatchResult> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Notification batch limit is invalid.');
  }

  const candidates = await database.notificationJob.findMany({
    where: {
      OR: [
        { status: 'PENDING', availableAt: { lte: now } },
        { status: 'PROCESSING', availableAt: { lte: now } },
      ],
    },
    orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    take: limit,
    select: notificationJobSelect,
  });

  const result: NotificationBatchResult = { claimed: 0, sent: 0, retried: 0, failed: 0 };
  for (const candidate of candidates) {
    const leaseUntil = new Date(now.getTime() + NOTIFICATION_LEASE_MS);
    const claimed = await database.notificationJob.updateMany({
      where: {
        id: candidate.id,
        status: { in: ['PENDING', 'PROCESSING'] },
        availableAt: { lte: now },
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        availableAt: leaseUntil,
      },
    });
    if (claimed.count !== 1) continue;
    result.claimed += 1;

    const attemptNumber = candidate.attempts + 1;
    try {
      await sender.send(candidate);
      const completed = await database.notificationJob.updateMany({
        where: { id: candidate.id, status: 'PROCESSING' },
        data: {
          status: 'SENT',
          processedAt: now,
          availableAt: now,
          lastError: null,
        },
      });
      if (completed.count === 1) result.sent += 1;
    } catch {
      const terminal = attemptNumber >= NOTIFICATION_MAX_ATTEMPTS;
      const completed = await database.notificationJob.updateMany({
        where: { id: candidate.id, status: 'PROCESSING' },
        data: {
          status: terminal ? 'FAILED' : 'PENDING',
          availableAt: terminal
            ? now
            : new Date(now.getTime() + retryDelayMs(attemptNumber)),
          ...(terminal ? { processedAt: now } : {}),
          lastError: deliveryErrorCode(),
        },
      });
      if (completed.count === 1) {
        if (terminal) result.failed += 1;
        else result.retried += 1;
      }
    }
  }
  return result;
}

export class UnconfiguredNotificationSender implements NotificationSender {
  public async send(): Promise<void> {
    throw new Error('notification-provider-unconfigured');
  }
}

/** Marks local outbox jobs as delivered without contacting an external SMS provider. */
export class LocalNotificationSender implements NotificationSender {
  public async send(): Promise<void> {
    return undefined;
  }
}
