import { Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { DatabaseClient } from '@nova/db';
import type { AnalyticsEventInput } from '@nova/api-client';

import { DatabaseService } from '../../database/database.service';
import type { AnalyticsEventName } from './dto/track-analytics-event.dto';

const ALLOWED_PROPERTIES: Record<AnalyticsEventName, readonly string[]> = {
  product_view: ['productId', 'slug'],
  search: ['queryLength', 'resultCount'],
  add_to_cart: ['variantId', 'quantity'],
  checkout_started: ['itemCount'],
  purchase: ['status'],
  payment_failure: ['reasonCode'],
  provider_failure: ['provider', 'reasonCode'],
};

type AnalyticsDatabase = Pick<DatabaseClient, 'analyticsEvent'>;

function safeProperty(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string') return value.slice(0, 160);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value)) {
    return value;
  }
  return undefined;
}

function sanitizeProperties(
  name: AnalyticsEventName,
  properties: Record<string, unknown> | undefined,
): Prisma.InputJsonObject | undefined {
  if (!properties) return undefined;
  const allowed = new Set(ALLOWED_PROPERTIES[name]);
  const safe = Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => [key, safeProperty(value)] as const)
      .filter(
        (entry): entry is readonly [string, string | number | boolean] => entry[1] !== undefined,
      ),
  );
  return Object.keys(safe).length ? safe : undefined;
}

@Injectable()
export class AnalyticsService {
  public constructor(private readonly database: DatabaseService) {}

  public async record(
    input: AnalyticsEventInput,
    context: { userId?: string; database?: AnalyticsDatabase } = {},
  ): Promise<void> {
    const database = context.database ?? this.database.prisma;
    await database.analyticsEvent.create({
      data: {
        name: input.name,
        anonymousId: input.anonymousId,
        sessionId: input.sessionId,
        userId: context.userId,
        properties: sanitizeProperties(input.name, input.properties),
      },
      select: { id: true },
    });
  }
}

export { sanitizeProperties };
