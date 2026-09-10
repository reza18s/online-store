# ADR-0020: SEO metadata and redirect boundaries

Status: Accepted.

## Context

The schema already contains `SeoMetadata` and `Redirect`, and the architecture
requires canonical metadata and intentional redirects before the public
storefront is production-ready. SSR, sitemap generation, and the customer-facing
catalog must consume one page-aware contract. There was no API boundary for
resolving metadata or for safely managing the records from the admin surface.

## Decision

The `apps/api/src/modules/content` domain owns SEO metadata and redirects.

Public callers use `GET /v1/seo/resolve?path=...`. The resolver accepts only a
site-relative path, normalizes one trailing slash, rejects query strings,
fragments, control characters, backslashes, and protocol-relative paths, and
returns:

- the normalized path;
- public metadata without database IDs or administrative timestamps;
- one redirect record, when configured, without exposing unrelated fields.

Missing metadata and redirects return `null` so an SSR caller can combine the
result with the authoritative catalog/content read and decide whether the page
is a real 404. The resolver does not invent product or category SEO data and
does not replace catalog truth.

Admin metadata and redirect management is restricted to the `admin` staff role:

- `GET /v1/admin/content/seo-metadata` and
  `GET /v1/admin/content/redirects` provide bounded, stable pagination and
  path/text search;
- metadata create/update/delete and redirect create/update/delete operations
  are explicit mutations;
- metadata updates support an optional `updatedAt` optimistic-concurrency
  guard, while a metadata path and redirect source path remain immutable;
- redirect destinations are site-relative, supported status codes are
  `301`, `302`, `307`, and `308`, and direct or bounded-chain redirect cycles
  are rejected;
- canonical URLs are either site-relative or same-origin URLs matching the
  configured public web origin, with credentials, query strings, and fragments
  rejected;
- structured data is validated as bounded JSON before persistence.

Successful admin mutations write an audit event in the same database
transaction. The browser receives typed transport/query/mutation helpers in
`apps/web/src/features/content/content-api.ts`; no visual page is wired until
the corresponding user-supplied page reference passes the design-before-code
gate.

## Consequences

SSR and future sitemap/metadata consumers have one safe lookup boundary, while
administrators can manage the existing schema records without direct database
access. Public responses remain small and do not expose internal record IDs or
audit-only fields. Relative-only redirect destinations remove an open-redirect
class from this boundary, and optimistic metadata updates prevent an older
admin form from silently overwriting newer content.

The actual SSR runtime, sitemap/robots generation, content-page rendering, and
catalog-derived structured data remain separate follow-up decisions. They must
reuse this boundary and the public catalog reads rather than creating a second
SEO-only source of truth.

## Rejected alternatives

- Returning arbitrary external redirect URLs: rejected because this API is for
  the NOVA public site and would create an avoidable open-redirect risk.
- Embedding SEO fields into every catalog response: rejected because metadata
  can apply to editorial and campaign paths and should not force a visual or
  catalog response shape to grow before SSR is selected.
- Letting support/operations staff mutate public SEO records: rejected because
  an accidental change affects indexing and public navigation; the first
  boundary is intentionally admin-only.
