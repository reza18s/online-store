import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@nova/db';

import { NotificationService } from './notification.service';

function createService() {
  const jobs: Array<Record<string, unknown>> = [];
  const prisma = {
    notificationJob: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (jobs.some((job) => job.dedupeKey === data.dedupeKey)) {
          throw new Prisma.PrismaClientKnownRequestError('duplicate notification', {
            code: 'P2002',
            clientVersion: '7.10.0',
          });
        }
        jobs.push(data);
        return { id: `job-${jobs.length}` };
      },
    },
  };
  return { service: new NotificationService({ prisma } as never), jobs };
}

test('enqueues payment notifications with an idempotent dedupe key', async () => {
  const fixture = createService();
  const input = {
    kind: 'PAYMENT_SUCCEEDED' as const,
    paymentAttemptId: 'attempt-1',
    orderId: 'order-1',
    orderNumber: 'NV-100',
    recipient: '+989121234567',
    amountToman: 289_000,
  };

  await fixture.service.enqueuePaymentEvent(input);
  await fixture.service.enqueuePaymentEvent(input);

  assert.equal(fixture.jobs.length, 1);
  assert.equal(fixture.jobs[0]?.dedupeKey, 'payment:payment_succeeded:attempt-1');
  assert.deepEqual(fixture.jobs[0]?.payload, {
    orderId: 'order-1',
    orderNumber: 'NV-100',
    amountToman: 289_000,
    currency: 'TOMAN',
  });
});

test('rejects invalid notification identifiers before persistence', async () => {
  const fixture = createService();
  await assert.rejects(
    fixture.service.enqueue({
      kind: 'payment succeeded',
      recipient: '+989121234567',
      dedupeKey: 'payment:success:attempt-1',
      payload: { orderNumber: 'NV-100' },
    }),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(fixture.jobs.length, 0);
});
