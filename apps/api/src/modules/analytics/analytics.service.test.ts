import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AnalyticsService, sanitizeProperties } from './analytics.service';

test('keeps only allowlisted scalar analytics properties', () => {
  assert.deepEqual(
    sanitizeProperties('search', {
      queryLength: 4,
      resultCount: 12,
      query: 'sensitive text',
      nested: { secret: true },
      unsafeNumber: 1.5,
    }),
    { queryLength: 4, resultCount: 12 },
  );
});

test('writes an analytics event without accepting client user identity', async () => {
  const events: Array<Record<string, unknown>> = [];
  const service = new AnalyticsService({} as never);
  await service.record(
    {
      name: 'product_view',
      anonymousId: 'anon-1',
      sessionId: 'session-1',
      properties: { productId: 'product-1', email: 'secret@example.com' },
    },
    {
      userId: 'server-user-1',
      database: {
        analyticsEvent: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            events.push(data);
            return { id: 'event-1' };
          },
        },
      } as never,
    },
  );

  assert.deepEqual(events, [
    {
      name: 'product_view',
      anonymousId: 'anon-1',
      sessionId: 'session-1',
      userId: 'server-user-1',
      properties: { productId: 'product-1' },
    },
  ]);
});
