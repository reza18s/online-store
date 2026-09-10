# ADR-0019: Public catalog search suggestions

## Status

Accepted.

## Context

The catalog search page already supports paginated product results with Persian
normalization and PostgreSQL full-text/trigram matching. The search surface also
needs a small, fast result set while the customer is typing. Suggestions must
not leak draft or archived catalog data, and category matches need the same
normalization behavior as product matches.

## Decision

Expose `GET /v1/search/suggestions?q=<query>&limit=<limit>` as a public,
read-only endpoint. The query uses the catalog normalization rules for Arabic
and Persian characters, digits, punctuation, whitespace, zero-width characters,
and case. A blank normalized query returns an empty array without a database
read.

The response is a flat array of typed suggestions with this safe shape:

```text
{
  type: PRODUCT | CATEGORY,
  id,
  slug,
  label,
  imageUrl,
  imageAlt
}
```

Only published, non-archived products are eligible. Product matches use the
normalized product search text, title/slug, and active variant SKUs, with
prefix, substring, full-text, and trigram ranking. Only non-archived categories
that contain at least one published, non-archived product are eligible;
category names and slugs use the same bounded matching rules. Product media is
limited to the primary `PRODUCT` image and category image fields are null.

The request defaults to eight results and accepts at most ten. Each result type
is ranked in a bounded database candidate set, then the combined response is
ordered with category matches first and deterministic score/label/id tie
breakers. Recent searches and popularity remain client/analytics concerns and
are not persisted by this endpoint.

## Consequences

- The future search overlay can render category and product groups from one
  typed transport contract without requesting full product pages.
- Draft, archived, and inactive-variant SKU data cannot appear in public
  suggestions.
- The endpoint remains bounded and uses the existing search extension and
  normalization boundary; checkout and product-result search remain separate
  authorities.
- Visual implementation remains gated on a supplied search-page reference,
  including empty, loading, no-result, error, and mobile states.

## Rejected alternatives

- Returning full `ProductSummary` objects would inflate keystroke requests and
  expose catalog detail that the search overlay does not need.
- Reading all categories and ranking in application memory would bypass the
  database's bounded matching and become less predictable as the catalog grows.
- Persisting recent or popular queries in the public endpoint would mix
  per-device UX and analytics policy into the catalog read contract.
