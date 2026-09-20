import { apiClient, type AnalyticsEventInput } from '@nova/api-client';

const ANONYMOUS_ID_KEY = 'nova.analytics.anonymous-id.v1';
const SESSION_ID_KEY = 'nova.analytics.session-id.v1';

function createIdentifier(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function readOrCreate(storage: Storage, key: string): string | undefined {
  try {
    const existing = storage.getItem(key);
    if (existing && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(existing)) return existing;
    const next = createIdentifier();
    storage.setItem(key, next);
    return next;
  } catch {
    return undefined;
  }
}

export function analyticsContext(): Pick<AnalyticsEventInput, 'anonymousId' | 'sessionId'> {
  if (typeof window === 'undefined') return {};
  return {
    anonymousId: readOrCreate(window.localStorage, ANONYMOUS_ID_KEY),
    sessionId: readOrCreate(window.sessionStorage, SESSION_ID_KEY),
  };
}

export function trackAnalyticsEvent(
  event: Omit<AnalyticsEventInput, 'anonymousId' | 'sessionId'>,
): void {
  if (typeof window === 'undefined') return;
  void apiClient
    .postEnvelope<null>('/v1/analytics/events', { ...event, ...analyticsContext() })
    .catch(() => undefined);
}
