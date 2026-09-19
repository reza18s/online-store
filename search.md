# Product Research

> Last researched: 2026-09-18

## 1. Research Scope

This research evaluates NOVA Store against mature fashion-commerce experiences,
headless commerce platforms, open-source commerce repositories, and primary
technical guidance. The goal is to improve launch decisions, not to select a
replacement platform or copy a competitor.

Research questions:

- Is the current modular-monolith architecture appropriate for an Iran-first,
  single-merchant fashion store?
- Which customer and operations capabilities are baseline for launch?
- Are the current choices for search, inventory, payments, media, background
  work, deployment, security, and observability proportionate?
- Which patterns are reusable, and what should remain deliberately out of scope?
- What concrete signals should trigger future architecture upgrades?

Important assumptions:

- NOVA is a single merchant serving Persian-speaking customers in Iran.
- The first release has one logical stock location, one payment gateway, and a
  simple nationwide shipping policy.
- The repository is the source of truth for current implementation status;
  `arch.md` is read from the repository's committed version because it is
  currently deleted in the working tree as a pre-existing change.
- Provider availability, pricing, contracts, and regulatory requirements must be
  verified again before production launch.

---

## 2. Current Project Summary

### Product

NOVA Store is an Iran-first, single-merchant clothing commerce platform for
women's, men's, and children's clothing plus selected accessories. It uses
integer toman amounts and a Persian RTL storefront.

### Target Users

- Persian-speaking customers shopping primarily on mobile connections.
- Staff operating catalog, inventory, orders, returns, payments, content, and
  customer-support workflows.

### Current Stack

- Bun workspace with separate `apps` and `packages` boundaries.
- React 19, Vite, TypeScript, TanStack Query, Zustand, Tailwind, and shared UI
  primitives.
- NestJS API and a separate worker process.
- Prisma with PostgreSQL.
- Redis for temporary security state and operational coordination.
- S3-compatible object storage; MinIO is used locally.
- REST-first typed client contracts.
- Vite client rendering plus a small Node-compatible SSR entry for indexable
  public pages.
- Docker Compose for local dependencies and a Docker-oriented deployment plan.

### Existing Features

The repository already contains substantial commerce foundations: catalog and
facets, Persian-normalized search and bounded suggestions, guest and customer
carts, cart merge conflict handling, checkout quotes, checkout-time inventory
reservations, customer OTP sessions, staff password/TOTP sessions, CSRF and
role guards, addresses, idempotent order-intent creation, payment callback
verification and reconciliation, coupons, fulfillment and shipment states,
cancellation/returns, refund inspection, transactional notification outbox
jobs, admin audit reads, content pages, SEO resolution, SSR, sitemap/robots
behavior, and local provider-free adapters.

### Important Missing Decisions

- Select and validate the launch payment gateway, SMS provider, and shipping
  provider contracts in staging.
- Choose the primary Iranian compute provider and an independent backup/failure
  domain.
- Define production media CDN/object-storage policy and image processing flow.
- Establish restore-tested database and media backups.
- Add production observability, alert thresholds, and provider reconciliation
  schedules.
- Complete the public/admin visual surfaces and launch measurement plan.

---

## 3. Executive Findings

1. **Keep the current architecture.** NOVA already has the right shape for a
   single-merchant V1: a modular monolith with a separate worker, durable
   PostgreSQL state, replaceable provider adapters, and a typed REST boundary.
   Saleor, Medusa, and Vendure validate the value of explicit commerce modules,
   but their multi-channel, plugin, workflow, and app ecosystems would add
   operational and conceptual cost without solving a current NOVA problem.

2. **The commerce invariants are the differentiator, not framework choice.**
   Server-owned price, stock, order, payment, refund, and fulfillment state;
   immutable order snapshots; explicit order/shipment transitions; and
   idempotent callbacks are more important than changing React, NestJS, Prisma,
   or REST.

3. **PostgreSQL search is the correct V1 default.** PostgreSQL's `pg_trgm`
   supports similarity matching and index-assisted search, which is a strong fit
   for a bounded clothing catalog and Persian normalization. A dedicated search
   service should wait for measured scale or ranking requirements.

4. **Provider adapters must be treated as launch-critical work.** Local
   provider-free adapters prove application boundaries but do not prove gateway
   signature rules, refund semantics, SMS delivery, shipping labels, timeout
   behavior, or reconciliation in production. These are the largest remaining
   operational risks.

5. **The media boundary is sound, but the production flow needs one explicit
   contract.** S3-compatible storage plus server-issued presigned URLs keeps
   credentials out of browsers and preserves portability between local MinIO
   and Iranian object-storage providers. Upload validation, quarantine, metadata,
   image derivatives, deletion, and backup verification still need a documented
   production runbook.

6. **Docker Compose is adequate for the first production shape.** A web/SSR
   process, API, worker, PostgreSQL, Redis, and object storage can be operated
   as a small deployment with health checks, restart policies, and independent
   backup storage. Kubernetes, Kafka, microservices, and a dedicated search
   cluster are not justified by the current product scope.

7. **NOVA should add operational evidence before adding platform complexity.**
   The next high-value work is restore drills, provider integration tests,
   structured logs, request/provider latency and failure metrics, worker health,
   payment reconciliation alerts, and an end-to-end checkout trace—not more
   generic abstraction.

8. **Fashion UX needs to be explicit.** Mature fashion references make size/fit,
   composition/care, availability, delivery, returns, and exchange expectations
   visible near the product and order decision. These should be treated as
   conversion and support-reduction features, not decorative content.

---

## 4. Strongest Comparable Products

| Product | Similarity | Important Features | Architecture / Stack | Why It Matters | Sources |
|---|---|---|---|---|---|
| Zara | Fashion UX reference | Variant/color/size selection, product information, availability, delivery, returns and exchanges | Proprietary; public customer-facing experience | Shows the information customers need before buying apparel and the value of first-class exchange flows | [Zara exchange help](https://www.zara.com/us/en/help-center/HowToExchange), [Zara official site](https://www.zara.com/) |
| Digikala | Iran-market reference; marketplace rather than direct competitor | Persian shopping, location-aware delivery prompt, express delivery, payment options, support, return promise, fashion category | Proprietary; public Iranian commerce platform | Evidence for local customer expectations and Persian operational copy; do not copy its marketplace breadth | [Digikala homepage](https://www.digikala.com/) |
| Shopify | Commerce operations reference | Variant inventory, inventory adjustment history, fulfillment, returns, tracking, delivery expectations | Hosted commerce platform with extensible apps and workflows | Useful baseline for merchant operations and inventory vocabulary; its hosted/global assumptions do not fit NOVA directly | [Inventory management](https://help.shopify.com/en/manual/products/inventory), [fulfillment and shipping](https://help.shopify.com/en/manual/fulfillment/features-overview) |
| Saleor | Headless commerce reference | Catalog, checkout, payments, channels, promotions, returns, multi-warehouse, apps and webhooks | API-only GraphQL, Python, decoupled dashboard/storefront, BSD-3-Clause core | Strong reference for API-first extensibility and app isolation; its global/multi-channel design exceeds NOVA V1 | [Saleor docs](https://docs.saleor.io/), [Saleor core](https://github.com/saleor/saleor) |
| Medusa | Node commerce reference | Cart totals, inventory, payments, orders, fulfillment, modules, workflows, events, file and notification integrations | Node/TypeScript, HTTP routes → workflows → modules → PostgreSQL; MIT core with commercial enterprise materials | Closest conceptual reference for replaceable commerce/infrastructure modules and workflow orchestration | [Medusa architecture](https://docs.medusajs.com/learn/introduction/architecture), [Medusa repository](https://github.com/medusajs/medusa) |
| Vendure | NestJS/TypeScript commerce reference | Catalog, orders, pricing, promotions, channels, stock, shipping, payments, plugin contracts, state machines | TypeScript, NestJS, GraphQL, React/TanStack admin, SQL; GPLv3 core with plugin exception | Validates NestJS modularity, explicit state machines, and plugin boundaries; licensing and broader scope require care | [Vendure repository](https://github.com/vendurehq/vendure), [order process](https://docs.vendure.io/current/core/reference/typescript-api/orders/order-process) |

### Interpretation

Zara and Digikala are product/UX references, not implementation templates.
Saleor, Medusa, and Vendure are architecture references, not recommendations to
adopt them. All three solve larger or more extensible problems than NOVA's
launch scope.

---

## 5. Strongest GitHub Repositories

### Medusa

Repository: <https://github.com/medusajs/medusa>

Category: Architecture and backend commerce reference

License: MIT core; enterprise materials are separately licensed.

Activity: Large active monorepo with frequent releases and extensive history at
the time of research.

Evidence Confidence: HIGH for repository README and official documentation;
MEDIUM for conclusions about production operating cost.

#### Why It Matters

Medusa's documented request path—HTTP routes, workflows, domain modules, and
PostgreSQL—closely matches NOVA's preference for deep domain boundaries. Its
payment, fulfillment, file, notification, cache, event, lock, and workflow
modules demonstrate where replaceable effects belong.

#### Useful Ideas

- Keep provider integrations behind domain-specific interfaces.
- Use workflow/application orchestration for multi-step commerce actions.
- Keep infrastructure integrations replaceable.
- Add compensation and retry semantics where a workflow crosses a durable
  transaction and an external provider.

#### Things Not To Copy

- A general workflow engine for every simple use case.
- Multi-region, marketplace, or B2B abstractions before NOVA has evidence for
  them.
- A broad module catalog that makes simple local behavior hard to trace.

### Saleor

Repository: <https://github.com/saleor/saleor>

Category: API-first and extensibility reference

License: BSD-3-Clause.

Activity: Mature, high-activity repository and ecosystem at the time of
research.

Evidence Confidence: HIGH for API-only architecture, channels, app/webhook
model, features, and license.

#### Why It Matters

Saleor demonstrates a clean separation between commerce core and independently
deployed extensions. Its own documentation also acknowledges that a service-
oriented approach can feel more complex for a small team without high traffic or
critical 24/7 requirements. That tradeoff supports NOVA's modular monolith.

#### Useful Ideas

- Keep external effects behind explicit extension seams.
- Treat channels, currencies, warehouses, and promotions as later capabilities,
  not hidden assumptions in the V1 data model.
- Preserve a stable API contract for future mobile/admin consumers.

#### Things Not To Copy

- GraphQL-only API migration when NOVA's REST contracts are working.
- Independent apps/services before deployment and ownership justify them.
- Global commerce fields that complicate a single-currency, single-merchant V1.

### Vendure

Repository: <https://github.com/vendurehq/vendure>

Category: NestJS, state-machine, and plugin reference

License: GPLv3 core with a plugin license exception; verify obligations before
reusing code.

Activity: Active TypeScript/NestJS repository with a maintained documentation
site at the time of research.

Evidence Confidence: HIGH for stack, plugin model, deployment options, order
state machine, and license.

#### Why It Matters

Vendure makes order transitions a first-class state-machine concern and exposes
customization through plugin contracts. NOVA already has explicit order,
shipment, payment, refund, and return transitions; Vendure supports that choice.

#### Useful Ideas

- Validate transitions centrally and make invalid transitions observable.
- Keep state transition hooks close to the state owner.
- Use a plugin/adapter seam for storage, payment, and shipping variation.

#### Things Not To Copy

- Marketplace/channel capability that is outside NOVA's business model.
- GPL-governed source reuse without a legal review.
- GraphQL and framework conventions solely for similarity.

### Bagisto

Repository: <https://github.com/bagisto/bagisto>

Category: Broad single-store and marketplace feature reference

License: MIT.

Activity: Mature Laravel repository with a large extension ecosystem.

Evidence Confidence: HIGH for stated product scope, Laravel/Vue stack, MIT
license, and built-in breadth; MEDIUM for claims about scalability.

#### Why It Matters

Bagisto illustrates how quickly a single-store product can accumulate
marketplace, B2B, multi-tenant, POS, mobile, and headless features. It is useful
as a checklist of possible later domains, not as a reason to add them to NOVA.

#### Things Not To Copy

- Feature breadth as a substitute for validated customer demand.
- Marketplace and multi-tenant concepts in a single-merchant schema.
- A large extension surface before operational ownership is clear.

---

## 6. Feature Matrix

| Feature | NOVA | Zara | Digikala | Shopify | Saleor / Medusa / Vendure | Pattern | Relevance |
|---|---|---|---|---|---|---|---|
| Fashion category discovery | Yes | Yes | Yes, broad marketplace | Yes | Yes | Common | High |
| Color/size variants | Yes | Yes | Yes | Yes | Yes | Common | High |
| Search and filters | Yes, PostgreSQL-backed | Yes | Yes | Yes | Yes | Common | High |
| Size/fit guidance | Planned/content boundary | Visible product experience | Varies by seller/category | Merchant-configured | Platform-dependent | Frequent in fashion | High |
| Composition/care content | Content/product fields | Visible product information | Seller/category dependent | Product content | Catalog extensibility | Frequent in fashion | High |
| Guest/cart flow | Yes | Yes | Account/marketplace flow | Configurable | Yes | Common | High |
| Reservation-safe checkout | Yes | Platform-managed | Platform-managed | Platform-managed | Yes | Advanced but essential | High |
| Payment callback/reconciliation | Yes, provider-neutral | Proprietary | Local ecosystem | Hosted/platform-managed | Adapter/app/plugin based | Advanced | High |
| Returns/refunds | Yes, bounded V1 | Strong exchange/return UX | Prominent return promise | Strong operations | Usually extensible | Common expectation | High |
| Multi-vendor | No, intentionally | No | Yes | Apps/partners | Supported by some | Optional | Low for MVP |
| Multi-warehouse | No, intentionally | Operationally mature | Likely broad | Yes | Yes | Advanced | Low for MVP |
| Reviews/wishlist/back-in-stock | Mostly P1 | Mature brand-dependent | Common marketplace patterns | Apps/workflows | Extensions | Frequent post-launch | Medium |
| Realtime customer experience | No requirement | Not required for V1 | Not required for V1 | Not required for core checkout | Optional | Usually unnecessary | Low |

---

## 7. Feature Patterns

### Common

- Catalog with product/variant separation.
- Search, categories, filters, sorting, pagination.
- Cart, checkout, order history, payment, delivery, returns.
- Admin inventory and order operations.
- Mobile-first customer experience.
- Clear stock, price, delivery, and support information.

### Frequent

- Multiple payment methods or gateways.
- Multiple fulfillment locations or shipping options.
- Product content beyond title/price: materials, care, size, availability.
- Customer notifications and order tracking.
- CMS/SEO controls for public acquisition.
- Webhooks, plugins, or apps for third-party integrations.

### Differentiators

- Persian normalization and RTL-first experience.
- Iran-specific payment, SMS, shipping, money, and infrastructure adapters.
- Reliable reservation/payment/refund reconciliation under local provider failure.
- Editorial fashion presentation joined to operationally accurate stock.

### Advanced

- Multi-region pricing and tax.
- Multi-warehouse allocation.
- Marketplace/vendor settlement.
- Recommendations, personalization, loyalty, subscriptions, and experimentation.
- Independent extension services and event-driven integration platforms.

### Probably Not Needed For MVP

- Kafka or another durable event-streaming platform.
- Elasticsearch/OpenSearch/Algolia.
- Kubernetes.
- Microservices or database-per-service.
- Marketplace/vendor settlement.
- Native mobile apps.
- Live carrier-rate orchestration.
- Dynamic authorization/promotion engines.
- Realtime presence or collaborative features.

---

## 8. Technology Comparison

### Frontend

NOVA's React + Vite + TypeScript + TanStack Query + Zustand is appropriate for
the current storefront/admin split. The current SSR entry solves public
indexability without moving commerce logic into the web process. Preserve the
hash-route compatibility layer while using clean public aliases as canonical
URLs.

### Backend

NestJS and a modular monolith remain the best fit for the current team and
scope. Vendure confirms that NestJS can support serious commerce boundaries;
NOVA does not need to adopt Vendure's GraphQL/plugin surface to get that value.

### Database

PostgreSQL is a strong system of record for catalog, carts, orders, inventory,
sessions, audit data, payments, and content. Its transaction and locking model
fits reservation and idempotency requirements.

### Cache and temporary state

Redis is appropriate for OTP state, rate limits, short-lived coordination, and
worker leasing. It should not become the source of truth for price, stock,
payment, order, or refund state.

### Queue and workers

The existing worker plus database-backed notification outbox is sufficient for
V1. Add a dedicated Redis queue only when job volume, scheduling, priority, or
retry isolation makes the current worker loop insufficient.

### Storage

S3-compatible object storage is the correct portability seam. It works with
local MinIO and Iranian providers such as Liara Object Storage, whose official
documentation describes S3 compatibility and presigned upload/download URLs.

### Search

Use PostgreSQL full-text search plus `pg_trgm` and Persian normalization first.
`pg_trgm` provides similarity functions and index operator classes for fast
similarity searches. A dedicated engine is an upgrade, not a foundation.

### Realtime

No realtime transport is currently justified. Customer order status can be
polled or refreshed on navigation; staff workflows can use explicit refresh.
Introduce SSE/WebSocket only when a measured workflow requires sub-minute push
updates.

---

## 9. Architecture Patterns

### Modular monolith with a separate worker

Observed in: NOVA's current architecture; Medusa's documented layered model;
Vendure's NestJS core.

Advantages:

- One deployable domain boundary with local transactions.
- Easy reasoning about checkout and inventory invariants.
- Lower latency and operational burden than distributed services.
- A separate worker isolates retries and external side effects.

Disadvantages:

- Module boundaries must be enforced by code review and tests.
- One API deployment can couple unrelated release risk.
- Horizontal scaling requires care around database and Redis contention.

Fit for NOVA: **Strong.** Keep the API modular and split only a worker and
possibly a public web/SSR process.

### Explicit state machines

Observed in: Vendure order processes and NOVA's accepted order, payment,
shipment, refund, return, and reservation transitions.

Recommendation: continue centralizing transitions and recording domain events.
Do not expose generic “set status” endpoints. A transition should validate the
current state, actor role, precondition/version, and side effects.

### Transactional outbox

Observed in: NOVA's notification design and AWS Prescriptive Guidance.

Recommendation: retain the outbox for payment/order notification intents. The
producer transaction and unique dedupe key protect against the dual-write
failure mode; consumers must still be idempotent because delivery is at-least-once.

### Adapter / anti-corruption boundary

Observed in: Medusa payment/fulfillment/file modules and NOVA's provider
interfaces.

Recommendation: keep provider vocabulary, units, signatures, retries, and
timeouts inside adapters. A gateway adapter should expose verified internal
results, not raw provider payloads.

### API-first public rendering

Observed in: Saleor's API-only model and NOVA's SSR resolver boundary.

Recommendation: keep the API authoritative and let SSR read public catalog and
content data. Do not duplicate pricing or checkout logic in SSR.

---

## 10. Data Model Insights

The current model is directionally correct for a single-merchant apparel store:

- Product is the sellable concept; variants carry SKU, price, option
  combinations, and inventory identity.
- Inventory availability is derived from on-hand stock minus active reservations.
- Orders snapshot lines, prices, addresses, and other fulfillment facts so
  historical orders do not depend on mutable catalog rows.
- Payment attempts and refunds are separate durable records.
- Shipment state is separate from payment/order state but transitions are
  synchronized through application services.
- Audit events, stock movements, order events, and notification jobs provide
  operational history without turning the entire system into event sourcing.

Do not add multi-warehouse, channel, or seller ownership columns speculatively.
Add them when a real business workflow requires allocation across locations,
different prices/stock by channel, or independent seller settlement.

Potential high-value follow-up fields/features:

- Explicit product material/care and garment-measurement fields where the
  content model cannot answer fashion support questions.
- A durable provider reconciliation cursor/job record for payment and shipment
  polling once real providers are selected.
- A media derivative record if responsive thumbnails, WebP/AVIF conversion, or
  image moderation becomes operationally necessary.

---

## 11. Authentication & Authorization

The current split between customer OTP sessions and staff password/TOTP sessions
is appropriate. Staff credentials, recovery codes, session hashes, role guards,
CSRF, origin checks, and rate limiting are all higher-value than adding OAuth or
passkeys to V1.

Security evidence supports the current direction:

- OWASP recommends a custom-header CSRF token pattern for cookie-authenticated
  state-changing requests and treats SameSite as defense in depth.
- OWASP session guidance supports careful cookie/session handling and warns that
  SameSite is not a substitute for a complete CSRF defense.
- Payment callbacks should remain server-to-server and signature-verified; the
  browser redirect is not payment authority.

Production checks still required:

- Verify cookie flags, proxy TLS termination, origin allowlists, and `__Host-`
  deployment assumptions in staging.
- Exercise OTP abuse limits with real provider latency and failure behavior.
- Confirm staff login, recovery, credential rotation, revocation, and audit
  alerts under Redis/database failure.
- Never log OTPs, passwords, TOTP secrets, recovery codes, provider secrets, or
  raw payment payloads.

Sources: [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

---

## 12. Search & Discovery

### Current approach

NOVA already uses Persian text normalization, PostgreSQL full-text/trigram
matching, bounded facets, pagination, sorting, and suggestions.

### Recommendation

Keep PostgreSQL search for launch. The official PostgreSQL `pg_trgm` module
supports similarity measurement, similarity operators, and index support for
similarity/substring searches. This covers the most likely V1 issues: Persian
character variants, partial product terms, SKU fragments, and small catalog
typos.

### Upgrade triggers

Evaluate Meilisearch, Typesense, OpenSearch, or Algolia only when one or more of
these are demonstrated:

- Search latency remains unacceptable after query/index profiling.
- Catalog/search documents grow enough that database queries compete with
  checkout or admin workloads.
- Product discovery requires advanced typo tolerance, facets, synonyms,
  autocomplete ranking, merchandising rules, or analytics-driven ranking.
- Search must be independently scaled or deployed.

Before upgrading, preserve PostgreSQL as the source of truth and define an
indexing/rebuild/reconciliation path. Do not make a search index the authority
for price or availability.

Source: [PostgreSQL `pg_trgm` documentation](https://www.postgresql.org/docs/current/pgtrgm.html).

---

## 13. Media & Storage

### Recommended flow

1. Staff requests an upload intent from the API.
2. API authorizes the staff action, allocates a non-user-controlled object key,
   validates intended content type/size, and returns a short-lived presigned
   PUT URL.
3. Browser uploads directly to object storage without receiving storage
   credentials.
4. API verifies object metadata/checksum and moves the media through a pending,
   accepted/quarantined, and published lifecycle.
5. Worker creates bounded image derivatives when required.
6. Public delivery uses a CDN or controlled public URL; private/admin assets use
   short-lived signed reads.

Cloudflare's official R2 documentation confirms that presigned URLs grant
   temporary, operation-specific access and recommends restricting content type
   and CORS. Liara documents the same S3-compatible and presigned URL model for
   Iranian object storage. These are implementation references, not a provider
   selection.

### Upgrade triggers

- Add an image-processing worker when the admin must upload many images or
  storefront performance needs responsive derivatives.
- Add a CDN when origin bandwidth or mobile latency becomes material.
- Add lifecycle/retention policies only after distinguishing temporary upload
  objects, current product media, historic order evidence, and backups.
- Add a second object-storage failure domain before treating media backup as
  disaster recovery.

Sources: [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Cloudflare R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/), [Liara Object Storage API](https://developers.liara.ir/pages/object-storage).

---

## 14. Realtime

There is no strong V1 requirement for chat, presence, typing indicators, or live
inventory updates. Use ordinary reads and explicit refresh for customer order
tracking and staff operations.

If a requirement appears later, prefer SSE for server-to-browser order/operation
notifications before WebSockets. Introduce Redis Pub/Sub or Streams only when
multiple API instances must fan out events and a durable outbox is not enough.
Realtime messages must never become the durable source of order/payment truth.

---

## 15. Background Jobs

The existing notification outbox and worker are well matched to V1:

- The application writes the notification intent in the same transaction as the
  order/payment transition.
- A unique dedupe key protects producer retries.
- Worker claims use conditional updates and leases.
- Exponential retry and terminal failure keep provider problems observable.

AWS guidance describes transactional outbox as a solution to the dual-write
problem and recommends idempotent consumers because duplicate delivery remains
possible. Stripe's idempotency guidance similarly recommends stable keys and
parameter consistency for retry-safe mutation requests.

Add a general queue only when the worker needs independent concurrency,
priorities, delayed schedules, dead-letter handling, or high-volume media/search
jobs. Keep payment callbacks short and deterministic; move slow follow-up work
to the worker.

Sources: [AWS transactional outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html), [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests).

---

## 16. Infrastructure & Hosting

### Observed current shape

Local Compose runs PostgreSQL, Redis, and MinIO with health checks and persistent
volumes. The application is split into web/SSR, API, and worker processes.

### Recommended direction

Start production with a small Docker deployment on an Iranian provider that can
meet the domain's latency, payment callback reachability, support, and backup
requirements. Keep the provider-specific configuration outside application
code. Store database and media backups in an independent second failure domain.

Docker's production guidance supports using Compose beyond development, with
production overrides, non-bind-mounted application code, environment-specific
configuration, restart policies, and health checks. This is sufficient for a
first release if operational ownership is clear.

Deployment topology:

```text
Customer
  ↓
CDN / reverse proxy / TLS
  ├─ public web/SSR
  └─ API
       ├─ PostgreSQL (system of record)
       ├─ Redis (temporary state / coordination)
       ├─ object storage (media)
       └─ worker (outbox, cleanup, reconciliation)
```

### Upgrade triggers

- Split API/web/worker hosts when one process class creates measurable resource
  contention or independent scaling needs.
- Move PostgreSQL to a managed service when backup, failover, patching, or
  replica operations exceed the team's safe operational capacity.
- Add a second API instance when measured traffic or provider callback bursts
  require it; verify session, Redis, and worker coordination first.
- Consider Kubernetes only when there are multiple deployable services,
  autoscaling requirements, or an operations team that can run it reliably.

Source: [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/).

---

## 17. Deployment & CI/CD

Required launch pipeline:

1. Install with the pinned Bun/runtime toolchain.
2. Lint, typecheck, focused tests, and full unit/integration test suites.
3. Build packages, API, web client/SSR, and worker from a clean output tree.
4. Validate Compose configuration and container health checks.
5. Run database migration checks and a provider-free smoke flow.
6. Build an immutable release artifact/container.
7. Deploy to staging, run migrations with a controlled procedure, and execute
   checkout, callback, refund, notification, media, and restore smoke tests.
8. Promote with a rollback plan that distinguishes application rollback from
   irreversible database migrations.

The repository already has scripts for typecheck, lint, tests, build, local
provider checks, Docker configuration, backup verification, and local signal
verification. The missing production evidence is staging/provider execution and
restore drills, not more build tooling.

Secrets should be injected by the deployment environment. Rotate payment, SMS,
storage, database, session, CSRF, and TOTP-encryption secrets independently.

---

## 18. Security Findings

### Confirmed good direction

- Server-authoritative commerce values.
- Opaque server sessions with hashed persisted tokens.
- Separate customer/staff authentication boundaries.
- Staff MFA and throttled login.
- CSRF custom header plus origin checks.
- Verified callback signatures and replay keys.
- Redacted operational inspection.
- Audit events and optimistic concurrency for sensitive admin mutations.
- Provider-free local adapters that fail closed instead of pretending delivery
  succeeded.

### High-priority launch verification

- Real callback signature verification with the selected gateway, including
  duplicate, delayed, contradictory, wrong-amount, and late-payment cases.
- Refund idempotency and operator escalation when a provider refund fails.
- SMS rate limits and delivery-provider timeouts.
- Object-upload content validation, key authorization, and signed URL expiry.
- Admin authorization at use-case boundaries, not just route visibility.
- Database/media backup confidentiality and restore permissions.
- Security headers, TLS, cookie flags, origin configuration, and proxy behavior.
- Log scrubbing for phone numbers, addresses, tokens, payment identifiers, and
  provider payloads.

Do not add security complexity that is not tied to a threat or provider
requirement. Do not treat SameSite, frontend guards, or a successful redirect as
complete protection.

---

## 19. Observability

Minimum production signals:

- API request count, latency, error rate, and status by route class.
- PostgreSQL connection/query failures and transaction duration.
- Redis availability, OTP throttling failures, and worker lease contention.
- Checkout quote/submit outcomes, reservation expiry, payment callback status,
  refund failures, and provider latency.
- Notification backlog, retry count, oldest pending job, and terminal failures.
- Media upload failures and derivative backlog.
- SSR 404/503/noindex responses and sitemap generation failures.
- Backup age, backup size, restore-test result, and storage capacity.

Use structured logs now. Add OpenTelemetry traces and metrics when the staging
deployment can collect them; the official JavaScript implementation supports
Node.js traces and metrics, while browser instrumentation remains less mature.
Prometheus guidance emphasizes request count, errors, and latency for online
services and separate metrics for offline/batch work.

Sources: [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/), [Prometheus instrumentation](https://prometheus.io/docs/practices/instrumentation/).

---

## 20. Monetization

NOVA is a single-merchant store, so the primary monetization is product margin.
V1 should focus on conversion, contribution margin, payment success, fulfillment
cost, return rate, and repeat purchase rather than subscriptions, marketplace
fees, loyalty points, or advertising.

Recommended initial events:

- Product impression and detail view.
- Search query, no-result query, filter use, and suggestion selection.
- Add-to-cart, checkout start, payment redirect, payment success/failure.
- Cancellation, return request, refund success/failure.
- Notification delivery and support contact.

Keep analytics identifiers separate from operational secrets and avoid collecting
more personal data than needed.

---

## 21. UX / Product Patterns

### Reuse

- Editorial home/category presentation appropriate to fashion.
- Persistent, obvious search and category discovery.
- Product pages with visual media, color/size choices, stock state, price,
  delivery estimate, returns, material/care, and measurement guidance.
- Checkout that exposes authoritative quote changes and recovery states.
- Order tracking that separates payment, preparation, shipping, delivery, and
  return/refund states.
- Persian RTL copy that handles Persian and Latin SKU/brand text correctly.

### High-value missing opportunity

Create a product-content contract for clothing-specific confidence: fit note,
garment measurements, model measurements, material, care, size guide, and
delivery/return policy. This can begin as structured catalog/content data and
does not require a recommendation engine.

### Post-launch experiments

- Back-in-stock alerts.
- Wishlist/favorites.
- Verified purchase reviews with moderation.
- Abandoned-cart reminders.
- Product comparison or fit profile only after support/search data justifies it.

Zara's public exchange guidance is evidence that size/color exchange deserves a
first-class user flow. Digikala's current public homepage shows local customers
are exposed to location-aware delivery, express delivery, payment options,
support coverage, and a return promise. NOVA should adapt those expectations to
its single-merchant operating model rather than copy marketplace complexity.

---

## 22. Libraries Worth Considering

| Library / capability | Purpose | Evidence | Why Consider It |
|---|---|---|---|
| PostgreSQL `pg_trgm` | Fuzzy/substring catalog search | Official PostgreSQL docs and current NOVA ADR | Already fits current catalog scale and Persian normalization |
| AWS SDK S3 client + presigner | Portable object storage access | Cloudflare R2 and Liara S3-compatible docs | Keeps MinIO, Iranian S3, and other providers behind one adapter |
| OpenTelemetry JS | Traces and metrics | Official OpenTelemetry docs | Vendor-neutral path for API/provider/worker correlation |
| Prometheus-compatible metrics | Operational metrics and alerts | Official Prometheus instrumentation guidance | Simple, portable metrics for API and worker health |
| Dedicated search engine | Advanced ranking/facets/autocomplete | Saleor search ecosystem and general platform patterns | Consider only after upgrade triggers are measured |

Do not add a library merely because a reference platform uses it. Prefer the
existing Bun/TypeScript/PostgreSQL/Redis capabilities until a concrete gap is
measured.

---

## 23. Patterns Worth Reusing

- One owner for each commerce invariant.
- Durable order/payment/refund/shipment snapshots.
- Conditional updates and optimistic concurrency for admin mutations.
- Idempotency keys with parameter consistency checks.
- Transactional outbox plus at-least-once, idempotent worker handling.
- Adapter boundaries for payment, SMS, shipping, storage, and analytics.
- PostgreSQL as authority; caches and search indexes as derived state.
- Clean public URLs and fail-closed noindex behavior on SSR/API failure.
- Explicit local adapters that are visibly different from production providers.
- Independent database and media backup verification.

---

## 24. Patterns To Avoid

- Replatforming to Saleor, Medusa, Vendure, Shopify, or Bagisto without a
  demonstrated product or operational problem.
- Microservices, Kafka, Kubernetes, or a dedicated search cluster for V1.
- Marketplace, multi-warehouse, multi-tenant, loyalty, or generic rule-engine
  abstractions before evidence.
- Browser-authoritative totals, stock, payment status, or return status.
- Inline SMS/email/analytics side effects inside payment or checkout transactions.
- Treating provider redirects as payment confirmation.
- Generic status mutation endpoints.
- Unbounded media uploads or permanent bearer URLs.
- Storing secrets or raw third-party payloads in logs/database fields.
- Relying on SameSite or frontend route guards as the only security boundary.

---

## 25. Missing Opportunities

1. **Provider certification pack:** staging adapters and repeatable contract tests
   for payment request/verify/refund, SMS OTP, shipping quote/label/tracking,
   timeout, replay, and provider outage behavior.
2. **Restore evidence:** scheduled database dump/base-backup verification,
   independent media backup, and a documented restore rehearsal with measured
   RTO/RPO.
3. **Fashion content model:** structured measurements, fit, material, care,
   size-guide, and return/exchange data close to product decisions.
4. **Operations dashboard:** payment exceptions, refund failures, stuck
   reservations, notification backlog, provider health, and inventory low-stock
   signals.
5. **Search quality loop:** no-result query capture, Persian normalization
   metrics, click-through on suggestions, and a measured upgrade threshold.
6. **Launch analytics:** funnel and margin events that distinguish acquisition,
   conversion, payment failure, fulfillment delay, and return cost.

---

## 26. Recommendations

### Recommendation 1: Finish the current modular monolith and certify providers

Why: NOVA already has the required domain boundaries and most invariants.

Evidence: Medusa and Vendure show the value of layered modules and explicit
workflows/state machines; NOVA has the same needs without their broader platform
surface.

Tradeoffs: Some future features will require deliberate schema evolution rather
than enabling a ready-made platform module.

When to reconsider: If the team must support multiple merchants, channels,
warehouses, currencies, or independently deployed extensions, reassess Saleor,
Medusa, or Vendure against a migration plan.

### Recommendation 2: Keep PostgreSQL search through launch

Why: Current catalog and query requirements are bounded, and `pg_trgm` directly
supports typo/similarity behavior.

Evidence: Official PostgreSQL documentation; current NOVA search ADR and
normalization implementation.

Tradeoffs: Less advanced ranking, synonyms, and faceting than a dedicated
search product.

When to reconsider: Measured latency, catalog size, ranking requirements, or
search-driven revenue justifies an independently indexed search system.

### Recommendation 3: Make restore drills and provider integration the launch gate

Why: Local adapters and unit tests cannot prove payment, SMS, shipping, backup,
or callback behavior in the target environment.

Evidence: PostgreSQL documents multiple backup strategies including continuous
archiving/PITR; payment and outbox guidance both emphasize replay/idempotency.

Tradeoffs: Provider certification and restore work delays visual polish slightly
but removes the highest-risk launch uncertainty.

When to reconsider: After one successful staging certification and recurring
restore evidence, invest in scaling/automation based on measured signals.

### Recommendation 4: Use S3-compatible storage with direct, signed uploads

Why: It preserves local/provider portability and avoids routing large media
through the API.

Evidence: Official R2 and Liara documentation.

Tradeoffs: Requires careful object-key authorization, CORS, content validation,
quarantine, cleanup, and backup policy.

When to reconsider: Add CDN/derivatives/processing infrastructure when image
weight, mobile latency, or upload volume becomes measurable.

### Recommendation 5: Operate the first release with Docker Compose plus a
separate worker

Why: The current service count is small and Compose supports production
overrides, health checks, and restart policies.

Evidence: Docker's production Compose guidance and current repository topology.

Tradeoffs: Failover and scaling are more manual than managed orchestration.

When to reconsider: Independent scaling, multiple hosts, multi-region/failure
requirements, or an operations team capable of running Kubernetes justify a
larger platform.

---

## 27. Suggested MVP

### Customer

- Persian RTL responsive storefront.
- Home, category, catalog, search, facets, sorting, and product detail.
- Variant/size selection with stock, price, delivery, return, care, and size
  information.
- Guest cart and customer account/cart merge.
- Phone OTP sign-in.
- Address, quote, one shipping policy, one payment gateway, recovery states.
- Order confirmation, tracking, cancellation, return request, and support entry.

### Staff

- Staff password + TOTP login with explicit roles.
- Catalog, variants, media, inventory, publication lifecycle.
- Order/payment/refund/return/fulfillment operations.
- Coupons, content, SEO metadata, redirects, and audit reads.
- Operational views for exceptions and stuck jobs.

### Reliability

- Reservation concurrency tests.
- Idempotent checkout and payment callbacks.
- Refund and late-payment reconciliation.
- Notification outbox and worker retries.
- Provider certification in staging.
- Backup/restore rehearsal.
- Structured logs, core metrics, health checks, and alerts.

---

## 28. Post-MVP Opportunities

Prioritize from evidence:

1. Back-in-stock and wishlist.
2. Verified reviews and moderation.
3. Abandoned-cart reminders.
4. Additional shipping methods/provider integration.
5. Additional payment gateway.
6. Search ranking/synonyms or dedicated search service.
7. Product comparison and fit profile.
8. Multi-warehouse inventory.
9. Loyalty and recommendations.
10. Marketplace/multi-vendor only if the business model changes.

---

## 29. Sources

### Official Products and UX

- [Zara](https://www.zara.com/)
- [Zara exchange help](https://www.zara.com/us/en/help-center/HowToExchange)
- [Digikala](https://www.digikala.com/)
- [Shopify inventory management](https://help.shopify.com/en/manual/products/inventory)
- [Shopify fulfillment and shipping](https://help.shopify.com/en/manual/fulfillment/features-overview)

### Commerce Platforms and GitHub

- [Saleor documentation](https://docs.saleor.io/)
- [Saleor core repository](https://github.com/saleor/saleor)
- [Medusa architecture](https://docs.medusajs.com/learn/introduction/architecture)
- [Medusa repository](https://github.com/medusajs/medusa)
- [Vendure repository](https://github.com/vendurehq/vendure)
- [Vendure order process](https://docs.vendure.io/current/core/reference/typescript-api/orders/order-process)
- [Bagisto repository](https://github.com/bagisto/bagisto)

### Payments, Reliability, Security

- [ZarinPal REST API documentation](https://zarinpal-lab.github.io/API-Docs/)
- [ZarinPal Node SDK](https://github.com/ZarinPal/ZarinPal-node-SDK)
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [PostgreSQL backup and restore](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL `pg_trgm`](https://www.postgresql.org/docs/current/pgtrgm.html)

### Infrastructure and Operations

- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/)
- [Liara Object Storage API](https://developers.liara.ir/pages/object-storage)
- [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Prometheus instrumentation](https://prometheus.io/docs/practices/instrumentation/)

### Current Project Evidence

- `README.md`
- committed `arch.md`
- `docs/adr/0001-foundation.md`
- `docs/adr/0005-inventory-reservation-concurrency.md`
- `docs/adr/0006-checkout-transaction-boundaries.md`
- `docs/adr/0007-staff-authentication-and-sessions.md`
- `docs/adr/0009-payment-callbacks-and-reconciliation.md`
- `docs/adr/0014-notification-outbox.md`
- `docs/adr/0019-catalog-search-suggestions.md`
- `docs/adr/0024-hybrid-rendering-indexability.md`
- `infra/docker/compose.yml`
- `packages/db/prisma/schema.prisma`

