# ADR-0022: Admin content-page lifecycle

Status: Accepted.

## Context

The `ContentPage` schema and published-only public read now support policy,
trust, and campaign content, but editors still have no bounded application
boundary for creating, revising, publishing, or archiving those records. A
direct database editor would bypass role checks, audit history, publishability
rules, and concurrent-edit protection.

## Decision

The content domain owns the admin page lifecycle:

- `GET /v1/admin/content/pages` provides bounded pagination, status filtering,
  and slug/title/body search; `GET /v1/admin/content/pages/:pageId` returns the
  editable page and ordered block data.
- `POST /v1/admin/content/pages` creates a page as `DRAFT` regardless of
  client-supplied lifecycle intent. Slugs are normalized through the same
  lowercase Latin URL policy used by the public read, and the slug remains
  immutable after creation.
- `PATCH /v1/admin/content/pages/:pageId` updates title/body and, when
  supplied, replaces the complete ordered block set atomically. Block kinds
  are normalized, block counts/order are bounded, and payloads are validated as
  bounded JSON before persistence.
- `PATCH /v1/admin/content/pages/:pageId/status` permits only the explicit
  `DRAFT`, `PUBLISHED`, and `ARCHIVED` transition graph. Publishing requires a
  non-empty title plus body or at least one block; drafts and archived pages
  remain unavailable through the public route.
- Every mutation requires the `admin` staff role and writes a transactional
  audit event. Update and status mutations accept an optional
  `expectedUpdatedAt` guard and return a conflict when an older editor would
  overwrite a newer revision.

The service enforces the same authorization and validation rules as the HTTP
guards so non-controller callers cannot bypass the lifecycle contract. The
browser receives typed, page-agnostic list/detail/create/update/status helpers
in `apps/web/src/features/content/content-api.ts`; visual content-editor work
remains gated on a user-supplied page reference and the design-before-code
workflow.

## Consequences

Content changes have an explicit and auditable lifecycle, and public callers
can rely on the existing published-only read without receiving draft data.
Atomic block replacement keeps the editor model simple while preserving
ordered structured content. Optimistic concurrency makes multi-editor conflicts
visible instead of silently losing work. The API does not yet choose an SSR
renderer, block-specific frontend components, media workflow, or content
preview mode; those consumers must reuse this boundary and the published-only
rule.

## Rejected alternatives

- Allowing an admin create request to publish immediately: rejected because
  draft-first review is safer for public editorial content and keeps publishing
  an explicit auditable action.
- Updating individual blocks through an unbounded generic endpoint: rejected
  because the page is the ownership boundary and complete replacement gives a
  deterministic ordered document with fewer partial-write states.
- Letting support or operations staff publish content: rejected because a
  content publication changes public trust and indexing surfaces; the first
  lifecycle boundary is intentionally admin-only.
