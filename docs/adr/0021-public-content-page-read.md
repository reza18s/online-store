# ADR-0021: Public published-content page read

Status: Accepted.

## Context

SEO metadata and redirects need a matching content read for policy, trust,
size-guide, and campaign pages. The `ContentPage` schema supports draft,
published, and archived records with ordered JSON blocks, but the API had no
public route that could safely serve those pages to a future SSR/hybrid
storefront.

## Decision

The content domain exposes `GET /v1/content/pages/:slug` for public content.
Slugs use the existing normalized Latin URL policy: lowercase ASCII letters,
digits, and single hyphens. The service trims and lowercases the route value,
rejects path-like or otherwise invalid slugs, and reads only records whose
status is `PUBLISHED`.

The response contains the stable slug, title, optional body, and blocks ordered
by `sortOrder` with an ID tie-breaker. Block payloads remain JSON because block
rendering is a frontend/content concern, but database IDs, lifecycle status,
timestamps, and other administrative fields are not exposed publicly. Missing
or non-published pages return the shared real `404` error envelope.

The page read and the SEO resolver remain separate contracts: an SSR caller may
resolve metadata first, then combine it with this published content read, and
must use the same public 404 behavior rather than rendering draft content.

The browser receives a page-agnostic adapter and TanStack Query hook in
`apps/web/src/features/content/content-api.ts`. Visual content-page work still
requires the design-before-code gate and a supplied page reference.

## Consequences

Editorial and trust content can be consumed without a client-only database
fetch, while draft and archived material stays private. Ordered block payloads
allow future block-specific rendering without changing this transport boundary.
The content editor/admin mutation boundary and SSR runtime remain follow-up
work; they must preserve this published-only rule.

## Rejected alternatives

- Returning drafts with a frontend visibility flag: rejected because public
  callers and crawlers must never receive unpublished content.
- Flattening all block payloads into HTML in the API: rejected because it would
  couple content storage to one renderer and make future block validation harder.
- Accepting arbitrary Unicode/path slugs immediately: rejected because the
  existing product/category admin boundaries use normalized Latin slugs and URL
  policy must remain consistent until an explicit migration decision.
