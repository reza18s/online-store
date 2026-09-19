# NOVA Store Architecture

> Status: canonical V1 architecture
>
> Last updated: 2026-09-18
>
> Source: search.md, active repository behavior, accepted ADRs, Prisma schema,
> and the confirmed architecture decisions from the project review.

## 1. Purpose

NOVA Store is an Iran-first, single-merchant clothing commerce platform for
Persian-speaking customers. It sells women's, men's, and children's clothing,
selected accessories, and seasonal collections.

This document defines the architecture to implement and operate V1. It is an
implementation contract, not a list of speculative future services. It records:

- technology choices;
- ownership boundaries;
- runtime topology;
- frontend and backend composition;
- commerce and security invariants;
- external integration seams;
- data and state rules;
- deployment and validation requirements;
- explicit non-goals and upgrade triggers.

The repository's active source code, database schema, public API contracts, and
accepted ADRs remain the most precise evidence for current behavior. When this
document disagrees with active behavior, the disagreement must be resolved
explicitly; no third architecture may be invented silently.

---

## 2. Product Boundary

### 2.1 Product model

NOVA is:

- a single-merchant store;
- focused on apparel and selected accessories;
- Persian and RTL-first;
- primarily mobile-oriented;
- guest-checkout capable;
- operated by a small staff team;
- deployed primarily within an Iran-first infrastructure strategy.

### 2.2 Primary customer journey

```
Home
  ↓
Category / Search
  ↓
Product detail
  ↓
Variant / size selection
  ↓
Cart
  ↓
Phone verification
  ↓
Address and shipping quote
  ↓
Payment redirect
  ↓
Verified callback / reconciliation
  ↓
Order confirmation
  ↓
Fulfillment and tracking
  ↓
Cancellation / return / refund when applicable
```

### 2.3 Staff journey

```
Staff login + TOTP
  ↓
Catalog / media / publication
  ↓
Inventory operations
  ↓
Order, payment, fulfillment, return, refund operations
  ↓
Customer support lookup
  ↓
Content / SEO / redirect management
  ↓
Audit and notification inspection
```

### 2.4 Money and locale

- Domain money is an integer amount in TOMAN.
- Floating-point money is forbidden.
- Provider-specific conversion, such as toman to rial, occurs only inside the
  provider adapter.
- Customer-facing numbers use Persian-friendly formatting where appropriate.
- Product titles, descriptions, brand names, SKUs, and provider identifiers may
  contain mixed Persian and Latin text.
- All public storefront flows must support RTL layout, keyboard use, mobile
  layouts, loading states, empty states, and error recovery.

---

## 3. Architectural Decisions

The following decisions are confirmed and must be preserved unless a new
architecture decision explicitly supersedes them.

| Area                   | Decision                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Backend runtime        | NestJS modular monolith                                                            |
| Persistence            | PostgreSQL through Prisma                                                          |
| API style              | REST-first with typed contracts and OpenAPI-compatible descriptions                |
| Frontend runtime       | Two React/Vite TypeScript apps: public `apps/web` and admin `apps/admin`           |
| Frontend routing       | React Router as the primary router; hash compatibility retained                    |
| Styling                | Tailwind CSS and repository design tokens                                          |
| Components             | shadcn/ui-style accessible primitives                                              |
| Motion                 | Animate UI as an optional motion layer; motion never owns business state           |
| Server state           | TanStack Query                                                                     |
| Local state            | Zustand for cart/UI intent only                                                    |
| Background work        | Separate worker with transactional outbox and retry leasing                        |
| Durable state          | PostgreSQL is authoritative                                                        |
| Temporary coordination | Redis for OTP, rate limits, short-lived state, and coordination                    |
| Search V1              | PostgreSQL full-text search, pg_trgm, and Persian normalization                    |
| Media                  | S3-compatible object storage behind an adapter; MinIO locally                      |
| Customer auth          | Phone OTP and opaque customer sessions                                             |
| Staff auth             | Password, TOTP MFA, recovery codes, and opaque staff sessions                      |
| Authorization          | Fixed V1 roles: SUPPORT, OPERATIONS, ADMIN                                         |
| Payment                | One gateway at launch behind a PaymentGateway adapter                              |
| Shipping               | One simple nationwide policy behind a ShippingProvider adapter                     |
| Deployment             | Docker-oriented deployment; Compose is sufficient for first production shape       |
| Public rendering       | Hybrid SSR in `apps/web` for indexable public pages; client-rendered private flows |
| Admin runtime          | Independent Vite SPA in `apps/admin`, served separately from the public web app    |

### 3.1 Why this architecture

NOVA's difficult problems are commerce invariants, not framework scale:

- preventing overselling;
- preserving order and payment truth;
- handling provider callbacks and retries;
- keeping historic orders immutable;
- protecting staff operations;
- operating reliably on local infrastructure;
- delivering a fast Persian storefront.

A modular monolith keeps related transactions close together and is easier to
operate than microservices. The separate worker isolates retryable external
effects without splitting every domain into a deployable service.

### 3.2 Architecture rule

Use the smallest architecture that satisfies the current product and its
invariants. Do not add microservices, Kafka, Kubernetes, a dedicated search
cluster, a generic workflow engine, dynamic policy engines, or multi-tenant
abstractions without a measured requirement.

---

## 4. System Topology

```
                         ┌──────────────────────────────┐
                         │ Browser / mobile web         │
                         └──────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
                         ┌────────────────────────────────┐
                         │ Reverse proxy / TLS / CDN      │
                         └──────────────┬─────────────────┘
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
              ┌─────────────────┐               ┌─────────────────┐
              │ Public web       │               │ Admin web        │
              │ apps/web         │               │ apps/admin       │
              │ Vite + SSR       │               │ Vite SPA         │
              │ :5173            │               │ :5174            │
              └────────┬────────┘               └───────┬─────────┘
                       │ public/customer API reads        │ staff/admin API reads
                       └────────────────┬────────────────┘
                                        ▼
                               ┌─────────────────┐
                               │ NestJS API      │
                               │ REST + auth     │
                               │ :4000           │
                               └────────┬────────┘
                 ┌──────────────────────────────────────┼────────────────────┐
                 ▼                                      ▼                    ▼
        ┌─────────────────┐                    ┌────────────────┐   ┌────────────────┐
        │ PostgreSQL       │                    │ Redis           │   │ Object storage  │
        │ durable truth    │                    │ temp/coord      │   │ media           │
        └────────┬────────┘                    └────────────────┘   └────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Worker           │
        │ outbox, cleanup, │
        │ reconciliation   │
        └────────┬────────┘
                 │ external effects
       ┌─────────┼──────────┬──────────────┐
       ▼         ▼          ▼              ▼
   Payment     SMS       Shipping       Analytics
   gateway     provider  provider       sink
```

### 4.1 Process responsibilities

#### Web / SSR process

- Serves the built browser bundle.
- Renders only public, indexable document boundaries.
- Resolves public SEO metadata and redirects.
- Reads public catalog/content data from the API.
- Owns the public storefront, customer account, cart, checkout, and public
  document handoff.
- Does not own checkout, pricing, inventory, payment, authorization, or
  mutation logic.

#### Admin web process

- Serves the independent `apps/admin` Vite application.
- Runs separately from the public web process (local default `127.0.0.1:5174`).
- Owns staff login, role-aware admin navigation, catalog, inventory, order,
  payment, refund, customer-support, content, SEO, audit, and notification
  inspection UI.
- Uses the same versioned API and typed `packages/api-client` boundary as the
  public app; it does not import public web components or server code.
- Is client-rendered and noindex. Staff authorization remains server-side.

Local process commands are intentionally separate:

```bash
bun run dev          # public web, default 127.0.0.1:5173
bun run dev:admin    # admin web, default 127.0.0.1:5174
bun run dev:api      # shared NestJS API, default 127.0.0.1:4000
```

#### NestJS API

- Owns REST transport, authentication, authorization, domain use cases,
  transactions, and public/admin/customer contracts.
- Recomputes authoritative money, stock, discounts, shipping, order totals, and
  payment state.
- Writes transactional notification intents and durable audit/order events.
- Calls external providers only through adapters and only where the operation's
  consistency boundary requires it.

#### Worker

- Claims and processes notification outbox jobs.
- Runs reservation/coupon cleanup and provider reconciliation jobs.
- Performs retryable media derivative work when enabled.
- Uses leases, bounded retries, dedupe keys, and structured diagnostics.
- Never silently converts an unconfigured provider into success.

#### PostgreSQL

- Owns all durable commerce, identity, audit, event, content, and operational
  records.
- Is the source of truth for price, stock, order, payment, refund, shipment,
  return, coupon, and staff/customer session state.

#### Redis

- Stores temporary OTP challenges, rate-limit counters, short-lived security
  state, and bounded coordination/lease state.
- May support future cache or fan-out needs.
- Must not become the source of truth for orders, payment, inventory, or refunds.

#### Object storage

- Stores original and derivative media.
- Is accessed through an ObjectStorage adapter.
- Receives direct browser uploads only through short-lived server-issued signed
  URLs.
- Does not determine whether a media row is published or usable; the database
  media lifecycle does.

---

## 5. Repository Structure and Ownership

```
apps/
  api/                         NestJS modular monolith
  web/                         React/Vite public storefront, account, and SSR
  admin/                       Independent React/Vite staff/admin application
  worker/                      Background jobs and external effects

packages/
  api-client/                  Typed REST client, contracts, query keys
  config/                      Validated environment configuration
  db/                          Prisma schema, migrations, seed, database client
  ui/                          Shared UI primitives and design tokens

infra/
  docker/                      Local Compose and dependency startup
  deploy/                      Build/release/deployment verification
  monitoring/                  Local health and signal verification

docs/
  adr/                         Durable architecture decisions
  designs/                     Product and visual direction
  runbooks/                    Operational procedures

search.md                     Product and technology research
arch.md                       Canonical implementation architecture
```

### 5.1 Ownership rules

- apps/api owns server use cases and transport wiring.
- apps/admin owns staff/admin presentation, route composition, staff query
  cache behavior, and browser intent for operational screens.
- packages/db owns persistence shape and migration workflow, not business
  orchestration.
- packages/api-client owns browser-facing transport types and query-key
  conventions, not server cache truth.
- apps/web owns public/customer presentation, route composition, browser intent,
  and public document handoff, not commerce authority or admin UI.
- apps/worker owns asynchronous provider effects, not synchronous order truth.
- packages/ui owns reusable visual primitives, not feature-specific business
  rules.
- packages/config owns startup validation and environment parsing.

No module may become a generic dumping ground. A module is justified when it
owns meaningful rules, persistence access, failure semantics, or a stable
integration boundary.

### 5.2 Dependency direction

```
web ───────────────► api-client ─────────────► shared contracts/types
admin ─────────────► api-client + ui ─────────► shared contracts/types
api ───────────────► api-client contracts
api ───────────────► db
worker ────────────► db + config
all processes ─────► config
ui ────────────────► no domain package
```

The browser must not import Prisma, server-only configuration, provider SDKs,
or server secrets. The API must not import browser components. The worker must
not become a second API implementation.

---

## 6. Backend Architecture

### 6.1 NestJS module boundaries

The API is a modular monolith. The recommended capability boundaries are:

```
Identity / Auth
Customers / Addresses

Catalog / Media
Search
Content / SEO

Cart
Checkout
Orders
Inventory
Payments
Shipping
Coupons
Returns

Notifications
Audit
Admin transport / operations
Health / readiness
```

The exact NestJS folder structure may follow the active repository convention,
but each capability must keep its controller, DTO/contract mapping, use cases,
domain rules, persistence access, and tests close enough to reveal ownership.

### 6.2 Request flow

```
HTTP request
  ↓
NestJS controller / validation pipe
  ↓
authentication guard, when required
  ↓
role/use-case authorization
  ↓
application service / use case
  ↓
domain module rules
  ↓
Prisma transaction and/or provider adapter
  ↓
typed response contract
```

Controllers translate transport concerns. They must not contain checkout
sequencing, payment confirmation, stock mutation, refund policy, or role-only
business decisions.

### 6.3 Contracts

- Public and private HTTP routes use the /v1 prefix; health endpoints remain
  stable outside /v1.
- Request validation rejects malformed types before side effects.
- Response shapes must not expose credentials, raw provider payloads, OTPs,
  TOTP secrets, recovery codes, session tokens, or unnecessary customer data.
- Browser mutations use CSRF protections appropriate to cookie authentication.
- Every mutation with retry or duplicate risk defines an idempotency boundary.
- API client query keys must identify the same server resource identity used by
  invalidation and route transitions.

### 6.4 Module communication

Prefer explicit application-service calls and narrow internal contracts. Avoid
direct cross-module writes into another module's tables. A module may expose:

- a use-case method;
- a small read model/query method;
- an adapter interface;
- a domain event/outbox intent;
- a typed contract required by a real consumer.

Do not use database triggers or hidden Prisma middleware for core business
transitions unless a future decision documents the invariant and its recovery
behavior.

---

## 7. Frontend Architecture

### 7.1 Stack

- React and TypeScript.
- Vite for browser and build tooling.
- React Router for route ownership and navigation.
- Tailwind CSS for layout and styling.
- shadcn/ui-style primitives in packages/ui.
- Animate UI for optional accessible motion and transition composition.
- TanStack Query for server data, loading/error states, and cache invalidation.
- Zustand for local cart/UI intent only.

### 7.2 Route ownership

React Router is the primary in-app route owner. The legacy hash-router behavior
remains supported for existing links and compatibility, but hash URLs are not
canonical for crawler-facing pages.

| Route class       | Examples                              | Rendering              | Indexing                    |
| ----------------- | ------------------------------------- | ---------------------- | --------------------------- |
| Public home       | /, legacy #home                       | SSR + client hydration | index/follow                |
| Public category   | /category/:slug                       | SSR + client hydration | index/follow when canonical |
| Public product    | /product/:slug                        | SSR + client hydration | index/follow when published |
| Public content    | /content/:slug                        | SSR + client hydration | index/follow when published |
| Search/list state | /search, filters, sorting, pagination | Client-rendered        | noindex                     |
| Auth              | /auth, /auth/verify                   | Client-rendered        | noindex                     |
| Customer          | /account/_, /orders/_                 | Client-rendered        | noindex                     |
| Commerce mutation | /cart, /checkout, /checkout/*         | Client-rendered        | noindex                     |
| Staff/admin       | `/admin/*` on the separate admin app  | Client-rendered        | noindex                     |
| System            | /robots.txt, /sitemap.xml, assets     | Server/system response | controlled                  |

The SSR process may read public catalog/content data and SEO metadata, but it
must never perform customer mutations or recreate server commerce logic.

### 7.3 Server-state ownership

TanStack Query owns:

- catalog and product reads;
- search results and suggestions;
- public content and SEO reads;
- customer identity/profile reads;
- carts and cart mutation results;
- addresses;
- checkout quotes and order reads;
- public/customer reads in `apps/web`;
- staff/admin catalog, inventory, order, payment, return, audit, content, SEO,
  customer-support, and notification-inspection reads in `apps/admin`.

The two frontend apps use separate query-client instances. The admin instance
also owns staff-scoped 401/403 cache behavior and redirects expired sessions to
the admin login route; the public instance has no staff/admin cache boundary.

Mutation success must invalidate or update the relevant query keys. Query keys
must include route identity and material parameters so navigating from one
product, variant, order, or customer to another cannot reuse stale data.

### 7.4 Zustand ownership

Zustand may own:

- cart-local feedback;
- guest-cart merge conflict presentation;
- open overlays and drawers;
- temporary form/UI intent that is not server truth;
- local presentation preferences.

Zustand must not be the authority for:

- prices;
- inventory;
- payment status;
- order status;
- refund status;
- authoritative customer/session data;
- server query caches.

### 7.5 UI system

Use packages/ui and shadcn/ui conventions for inputs, buttons, labels, cards,
dialogs, badges, selects, radio groups, and feedback states. Tailwind tokens
and CSS variables define the visual system.

Animate UI is an optional layer for:

- route transitions;
- drawer/dialog entry and exit;
- loading/skeleton transitions;
- cart feedback;
- non-blocking confirmation states.

Animation must be:

- disabled or reduced for prefers-reduced-motion;
- independent of domain state transitions;
- resilient when data loading fails;
- free of animation-only layout hacks;
- removable without changing business behavior.

### 7.6 Accessibility and RTL

- Use semantic HTML and keyboard-operable controls.
- Preserve visible focus states.
- Keep labels and validation messages connected to fields.
- Test dialogs, menus, route transitions, and form errors with keyboard flows.
- Use logical CSS properties where practical.
- Treat mixed Persian/Latin strings, numbers, SKUs, and phone numbers as
  explicit formatting cases.
- Do not rely on visual direction alone for meaning or status.

---

## 8. Domain Architecture and Invariants

### 8.1 Identity and sessions

#### Customer

- Primary identity is a normalized, verified phone number.
- Customer OTP is six digits, single-use, short-lived, throttled, and never
  logged.
- OTP challenges use keyed verification or an equivalent server-secret-backed
  construction.
- Customer sessions are opaque, stored as hashes, and delivered with secure
  cookies.
- Guest checkout supports phone verification and cart association.

#### Staff

- Staff uses password plus TOTP MFA or a one-time recovery code.
- Passwords use a versioned strong password hash.
- TOTP secrets are encrypted at rest.
- Recovery codes are stored as keyed digests and claimed once.
- Staff sessions are distinct from customer sessions and immediately revocable.
- Login attempts are throttled by account/IP/security-state signals.

#### Authorization

V1 roles are fixed:

```
SUPPORT
  order.read
  customer.case_read
  return.review
  refund.request

OPERATIONS
  order.read
  fulfillment.write
  shipment.write
  inventory.read

ADMIN
  privileged catalog, content, payment, coupon, audit, and staff operations
```

The backend use case is the authorization boundary. Frontend route guards are
only a usability feature.

### 8.2 Catalog

```
Product
ProductVariant
ProductOption
ProductOptionValue
ProductVariantOptionValue
Category
ProductCategory
ProductMedia
VariantMedia
ProductAttribute
```

- A product represents the sellable concept.
- A variant represents a sellable option combination such as color and size.
- Every sellable variant has a stable SKU and price.
- Product lifecycle is DRAFT, PUBLISHED, or ARCHIVED.
- Historic orders do not depend on a mutable product row.
- Products used by historic orders are archived, not deleted.
- Category trees reject cycles and invalid assignment states.
- Public catalog reads expose only published and valid records.

Clothing-specific product confidence should be modeled deliberately: material,
care, garment measurements, fit note, model measurements, size guidance,
availability, delivery expectation, and returns policy.

### 8.3 Search

- Normalize Persian and Arabic character variants at the search boundary.
- Keep PostgreSQL as catalog/search truth for V1.
- Use full-text search and pg_trgm indexes for bounded typo and partial-match
  behavior.
- Bound result limits, suggestion limits, and expensive predicates.
- Keep price/stock authoritative reads in PostgreSQL and the domain modules.
- Capture no-result/search-quality signals for future ranking decisions.

Upgrade to a dedicated engine only after measured latency, catalog volume,
ranking, synonym, facet, or independently-scaled search requirements exist.

### 8.4 Cart

- Guest carts use an opaque token whose server representation is hashed.
- Authenticated cart ownership is durable and unique per customer where the
  product invariant requires it.
- Cart mutation idempotency prevents duplicate quantity changes.
- Cart state does not reserve inventory.
- When a guest authenticates, compatible lines merge through a server-owned
  conflict contract.
- Server price and stock always win during merge and checkout.

### 8.5 Checkout

One checkout application service owns final order intake and sequences:

```
identity
  ↓
authoritative cart
  ↓
variant and publication validation
  ↓
price and discount recalculation
  ↓
stock validation
  ↓
address validation
  ↓
shipping quote
  ↓
idempotent order intent
  ↓
inventory reservation
  ↓
order and address snapshots
  ↓
payment attempt
  ↓
provider redirect or fail-closed response
```

The checkout transaction persists the durable intent and reservation boundary
before external provider work. The payment adapter must not be called while a
database transaction is holding locks unnecessarily.

Checkout must be safe under:

- duplicate submits;
- browser refreshes;
- network timeouts;
- stale carts;
- changed price or stock;
- expired reservations;
- payment provider delays;
- contradictory callbacks;
- provider outages.

### 8.6 Inventory

V1 uses one logical stock location:

```
InventoryItem
InventoryReservation
StockMovement
```

Conceptually:

```
availableToSell = onHand - activeReservations
```

Rules:

- carts do not reserve stock;
- checkout creates reservations;
- reservations have explicit states: ACTIVE, CONSUMED, RELEASED, EXPIRED;
- reservation transitions are idempotent;
- concurrent checkout uses database locking/conditional updates;
- successful payment/order confirmation consumes the reservation;
- payment failure or expiry releases it;
- stock corrections create signed/audited movements;
- reserved stock cannot be manually reduced below the reserved quantity;
- every inventory adjustment records actor, reason, quantity, and reference.

### 8.7 Orders, payment, shipping, returns

Orders store immutable snapshots of:

- product/variant names and SKU;
- variant options;
- unit, discount, tax, shipping, and total amounts;
- recipient and address information;
- payment attempts and provider references required for audit;
- shipment method and tracking state.

Order, payment, shipment, return, and refund transitions are explicit. No
generic status mutation endpoint may bypass transition validation.

The browser redirect is never payment authority. A verified provider callback or
later reconciliation result must validate:

- provider and signature;
- provider event identity and replay hash;
- order/payment-attempt identity;
- expected amount and currency unit;
- current state and allowed transition.

If payment succeeds after an inventory reservation expires, the system attempts
safe reacquisition. If stock cannot be reacquired, the payment remains
observable and a separate idempotent refund record is created.

Shipment state is separate from payment state but synchronized through the
fulfillment use case. Paid orders may progress through preparation, shipping,
and delivery. Returns and refunds are distinct records and transitions.

### 8.8 Coupons and promotions

V1 supports bounded fixed/percentage coupon rules, minimum-order checks, and
global/per-user limits. Order-time redemption uses a durable reservation:

```
RESERVED → COMMITTED
RESERVED → RELEASED
```

Concurrent order attempts use conditional/locked capacity checks. Refunds do
not silently recreate coupon capacity; any future refund-credit rule requires a
new explicit decision.

### 8.9 Content and SEO

- Content pages are draft-first and publish only when usable.
- Public content reads expose published pages only.
- SEO metadata and redirects are managed through the API.
- Public clean routes are canonical; hash routes remain compatibility paths.
- SSR emits route-specific metadata, canonical URLs, Open Graph data, and safe
  JSON-LD where applicable.
- Private, search, temporary-state, admin, account, cart, checkout, and error
  routes are noindex.
- SSR/API failure produces a non-cacheable noindex response rather than partial
  indexable commerce content.
- HTML and JSON contexts are escaped before document insertion.

---

## 9. External Integration Boundaries

Every external provider is a replaceable effect, not a domain owner.

### 9.1 PaymentGateway

Responsibilities:

- create a provider payment request;
- verify callback signatures and payloads;
- return a small internal verification result;
- request idempotent refunds;
- expose provider transaction/event identifiers;
- translate provider units into integer toman domain values at the boundary.

The application never stores raw provider secrets or treats raw provider
payloads as domain state. It stores a payload hash and bounded diagnostics.

### 9.2 SmsProvider

Responsibilities:

- send OTP or transactional notifications;
- expose sanitized provider outcome/error categories;
- enforce provider-specific timeout, template, and retry behavior.

OTP values, secrets, and full provider responses never enter logs.

### 9.3 ShippingProvider

Responsibilities:

- return a bounded quote/ETA for supported methods;
- translate local policy/provider data into the domain shipping contract;
- create or update tracking references when a real provider is certified;
- expose sanitized failure categories.

Launch starts with one nationwide policy. Live carrier pricing and multiple
fulfillment locations are deferred until the real provider contract is known.

### 9.4 ObjectStorage

Responsibilities:

- create short-lived presigned upload/download URLs;
- restrict object key, operation, content type, and expiry;
- verify object metadata/checksum after upload;
- support quarantine, derivative, and deletion operations;
- keep provider-specific endpoint and credential handling out of domain code.

### 9.5 AnalyticsSink

Analytics is an asynchronous, non-authoritative effect. A failure to deliver an
analytics event must not fail checkout, payment, fulfillment, or staff actions.

---

## 10. Media Lifecycle

```
REQUESTED
  ↓ signed PUT
UPLOADED / PENDING VERIFICATION
  ↓ metadata, size, content, checksum validation
READY or QUARANTINED
  ↓ optional derivative worker
PUBLISHED / DERIVATIVE READY
  ↓ catalog removal
QUARANTINED / DELETED according to retention policy
```

Rules:

- Staff authorization occurs before issuing an upload URL.
- Object keys are server-generated and do not trust user-provided paths.
- Upload content type, size, and extension are validated.
- Public URLs come from persisted media state, not guessed identifiers.
- Deleting catalog media does not automatically destroy historic evidence or
  backups without an explicit retention policy.
- Production media backups use a second failure domain.

---

## 11. Background Jobs and Outbox

The API writes notification intents in the same transaction as the business
transition that requires them.

```
database transaction
  ├─ order/payment/shipment state change
  ├─ order/audit event
  └─ notification intent with unique dedupe key
             ↓ commit
worker lease
             ↓
provider adapter
             ↓
success / retry with backoff / terminal failure
```

Worker rules:

- at-least-once processing is expected;
- consumers must be idempotent;
- jobs are claimed conditionally with a lease/visibility window;
- retries use bounded exponential backoff;
- terminal failures remain operator-visible;
- payloads contain only the delivery intent required by the adapter;
- provider secrets and response bodies are not persisted;
- job metrics include backlog, oldest job, attempt count, and terminal failure.

The worker may later own scheduled reservation cleanup, coupon cleanup, payment
reconciliation, shipment reconciliation, media derivatives, and analytics
delivery. Each job must have an owner, dedupe rule, retry policy, and failure
signal.

---

## 12. Security Architecture

### 12.1 Cookie and session controls

- Opaque session tokens are random and only hashes are persisted.
- Session cookies are Secure, HttpOnly, SameSite=Lax unless a documented flow
  requires a stricter setting, and use an appropriate path/domain policy.
- Use a __Host- prefix where deployment topology permits.
- Rotate sessions after authentication and privilege-sensitive recovery.
- Support immediate staff session revocation.

### 12.2 CSRF and origin protection

Cookie-authenticated state-changing browser requests require:

- a readable bootstrap token where necessary;
- a custom CSRF request header;
- exact-origin validation;
- no state mutation on safe methods.

SameSite is defense in depth, not the only CSRF defense. Provider callbacks are
server-to-server endpoints and instead require provider signature verification.

### 12.3 Authorization

Authorization is enforced in guards and, more importantly, in the application
use case where the business mutation occurs. The frontend may hide controls but
cannot grant access.

### 12.4 Data minimization

Never log or return:

- OTPs;
- passwords;
- TOTP secrets;
- recovery codes;
- session tokens;
- storage credentials;
- payment credentials or raw payloads;
- unnecessary full addresses or customer records.

Operational inspection returns redacted, bounded data.

### 12.5 Provider fail-closed policy

Development/test may use explicit local adapters. Staging/production must fail
closed when payment, SMS, shipping, notification, storage, or encryption
credentials are not configured. A missing provider must never be reported as a
successful side effect.

---

## 13. Caching and Consistency

- PostgreSQL is the source of truth.
- TanStack Query caches server reads in the browser.
- Public SSR HTML may use short shared freshness and stale-while-revalidate
  headers after the route data is complete.
- Private, 404, 503, callback, mutation, and error responses use no-store or
  appropriately restrictive cache behavior.
- Search indexes, CDN media, and analytics are derived state.
- Cache invalidation follows successful mutation contracts and route identity.
- No cache may authorize a staff action or confirm payment.

---

## 14. Infrastructure and Deployment

### 14.1 First production shape

```
web/SSR container
api container
worker container
PostgreSQL service
Redis service
S3-compatible object storage
reverse proxy / TLS / optional CDN
```

The first deployment may use Docker Compose or an equivalent small container
orchestration layer. Application code is built into images; production must not
depend on host bind mounts for source code.

### 14.2 Environment configuration

packages/config validates environment values at process startup. Configuration
is injected by the deployment environment and never committed as credentials.

Representative groups:

- NODE_ENV and LOCAL_TEST_MODE safety gates;
- PostgreSQL connection and migration configuration;
- Redis connection and security-state configuration;
- public web/API origins and CSRF allowlists;
- session and encryption secrets;
- payment/SMS/shipping provider credentials;
- object-storage endpoint, bucket, access key, and secret;
- worker lease, retry, and polling intervals;
- SSR API origin and web origin;
- logging, metrics, and trace exporters.

Local fixtures are accepted only in development/test. They are rejected in
staging/production.

### 14.3 Health and readiness

- /health/live must not depend on PostgreSQL and answers process liveness.
- /health/ready verifies required dependencies for serving traffic.
- Worker health reports database connectivity and active worker state.
- Object storage, Redis, API, and worker health are included in deployment
  probes where the target environment supports them.

### 14.4 Backup and recovery

Backups cover both:

- PostgreSQL durable state;
- object-storage media and media metadata.

The database strategy must define dump/base backup, retention, encryption,
restore target, RPO, RTO, and a recurring restore drill. The second backup
location must be independent from the primary failure domain. A backup that has
not been restored is not launch evidence.

### 14.5 Deployment sequence

```
build immutable artifacts
  ↓
validate configuration and health probes
  ↓
run compatible database migrations
  ↓
start/restart web, API, and worker
  ↓
wait for readiness
  ↓
run smoke checks
  ↓
observe provider, queue, and error signals
```

Rollback must distinguish application rollback from irreversible database
migrations. Destructive schema changes require a backward-compatible migration
plan, backup evidence, and a recovery plan before execution.

---

## 15. CI/CD and Quality Gates

### 15.1 Required CI checks

```
install pinned dependencies
  ↓
format check
  ↓
lint
  ↓
typecheck
  ↓
focused unit and contract tests
  ↓
integration tests
  ↓
production build for API/web SSR/worker
  ↓
Docker Compose configuration validation
  ↓
provider-free smoke checks
```

### 15.2 Staging gates

Staging must add real, credentialed or sandboxed checks for:

- payment request, callback, replay, wrong amount, timeout, and refund;
- SMS OTP delivery and throttling;
- shipping quote/ETA/tracking contract;
- object upload, quarantine, derivative, and deletion;
- notification delivery and retry behavior;
- PostgreSQL backup and restore;
- SSR/public route behavior behind the real proxy/TLS topology.

### 15.3 Validation truthfulness

Every release reports checks as PASS, FAIL, PRE-EXISTING FAILURE, NOT RUN, or
BLOCKED. Local provider-free checks are not described as proof of production
provider readiness.

---

## 16. Testing Strategy

### 16.1 Unit tests

Cover pure domain rules and bounded helpers:

- Persian normalization;
- money and provider-unit conversion;
- price/discount/coupon rules;
- state transition guards;
- reservation expiry/consume/release;
- idempotency conflict behavior;
- role assertions;
- route/metadata/SEO resolution;
- query-key identity and local UI state transitions.

### 16.2 API and integration tests

Cover database-backed invariants:

- concurrent reservation attempts;
- duplicate checkout submit;
- cart merge conflicts;
- callback replay and conflicting hashes;
- late payment and refund creation;
- coupon capacity races;
- shipment/payment transition guards;
- notification outbox claim/retry/terminal failure;
- media presign/complete/quarantine/delete;
- audit and redaction boundaries.

### 16.3 Browser tests

Cover real user-visible paths:

- storefront discovery and product selection;
- auth and auth error recovery;
- guest/customer cart ownership and merge;
- checkout quote/submit/recovery;
- order and return states;
- staff login and role boundaries;
- admin catalog/inventory/order operations;
- RTL keyboard/accessibility behavior;
- clean SSR routes and noindex/private boundaries.

### 16.4 Provider contract tests

Every real adapter must have:

- request/response fixtures or sandbox tests;
- signature verification tests;
- timeout and retry tests;
- amount/unit conversion tests;
- duplicate/replay tests;
- redaction tests;
- explicit behavior when credentials are missing.

---

## 17. Observability

### 17.1 Structured logs

Logs include bounded event names, service, environment, request/correlation
identifier, route/use case, duration, result, and sanitized error code. Logs do
not contain secrets, OTPs, raw payment payloads, or unnecessary personal data.

### 17.2 Metrics

Minimum metrics:

- request count, latency, and error rate by route class;
- database transaction duration and connection failures;
- Redis availability and throttling failures;
- checkout quote/submit outcomes;
- reservation expiry and insufficient-stock rejection;
- payment callback success/failure/replay/wrong-amount;
- refund pending/failed/succeeded;
- notification backlog, attempts, and terminal failure;
- worker heartbeat and lease contention;
- media upload/quarantine/derivative failures;
- SSR 404/503/noindex and sitemap failures;
- backup age, size, and last restore-test result.

### 17.3 Traces

OpenTelemetry may trace API requests through database and provider boundaries.
Trace attributes must be sanitized and must not contain payment credentials,
OTP values, or full personal data. Browser instrumentation is optional and
must not make the storefront dependent on a telemetry provider.

### 17.4 Operational alerts

Alert on:

- payment callback or refund failure spikes;
- stuck/old notification jobs;
- repeated reservation cleanup failure;
- database/Redis/object-storage readiness failure;
- backup age or restore-test failure;
- provider latency/timeouts;
- SSR noindex/503 spikes;
- worker stopped or unable to lease jobs.

---

## 18. MVP and Explicit Non-Goals

### 18.1 V1 must support

Customer:

- home, categories, search, filters, sorting, pagination;
- product details, variants, sizes, media, stock, price, care, and returns;
- guest cart, customer cart, and merge conflict handling;
- phone OTP authentication;
- address, shipping quote, payment redirect, recovery, and confirmation;
- order history, tracking, cancellation, return request, and support entry.

Staff:

- staff password/TOTP login;
- catalog, variants, media, publication, inventory;
- orders, fulfillment, payments, refunds, returns, and coupons;
- customer support lookup;
- content, SEO metadata, redirects, audit, and notification inspection.

Reliability:

- inventory reservation concurrency;
- idempotent checkout and callbacks;
- late-payment/refund reconciliation;
- retryable notifications;
- backups and restore evidence;
- health, logs, metrics, and alerts.

### 18.2 V1 explicitly excludes

- marketplace/vendor settlement;
- multi-warehouse routing;
- multi-tenant commerce;
- native Android/iOS applications;
- loyalty tiers and points;
- advanced recommendation/personalization engines;
- social login, passkeys, or SSO;
- dynamic staff permission editor;
- generic promotion/workflow rule engines;
- arbitrary partial refunds;
- direct product exchanges as a separate fulfillment engine;
- multiple payment gateways at launch;
- cash on delivery;
- live carrier-rate orchestration;
- advanced experimentation infrastructure;
- realtime presence, chat, or collaborative features.

These remain possible only through clean boundaries and measured future need.

---

## 19. Critical Implementation Path

The architecture should be implemented in dependency order:

1. Preserve and stabilize packages/config, packages/db, and API/client
   contracts.
2. Keep Prisma migrations, seed behavior, and database invariants aligned with
   the domain rules in this document.
3. Complete provider-neutral payment, SMS, shipping, and object-storage seams;
   then certify the selected real providers in staging.
4. Complete customer storefront routing with React Router, clean public routes,
   hash compatibility, and SSR handoff.
5. Complete catalog/product/cart/checkout flows using TanStack Query and the
   bounded Zustand stores.
6. Keep staff/admin screens in the independent `apps/admin` app and complete
   them against the existing role/use-case boundaries.
7. Complete worker cleanup/reconciliation and operational dashboards.
8. Add production deployment, backup/restore, observability, and smoke gates.
9. Run the full release gate, including browser, integration, provider, and
   restore checks.

Do not start post-MVP features before the payment, inventory, fulfillment,
refund, provider, and recovery gates are credible.

---

## 20. Upgrade Triggers

### Search service

Upgrade when database profiling shows unacceptable search latency, catalog
volume materially competes with checkout, or ranking/synonym/facet needs exceed
PostgreSQL.

### Queue platform

Upgrade when workers need independent concurrency, priority queues, delayed
schedules, dead-letter handling, or high-volume media/search processing.

### Redis coordination

Expand Redis usage only when measured cache/fan-out/locking needs exist. Never
move durable commerce truth out of PostgreSQL without a new consistency design.

### Multi-warehouse

Add locations and allocation only when stock physically exists in more than one
fulfillment location and routing affects customer promises or cost.

### Multiple gateways

Add a second gateway only when provider availability, payment success, or product
requirements justify it. Keep the same PaymentGateway contract and callback
reconciliation rules.

### CDN and media processing

Add CDN, derivatives, and processing workers when image size, upload volume, or
mobile performance measurements show a material problem.

### Service decomposition

Split a module into a service only when independent deployment/scaling, failure
isolation, ownership, or regulatory boundaries justify the distributed-system
cost. First preserve the module contract and an anti-corruption boundary.

### Kubernetes or multi-region deployment

Adopt only when multiple hosts, autonomous scaling, failure-domain strategy, or
an operations team capable of maintaining the platform is actually required.

---

## 21. Durable Rules for Future Changes

Before changing architecture, answer:

1. What measured problem exists?
2. Which module owns the behavior today?
3. Which contract or invariant changes?
4. What users and consumers are affected?
5. What migration and rollback path exists?
6. What new operational complexity is introduced?
7. What validation proves the change?
8. What is the trigger for revisiting the decision?

When a durable cross-module decision changes, add or update an ADR in
docs/adr/. Update this document when the architecture itself changes.

Do not add a technology because a reference platform uses it. Adopt it only
when NOVA's requirements and measured evidence justify the complexity.

---

## 22. Evidence and Related Decisions

Primary project evidence:

- [search.md](search.md)
- [README.md](README.md)
- [docs/adr/0001-foundation.md](docs/adr/0001-foundation.md)
- [docs/adr/0005-inventory-reservation-concurrency.md](docs/adr/0005-inventory-reservation-concurrency.md)
- [docs/adr/0006-checkout-transaction-boundaries.md](docs/adr/0006-checkout-transaction-boundaries.md)
- [docs/adr/0007-staff-authentication-and-sessions.md](docs/adr/0007-staff-authentication-and-sessions.md)
- [docs/adr/0009-payment-callbacks-and-reconciliation.md](docs/adr/0009-payment-callbacks-and-reconciliation.md)
- [docs/adr/0014-notification-outbox.md](docs/adr/0014-notification-outbox.md)
- [docs/adr/0015-coupon-redemption-lifecycle.md](docs/adr/0015-coupon-redemption-lifecycle.md)
- [docs/adr/0018-cart-merge-conflict-contract.md](docs/adr/0018-cart-merge-conflict-contract.md)
- [docs/adr/0019-catalog-search-suggestions.md](docs/adr/0019-catalog-search-suggestions.md)
- [docs/adr/0020-seo-metadata-and-redirects.md](docs/adr/0020-seo-metadata-and-redirects.md)
- [docs/adr/0024-hybrid-rendering-indexability.md](docs/adr/0024-hybrid-rendering-indexability.md)
- [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma)
- [infra/docker/compose.yml](infra/docker/compose.yml)

External evidence informing the architecture:

- [Medusa architecture](https://docs.medusajs.com/learn/introduction/architecture)
- [Saleor core](https://github.com/saleor/saleor)
- [Vendure core and state-machine model](https://github.com/vendurehq/vendure)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
- [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
