# ADR-0017: Redacted notification delivery inspection

- Status: Accepted
- Date: 2026-09-09

## Context

The notification outbox needs an operational read path so staff can distinguish
pending, processing, sent, and terminally failed delivery jobs. A raw job row
also contains the recipient, dedupe key, and provider payload, which may contain
personal or payment-related data and is not required to monitor delivery.

## Decision

Only `operations` and `admin` staff can read the paginated
`GET /v1/admin/notifications` endpoint. It supports exact notification-kind
and status filters, bounded pagination, and stable newest-first ordering.

The response contains job id, kind, lifecycle status, attempt count, scheduling
timestamps, processed timestamp, the stable internal failure code, and creation
timestamp. It never returns the recipient, payload, dedupe key, or provider
secrets. The browser receives a page-agnostic query adapter; visual wiring waits
for a supplied page reference.

## Consequences

Operations can monitor delivery health and retry progression without direct
database access or exposure to message content. Support staff do not receive a
notification job view by default. If future support workflows need notification
details, they must define a separate least-privilege field and audit boundary.

## Rejected alternatives

- Returning the full job row would expose recipient and payload data unrelated to delivery state.
- Allowing support to inspect all jobs would widen personal-data access without a demonstrated support need.
- Adding a manual retry mutation would compete with the worker's lease/retry contract before provider operations are defined.
