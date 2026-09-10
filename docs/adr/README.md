# Architecture decision records

ADR-0020 documents the accepted public SEO resolver and admin content
metadata/redirect boundaries: [ADR-0020](0020-seo-metadata-and-redirects.md).

ADR-0021 documents the published-only public content page read:
[ADR-0021](0021-public-content-page-read.md).

ADR-0022 documents the admin content-page lifecycle, draft-first publishing,
and audited optimistic-concurrency mutations:
[ADR-0022](0022-admin-content-page-lifecycle.md).

ADR-0023 documents the contextual public catalog-facet contract and bounded
product-count response:
[ADR-0023](0023-catalog-facets.md).

Durable decisions live here. The current accepted decisions are [ADR-0001](0001-foundation.md) for the Phase 1 boundaries, [ADR-0005](0005-inventory-reservation-concurrency.md) for checkout-time inventory reservations, [ADR-0006](0006-checkout-transaction-boundaries.md) for quote/order/payment handoff boundaries, [ADR-0007](0007-staff-authentication-and-sessions.md) for staff credentials, MFA, roles, and admin sessions, [ADR-0008](0008-catalog-lifecycle-and-audit.md) for audited product status transitions, [ADR-0009](0009-payment-callbacks-and-reconciliation.md) for verified callbacks, reservation settlement, and late-payment refunds, [ADR-0010](0010-fulfillment-and-shipment-state.md) for paid-order fulfillment and shipment state transitions, [ADR-0011](0011-cancellation-and-returns.md) for customer cancellation, returns, and idempotent refund state, [ADR-0012](0012-admin-audit-read.md) for the admin-only audit-event read boundary, [ADR-0013](0013-admin-payment-inspection.md) for the admin-only payment-attempt and refund inspection boundary, [ADR-0014](0014-notification-outbox.md) for transactional notification intents and worker retry leasing, [ADR-0015](0015-coupon-redemption-lifecycle.md) for bounded coupon rules and order-time redemption reservations, [ADR-0016](0016-customer-support-lookup.md) for the bounded staff customer lookup boundary, [ADR-0017](0017-notification-inspection.md) for redacted operational notification delivery inspection, [ADR-0018](0018-cart-merge-conflict-contract.md) for explicit guest-cart merge conflicts, [ADR-0019](0019-catalog-search-suggestions.md) for the public catalog search-suggestion contract, [ADR-0020](0020-seo-metadata-and-redirects.md) for the public SEO resolver and admin metadata/redirect boundaries, [ADR-0021](0021-public-content-page-read.md) for the published-only content read, [ADR-0022](0022-admin-content-page-lifecycle.md) for the admin content lifecycle, and [ADR-0023](0023-catalog-facets.md) for contextual public catalog facets. Product, identity, payment-provider, and other decisions that are still open remain documented in [`arch.md`](../../arch.md).
