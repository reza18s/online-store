# ADR-0023: Contextual public catalog facets

## Status

Accepted.

## Context

The public catalog supports size, color, and material filters, but a fixed
client-side list becomes stale as products and variant data change. Facet
choices must follow the same effective route and query context as the product
listing, including category, audience, search text, price range, stock, sale,
and the other selected facets. Counts must be useful to customers without
revealing inventory internals or making the browser reconstruct catalog state.

## Decision

Expose `GET /v1/catalog/facets` as a public, read-only endpoint. It accepts the
catalog context filters `q`, `category`, `audience`, `size`, `color`,
`material`, `minPrice`, `maxPrice`, `inStock`, and `onSale`; pagination and sort
are intentionally excluded because facets describe the complete matching
catalog scope rather than the current page.

The response always contains the three stable groups `size`, `color`, and
`material`. Each option has this safe shape:

```text
{
  value,
  label,
  count,
  selected,
  hex // only for color options; null when unavailable
}
```

Only published, non-archived products and active variants contribute to the
facet data. Counts are distinct product counts, not variant or inventory
counts. Each group's candidate set excludes that group's own active filter
while retaining the other filters, matching the public product-listing
semantics. Stock filtering checks only whether an active variant has positive
available quantity; on-hand, reserved, and movement data are not returned.

Facet values use the existing Persian/Arabic normalization boundary for
matching and grouping. The database response is bounded to 40 options per
group, with a selected value retained even if it currently has no matching
products, so a stale URL remains representable in the controlled storefront
selectors. Color hex values are metadata only and do not affect grouping.

## Consequences

- The storefront can render current filter options through
  `useCatalogFacets` without duplicating catalog values in `app.tsx`.
- Product-count semantics stay consistent with the existing independent
  product-level size/color/material filters.
- Query keys include the effective facet context, so changing route or filter
  state cannot reuse an unrelated facet response.
- The public response remains bounded and does not expose inventory quantities,
  reservations, or inactive/draft catalog data.
- PostgreSQL execution remains an environment-dependent validation gate until
  a local database is available.

## Rejected alternatives

- Keeping hardcoded size, color, and material arrays in the browser would drift
  from admin-managed catalog data and hide newly added values.
- Counting only the current product page would make option counts unstable and
  would omit valid choices outside the current pagination window.
- Returning variant counts or inventory quantities would misrepresent the
  product-listing contract and expose operational data that the storefront
  does not need.
