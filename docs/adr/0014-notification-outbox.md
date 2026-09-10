# ADR-0014: Transactional notification outbox

- Status: Accepted
- Date: 2026-09-09

## Context

Payment callbacks change durable order and payment state, but notification delivery is an external side effect. Sending an SMS or other notification directly from the callback path could lose the notification when the request fails after the database commit, or send duplicates when a provider callback is replayed. A real notification provider has not been selected yet, so the application also needs a safe boundary that does not pretend delivery is operational.

## Decision

NOVA uses a transactional notification outbox.

- `NotificationService` writes a `NotificationJob` in the same Prisma transaction as the payment state transition and order event.
- Every job has a bounded, unique `dedupeKey`. Payment events use the payment-attempt identity and event kind, so callback retries cannot create another job for the same event.
- `NotificationJob` stores only the delivery intent needed by a provider adapter: kind, recipient, bounded JSON payload, status, attempt count, availability time, processing completion time, and a stable diagnostic error code. Provider response bodies and secrets are not persisted.
- The worker claims pending or expired leased jobs with conditional updates, sends them through a `NotificationSender`, retries with exponential backoff up to one hour, and marks a job terminally failed after eight attempts. The conditional claim and dedupe key provide at-least-once processing with idempotent producer behavior.
- Until a real provider is selected and configured, `UnconfiguredNotificationSender` fails closed. This preserves the outbox and its observability without claiming that SMS/email delivery is available.

The schema change and legacy-row backfill live in `packages/db/prisma/migrations/0004_notification_outbox_dedupe`.

## Consequences

Payment callback requests remain bounded by database work and do not depend on provider availability. A notification can be retried independently after a transient provider failure, and a replayed callback remains harmless. The current worker can exercise the lifecycle but will intentionally fail delivery until a provider adapter, credentials, and operational worker scheduling are added. Notification administration and customer-facing notification UI remain separate follow-up work.

## Rejected alternatives

- Calling a provider inline from the payment callback would couple payment confirmation to external latency and make retries difficult to reason about.
- A non-unique job table would allow callback replay to duplicate customer notifications.
- Treating an unconfigured provider as a successful no-op would hide an operational gap and lose the delivery intent.
