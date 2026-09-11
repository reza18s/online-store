# NOVA Store

> Product, engineering, architecture, security, infrastructure, design, SEO, and launch plan for an Iran-first single-merchant ecommerce platform built with Node.js, NestJS, Prisma, PostgreSQL, React, Vite, TanStack Query, shadcn/ui, Zustand, Tailwind CSS, Redis, and S3-compatible storage.

---

## 1. Project status

The repository currently contains:

- The initial Bun workspace scaffold.
- A front-end-only **Atelier Editorial** preview in `apps/web`.
- Persian RTL storefront and admin preview screens.
- Responsive static customer journeys.
- Locally stored editorial assets.
- Architecture and design documentation.

The preview is intentionally non-production. It demonstrates layout, navigation, storefront flows, account states, checkout states, and admin concepts without requiring:

- A production database.
- Real authentication.
- Payment credentials.
- SMS credentials.
- Shipping integration.
- Production infrastructure.

Production application modules, persistence, authentication, payment processing, inventory mutation, checkout orchestration, and real admin operations are not implemented yet.

The product category is:

- Women’s clothing.
- Men’s clothing.
- Children’s clothing.
- Selected accessories.
- Seasonal collections.

All domain money values use **integer toman values**.

Implementation may begin once the architecture decisions that affect domain invariants are resolved. Vendor, marketing, hosting, and brand decisions do not block unrelated engineering work.

---

# 2. Front-end preview

The first visual direction is **Atelier Editorial**.

It currently lives in:

```text
apps/web
```

Run it with:

```powershell
cd apps/web
bun run dev
```

Open:

```text
http://localhost:5173
```

The preview:

- Does not require a backend.
- Does not require production credentials.
- Uses local editorial images.
- Demonstrates Persian RTL behavior.
- Demonstrates major customer and admin screen groups.
- Is not the production application architecture.

The production storefront remains based on:

```text
React
Vite
TypeScript
TanStack Query
React Hook Form
Zod
shadcn/ui
Tailwind CSS
```

Production behavior must use shared API contracts and server-owned commerce state rather than the static data currently used by the preview.

---

# 3. Executive decisions

| Area                   | Decision                                                |
| ---------------------- | ------------------------------------------------------- |
| Business model         | Single-merchant ecommerce                               |
| Audience               | Persian-speaking customers in Iran                      |
| Product category       | Women’s, men’s, and children’s clothing                 |
| Domain money unit      | Integer toman                                           |
| Backend                | Node.js + NestJS                                        |
| Database               | PostgreSQL                                              |
| ORM                    | Prisma                                                  |
| Frontend               | React + Vite + TypeScript                               |
| Server state           | TanStack Query                                          |
| Local UI state         | Zustand                                                 |
| Forms                  | React Hook Form + Zod                                   |
| UI primitives          | shadcn/ui                                               |
| Styling                | Tailwind CSS + CSS variables                            |
| Queue/cache            | Redis-compatible service                                |
| Media                  | S3-compatible object storage                            |
| API style              | REST-first                                              |
| Public rendering       | SSR/hybrid rendering for indexable storefront pages     |
| Admin rendering        | Client-rendered application                             |
| Architecture style     | Modular monolith                                        |
| Deployment             | Docker-based                                            |
| Primary infrastructure | Iranian provider                                        |
| Backup                 | Independent second Iranian failure domain               |
| Search V1              | PostgreSQL full-text search + trigram matching          |
| Authentication         | Customer phone OTP; staff password + TOTP               |
| Checkout               | Guest checkout supported                                |
| Inventory              | Reserve only during checkout                            |
| Payment                | One gateway at launch behind an adapter                 |
| Shipping               | One simple nationwide shipping policy behind an adapter |
| CI                     | From Phase 1                                            |
| CD                     | Added after deployment workflow is stable               |

---

# 4. Architectural principles

NOVA should be designed around a small number of rules.

## 4.1 Build a strong V1, not the final company

The first release must support reliable commerce without implementing every possible future feature.

Do not build speculative systems for:

- Marketplace vendors.
- Loyalty tiers.
- Multiple warehouses.
- Dynamic policy engines.
- Arbitrary promotion rules.
- Recommendation engines.
- Social login.
- SSO.
- Native mobile applications.
- Generic workflow engines.

Future features should be possible because the core boundaries are clean, not because every future abstraction already exists.

---

## 4.2 Deep modules over shallow wrappers

Each important module should hide meaningful behavior.

Good module boundaries include:

- Identity.
- Catalog.
- Search.
- Cart.
- Checkout.
- Inventory.
- Orders.
- Payments.
- Shipping.
- Returns.

Avoid modules that only rename or pass through another module.

---

## 4.3 One owner for every business invariant

Examples:

- Checkout owns checkout sequencing.
- Inventory owns reservation and stock mutation.
- Payment owns payment attempt semantics.
- Orders own fulfillment state.
- Identity owns sessions and authentication.
- Search owns Persian normalization and query behavior.

Do not spread one invariant across controllers, frontend components, jobs, and database hooks.

---

## 4.4 Server is authoritative for commerce truth

The browser must never be authoritative for:

- Price.
- Discount.
- Shipping cost.
- Inventory.
- Order total.
- Payment status.
- Refund status.
- Fulfillment status.

The server may accept customer intent, but the server recomputes and validates all authoritative values.

---

## 4.5 External providers are replaceable effects

Use adapters for real external variation:

```text
PaymentGateway
SmsProvider
ShippingProvider
ObjectStorage
AnalyticsSink
```

Provider-specific vocabulary, retry rules, signatures, timeouts, and conversions should not leak through the application.

---

# 5. Goals

NOVA should:

- Load quickly on typical Iranian mobile connections.
- Work correctly in Persian RTL.
- Safely display mixed Persian and Latin content.
- Make product discovery simple.
- Make size, color, price, availability, delivery, and returns easy to understand.
- Support guest checkout.
- Prevent overselling.
- Prevent duplicate orders.
- Recover cleanly from payment failures.
- Keep historic orders immutable.
- Provide operational visibility for staff.
- Support indexable public pages.
- Avoid mandatory foreign infrastructure dependencies.
- Remain portable between Iranian providers.
- Have measurable acquisition and contribution margin.

---

# 6. Non-goals for the first release

The following are explicitly out of V1:

- Marketplace/vendor settlement.
- Multi-vendor catalog ownership.
- Multi-warehouse routing.
- Native Android or iOS applications.
- Loyalty levels and points.
- Advanced recommendation engines.
- Social authentication.
- Passkeys.
- SSO.
- User-created staff roles.
- Dynamic authorization policy engine.
- Generic promotion rule engine.
- Arbitrary partial refunds.
- Direct product exchanges.
- Multiple payment gateways.
- Cash on delivery.
- Live carrier pricing.
- Complex referral system.
- Price history.
- Advanced personalization.
- Full experimentation platform.

---

# 7. Product scope

## 7.1 Primary customer journey

```text
Home
  ↓
Category / Search
  ↓
Product
  ↓
Cart
  ↓
Address
  ↓
Shipping
  ↓
Payment
  ↓
Confirmation
  ↓
Tracking
  ↓
Support / Return
```

---

# 8. P0 launch features

## 8.1 Storefront

- Home page.
- Women’s category.
- Men’s category.
- Children’s category.
- Category landing pages.
- Product listings.
- Search.
- Filtering.
- Sorting.
- Pagination.
- Product detail.
- Variant selection.
- Size selection.
- Stock state.
- Guest cart.
- Authenticated cart.
- Cart merge after authentication.
- Address entry.
- Shipping selection.
- Checkout.
- Payment redirect.
- Payment recovery.
- Order confirmation.
- Order tracking.
- Customer profile.
- Addresses.
- Orders.
- Support entry.
- Shipping policy.
- Returns policy.
- Size guide.
- Privacy and terms.
- Offline/error/maintenance states.
- Persian RTL.
- Responsive mobile-first behavior.
- Keyboard accessibility.

---

## 8.2 Admin

- Staff login.
- Product CRUD.
- Variant CRUD.
- Category CRUD.
- Media management.
- Inventory management.
- Product publication lifecycle.
- Order list.
- Order detail.
- Fulfillment state changes.
- Payment inspection.
- Refund workflow.
- Return requests.
- Coupon management.
- Customer case lookup.
- SEO metadata.
- Content pages.
- Redirects.
- Audit log.

The admin frontend is a caller of domain modules. There is no generic backend `Admin` domain module owning unrelated business behavior.

---

## 8.3 Operations

- Inventory reservations.
- Reservation expiry.
- Idempotent checkout.
- Idempotent payment callbacks.
- Payment reconciliation.
- Refund workflow.
- Retryable notifications.
- Shipping tracking reference.
- Structured application logs.
- Health checks.
- Metrics.
- Backup verification.
- Audit events.
- Operational alerts.

---

# 9. P1 after launch

P1 should be selected from real customer evidence.

Likely candidates:

- Wishlist.
- Back-in-stock alerts.
- Verified purchase reviews.
- Review moderation.
- Product Q&A.
- Abandoned-cart reminders.
- Browse reminders.
- Referral codes.
- Simple store credit.
- Product comparison.
- Bundles.
- Flash campaigns.
- Related-product rules.
- Customer support inbox integration.
- Multiple shipping options.
- Additional payment provider.

---

# 10. P2 after product evidence

Potential P2 features:

- Loyalty points.
- Loyalty tiers.
- Price-drop alerts.
- Advanced recommendation system.
- Multi-warehouse inventory.
- Marketplace vendors.
- Native apps.
- Advanced customer segmentation.
- Automated LTV models.
- Experiment platform.

---

# 11. Repository structure

Recommended production structure:

```text
CONTEXT.md

apps/
  storefront/
  admin/
  api/
  worker/

packages/
  db/
  api-client/
  contracts/
  ui/
  config/

infra/
  docker/
  deploy/
  monitoring/

docs/
  adr/
  designs/
  runbooks/
  seo/
  marketing/
  infrastructure/
```

Responsibilities:

```text
apps/storefront
Customer storefront and account surface.

apps/admin
Internal operations application.

apps/api
NestJS modular monolith.

apps/worker
Background queues and asynchronous provider effects.

packages/db
Prisma schema, migrations, seed data, database helpers.

packages/api-client
Generated typed REST client.

packages/contracts
Shared schemas and transport contracts where appropriate.

packages/ui
Reusable branded UI composition and design tokens.

packages/config
Shared TypeScript, lint, Tailwind, env, and build configuration.
```

---

# 12. Domain context

`CONTEXT.md` must define the vocabulary used throughout the project.

At minimum:

```text
Customer
Staff
Product
Variant
Option
Inventory
Reservation
Available to sell
Cart
Checkout
Order
Payment attempt
Refund
Return
Shipment
Coupon
Audit event
Provider callback
```

Important invariants must also be recorded there.

---

# 13. Backend module boundaries

Recommended NestJS capability boundaries:

```text
Identity
Customers

Catalog
Search

Cart
Checkout
Orders

Inventory
Payments
Shipping

Coupons
Returns

Content
Notifications
Audit
```

Modules should own:

- Application use cases.
- Domain rules.
- Persistence access.
- Internal policies.
- Public contracts.
- Their own failure semantics.

A module should expose only what another module genuinely needs.

---

# 14. Identity and access

Identity is a deep module, not a generic security bucket.

## 14.1 Customer identity

Customer identity is based on a:

```text
normalized verified phone number
```

V1 does not support:

- Username login.
- Email login.
- Social login.
- Passkeys.

Email may exist as optional profile data.

---

## 14.2 Customer authentication

Customer authentication uses:

```text
6-digit OTP
```

Rules:

- Expires after 5 minutes.
- Single-use.
- Maximum 5 verification attempts.
- 60-second resend cooldown.
- Creating a new OTP invalidates the previous OTP.
- Rate-limit by phone.
- Rate-limit by IP.
- Rate-limit by device/session signals where practical.
- Generic error responses.
- OTP value must never be logged.

---

## 14.3 OTP storage

A six-digit code has limited entropy.

Do not rely only on a normal unkeyed hash.

Store a keyed verifier such as:

```text
HMAC(serverSecret, challengeId + otp)
```

or an equivalent server-secret-backed construction.

Temporary OTP state belongs in Redis.

Persist only information that genuinely requires durable storage.

---

# 15. Customer and staff separation

Use separate identity classes.

Recommended model:

```text
Customer
CustomerSession

StaffUser
StaffSession
StaffRole
```

Do not represent customers and privileged staff as one interchangeable session type.

A customer session must never become a staff session.

---

# 16. Staff authentication

Staff users authenticate using:

```text
password
+
TOTP MFA
```

Recovery codes are supported.

Rules:

- Strong password hashing.
- TOTP required for privileged access.
- Recovery codes hashed at rest.
- Login throttling.
- Sensitive security events audited.
- Session revoked after critical credential changes.

---

# 17. Staff roles

V1 has exactly:

```text
SUPPORT
OPERATIONS
ADMIN
```

Do not create a custom role editor.

Do not create a policy engine.

Permissions are explicit in code.

Conceptually:

```text
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
  privileged commerce administration
```

Deny by default.

Authorization must be enforced inside use cases, not only in controllers or frontend navigation.

---

# 18. Session model

Use opaque server sessions.

Storage:

```text
PostgreSQL → durable session record
Redis → temporary security/rate-limit state
```

Cookie requirements:

```text
Secure
HttpOnly
SameSite=Lax
Path=/
__Host- prefix where deployment topology permits
```

Customer sessions:

```text
30-day idle timeout
90-day absolute maximum
```

Staff sessions:

```text
8-hour idle timeout
24-hour absolute maximum
```

Rotate session identifiers:

- After authentication.
- After privilege changes.
- After sensitive recovery actions.

Support immediate session revocation.

---

# 19. CSRF

Cookie-authenticated state-changing requests require:

- CSRF token in a custom request header.
- Origin validation.

`GET` requests must never mutate application state.

---

# 20. Customer recovery

Lost-phone recovery is not automated in V1.

It is a manual support process with documented verification rules.

Changing a phone number requires:

1. Verify the old phone.
2. Verify the new phone.
3. Change identity.
4. Revoke all existing sessions.
5. Record a security audit event.

---

# 21. Guest checkout

Guest checkout is supported.

During checkout:

1. Customer provides a phone number.
2. Phone is verified.
3. Guest cart is associated with the verified identity.
4. Compatible cart lines merge.
5. Server price and stock always win.
6. Conflicts are shown to the customer before continuation.

A guest order may be accessed using:

```text
order number
+
fresh phone OTP
```

---

# 22. Catalog model

Recommended first-release product model:

```text
Product
ProductVariant

ProductOption
ProductOptionValue
ProductVariantOptionValue

Category
ProductCategory

ProductMedia
VariantMedia
```

---

# 23. Product and variant semantics

A product represents the sellable concept.

Example:

```text
Classic Cotton T-Shirt
```

Options describe customer choices:

```text
Color
Size
```

Values:

```text
Color
  Black
  White
  Blue

Size
  S
  M
  L
```

Variants represent sellable combinations:

```text
Black / S
Black / M
Black / L
White / S
...
```

Each variant may own:

- SKU.
- Price.
- Compare-at price.
- Inventory item.
- Barcode if required.
- Availability.
- Variant-specific media.

Do not use a fully generic EAV architecture for every product property.

Non-variant descriptive specifications may use structured fields or controlled JSON where appropriate.

---

# 24. Catalog lifecycle

Products support:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Historic order data never depends on the current product record.

Deleting a product used by a historic order is not allowed.

Archive it instead.

---

# 25. Money contract

The domain money unit is:

```text
TOMAN
```

All domain money values are integers.

Examples:

```text
2490000
```

Customer display:

```text
۲٬۴۹۰٬۰۰۰ تومان
```

Never store floating-point monetary values.

---

# 26. Provider money boundary

Some providers may use a different monetary unit.

Conversion happens only inside the provider adapter.

Example:

```text
Domain:
2,490,000 TOMAN

Gateway:
24,900,000 RIAL
```

Payment records should make this auditable.

Where needed record:

```text
domainAmount
domainUnit

providerAmount
providerUnit

conversionFactor
```

Never scatter:

```text
amount * 10
```

through controllers or checkout code.

---

# 27. Inventory model

Recommended model:

```text
InventoryItem
InventoryReservation
StockMovement
```

For the first release, assume one logical stock location.

Do not introduce multi-warehouse routing yet.

---

# 28. Inventory availability

Conceptually:

```text
availableToSell =
onHand
-
activeReservations
```

Do not infer real inventory from cached product responses.

All inventory mutations must pass through the inventory module.

---

# 29. Reservation states

Inventory reservations use explicit states:

```text
ACTIVE
CONSUMED
RELEASED
EXPIRED
```

Rules:

- Cart does not reserve stock.
- Checkout creates reservations.
- Default reservation TTL is 15 minutes.
- Successful order/payment flow consumes the reservation.
- Payment failure releases it.
- Expiry releases it.
- Reservation transitions are idempotent.

---

# 30. Checkout ownership

One checkout application service owns final order intake.

It orchestrates:

```text
cart
↓
identity
↓
pricing
↓
coupon
↓
inventory
↓
shipping
↓
order
↓
payment attempt
```

The browser never decides workflow order.

---

# 31. Checkout sequence

Recommended simplified sequence:

```text
1. Validate customer identity.
2. Load authoritative cart.
3. Validate variants.
4. Recalculate prices.
5. Recalculate discounts.
6. Validate stock.
7. Validate address.
8. Calculate shipping.
9. Create checkout/order idempotency record.
10. Create inventory reservations.
11. Create pending order.
12. Create payment attempt.
13. Return provider redirect information.
```

Exact transaction boundaries must be documented in an ADR.

---

# 32. Checkout idempotency

Every checkout submission requires an idempotency key.

Repeated requests with the same valid key must not create:

- Additional orders.
- Additional reservations.
- Additional payment intents unless the existing payment attempt explicitly allows retry.

Duplicate clicks and network retries must reuse the same checkout intent.

---

# 33. Order status

Order fulfillment and payment are separate state machines.

Order state:

```text
PENDING_PAYMENT
CONFIRMED
PREPARING
SHIPPED
DELIVERED

CANCELLED
RETURNED
```

Do not encode payment state into the order state.

---

# 34. Payment state

Payment attempt state:

```text
CREATED
REDIRECTED
PENDING
PAID
FAILED
CANCELLED
EXPIRED
```

A payment is `PAID` only after:

- A verified provider callback.

or:

- Server-side reconciliation with the provider.

Browser redirect success is not authoritative.

---

# 35. Refund state

Refund is a separate object.

Recommended states:

```text
PENDING
SUCCEEDED
FAILED
```

A refund request is not equivalent to a completed refund.

This must remain observable to operators.

---

# 36. Payment callbacks

Payment webhooks/callbacks must:

- Verify signature where available.
- Validate expected provider identifiers.
- Use a unique provider event identifier where possible.
- Be idempotent.
- Record processing outcome.
- Store a safe payload hash or sanitized event record.
- Never leak secrets into logs.

Duplicate callbacks must be harmless.

---

# 37. Late payment after reservation expiry

This is an explicit business invariant.

Example:

```text
Reservation expires at minute 15.
Provider confirms payment at minute 16.
```

NOVA must not silently confirm an unavailable order.

Required behavior:

```text
Late paid callback
        ↓
Attempt to reacquire required inventory
        ↓
   ┌───────────────┐
   │               │
Success         Unavailable
   │               │
Confirm       Payment exception
order               │
                    ↓
                 refund
                    +
              operator alert
```

This scenario requires an integration test.

---

# 38. Immutable order snapshots

Once an order is submitted, store snapshots for:

- Product identity.
- Product title.
- SKU.
- Selected options.
- Quantity.
- Unit price.
- Discount.
- Tax-relevant values if used.
- Shipping amount.
- Order totals.
- Delivery address.
- Delivery method.

Changing the product later must not alter historic orders.

---

# 39. Orders cannot be edited after submission

Customers cannot directly edit submitted orders.

Before fulfillment they may request cancellation where policy permits.

Paid cancellation creates a refund workflow.

Staff state overrides require:

- Appropriate permission.
- Reason.
- Audit event.

---

# 40. Returns

Launch return policy:

- Customer may request a return within seven days after delivery.
- Product must be unused.
- Product must be unwashed.
- Required tags must remain attached.
- Direct exchange is not supported in V1.

Recommended entities:

```text
ReturnRequest
ReturnItem
Refund
```

---

# 41. Return shipping

Store covers return shipping when the reason is:

- Damaged item.
- Incorrect item.
- Defective item.

Customer covers return shipping when the reason is:

- Size preference.
- Color preference.
- Change of mind where policy permits.

---

# 42. Shipping

V1 supports:

- Nationwide delivery.
- One shipping method.
- Simple fixed or destination-based pricing.
- Tracking reference.

Carrier/provider behavior is hidden behind:

```text
ShippingProvider
```

Do not introduce live carrier quoting until needed.

---

# 43. Coupons

Keep V1 promotions intentionally small.

Recommended model:

```text
Coupon
CouponRedemption
```

Supported rules may include:

- Fixed amount.
- Percentage discount.
- Minimum order.
- Start date.
- End date.
- Global usage limit.
- Per-customer usage limit.
- Product/category restriction.

Do not create a generic dynamic promotion rules engine in V1.

---

# 44. Search architecture

Search is a first-class capability.

V1 uses PostgreSQL.

Recommended:

```text
PostgreSQL full-text search
+
pg_trgm
+
normalized searchable columns
```

A dedicated search engine should be introduced only when measured requirements justify it.

---

# 45. Persian search normalization

Search normalization must explicitly handle Persian/Arabic text differences.

Examples:

```text
ي → ی
ك → ک
```

Also normalize where appropriate:

- Arabic/Persian digits.
- Extra whitespace.
- Zero-width characters.
- Half-space variants.
- Repeated spaces.
- Search punctuation.
- Case for embedded Latin terms.

Original customer-visible text remains unchanged.

Normalization is for search indexes/query processing.

---

# 46. Search P0 behavior

P0 search supports:

- Product title matching.
- Category matching.
- SKU matching where appropriate.
- Typo tolerance through trigram similarity.
- Search suggestions.
- Recent local searches.
- Popular query support when enough data exists.
- No-result recovery.
- Filtering.
- Sorting.
- Pagination.

Do not promise sophisticated semantic search in V1.

---

# 47. Initial data model

First-release Prisma schema should focus on actually shipping features.

Recommended minimum:

```text
Customer
CustomerSession
Address

StaffUser
StaffSession

Product
ProductVariant
ProductOption
ProductOptionValue
ProductVariantOptionValue
ProductMedia
VariantMedia

Category
ProductCategory

InventoryItem
InventoryReservation
StockMovement

Cart
CartItem

Order
OrderItem
OrderAddressSnapshot
OrderEvent

PaymentAttempt
WebhookEvent
Refund

Shipment

Coupon
CouponRedemption

ReturnRequest
ReturnItem

ContentPage
SeoMetadata
Redirect

AuditEvent
NotificationJob
```

Do not add future-feature tables merely because they may eventually be useful.

---

# 48. Database rules

At minimum:

- Unique normalized customer phone.
- Unique active product slug.
- Unique SKU.
- Unique order number.
- Unique payment provider transaction identifier where required.
- Unique webhook provider event identifier where available.
- Indexed order status + creation date.
- Indexed payment status.
- Indexed inventory variant/item reference.
- Indexed active reservations + expiration.
- Indexed coupon code.
- Indexed content slug.
- Indexed redirect source path.

Use PostgreSQL constraints where they strengthen invariants.

Do not rely only on application validation.

---

# 49. Transactions and concurrency

Transaction boundaries must explicitly cover:

- Reservation creation.
- Reservation consumption.
- Stock movement.
- Order creation.
- Coupon redemption.
- Payment reconciliation updates where necessary.

Concurrency tests must include:

```text
multiple customers buying the final unit
duplicate checkout request
duplicate webhook
simultaneous reservation expiry/payment callback
coupon limit race
```

---

# 50. API architecture

V1 API is REST-first.

Prefix:

```text
/v1
```

Example customer routes:

```text
GET    /v1/catalog/categories
GET    /v1/catalog/products
GET    /v1/catalog/products/:slug

GET    /v1/search

POST   /v1/auth/otp/request
POST   /v1/auth/otp/verify
POST   /v1/auth/logout

POST   /v1/carts
GET    /v1/cart
POST   /v1/cart/items
PATCH  /v1/cart/items/:itemId
DELETE /v1/cart/items/:itemId

POST   /v1/checkout/quote
POST   /v1/checkout/orders

GET    /v1/orders
GET    /v1/orders/:orderNumber

POST   /v1/orders/:orderNumber/cancel
POST   /v1/orders/:orderNumber/returns

POST   /v1/payments/:provider/callback
```

Admin routes are separately namespaced and guarded:

```text
/v1/admin/...
```

---

# 51. API contracts

Generate or derive a typed client from the API contract.

Recommended approach:

```text
NestJS
  ↓
OpenAPI
  ↓
generated TypeScript client
  ↓
storefront/admin
```

Avoid manually duplicating every transport interface across frontend and backend.

Domain internals do not need to be exposed merely because the transport is typed.

---

# 52. API error format

Use one predictable application error format.

Conceptually:

```json
{
  "code": "CART_STOCK_CONFLICT",
  "message": "Customer-safe localized message",
  "details": {},
  "requestId": "..."
}
```

Do not expose:

- Stack traces.
- SQL errors.
- Provider secrets.
- Internal exception messages.

Frontend logic should branch on stable error codes, not translated error strings.

---

# 53. Frontend state ownership

Do not duplicate server commerce state between Zustand and TanStack Query.

## TanStack Query owns

- Products.
- Categories.
- Search responses.
- Server cart.
- Cart lines.
- Cart totals.
- Prices.
- Availability.
- Checkout quotes.
- Orders.
- Payments.
- Customer profile.
- Addresses.
- Admin server data.

It also owns optimistic server mutations and rollback where appropriate.

---

## Zustand owns

Only client-local cross-component interaction state such as:

- Cart drawer open/closed.
- Navigation UI.
- Theme if needed.
- UI preferences.
- Recently chosen option UI where appropriate.
- Very small guest session references if required.

Zustand is not a second API cache.

---

# 54. URL state

Use router/search parameters for shareable state.

Examples:

- Audience.
- Category.
- Size.
- Color.
- Material.
- Price.
- Stock.
- Sale.
- Sort.
- Pagination.

Changing filter/sort resets pagination.

Back/forward navigation must restore the result state correctly.

---

# 55. Forms

Use:

```text
React Hook Form
+
Zod
```

for customer and admin forms.

Server validation remains authoritative.

Frontend validation improves UX but is not a security boundary.

---

# 56. Cart behavior

Cart server truth belongs to the API.

Optimistic quantity changes may be handled through TanStack Query.

On server conflict:

- Roll back optimistic state.
- Display exact conflict.
- Show current stock.
- Show updated price.
- Preserve unaffected lines.

Do not silently remove or alter customer selections.

---

# 57. Guest cart merge

After successful customer verification:

```text
guest cart
+
existing customer cart
↓
server merge
```

Rules:

- Compatible identical lines may combine.
- Server stock wins.
- Current server price wins.
- Invalid variants are not silently retained.
- Conflicts are returned explicitly.
- Customer receives a conflict UI before destructive changes where practical.

---

# 58. Rendering strategy

The storefront requires indexable initial HTML.

Architecture decision:

```text
Public storefront → SSR / hybrid rendering
Admin → SPA
Editorial/static pages → prerender where beneficial
```

Do not leave production rendering indefinitely defined as:

```text
SSR or prerender
```

The selected implementation must be documented in an ADR before production storefront development.

---

# 59. Public read model

SSR, API reads, sitemap generation, metadata, canonical links, and structured data must agree on the same public catalog truth.

Do not create separate SEO-only catalog behavior that can disagree with customer-visible product state.

---

# 60. Design directions

Current design candidates:

```text
AE  = Atelier Editorial
NAE = NOVA Atelier Editorial
QG  = Quiet Grid
```

No other direction identifier should appear unless explicitly added later.

---

# 61. Design selection process

Do not fully design every state for every direction.

## Stage 1 — compare directions

Each direction should initially cover:

```text
HOME
PLP
PDP
CART
CHECKOUT
ADMIN representative screen
```

At:

```text
1440 desktop
390 mobile
```

Review:

- Brand fit.
- Persian RTL.
- Product clarity.
- Product comparison.
- Mobile usability.
- Checkout clarity.
- Admin usability.
- Accessibility.
- Photography compatibility.

---

## Stage 2 — select production direction

Choose one winner.

Only the selected direction receives the complete production design system.

---

## Stage 3 — expand winner

The selected direction then receives:

- Tablet layouts.
- 360 px layouts.
- Full account screens.
- Full checkout states.
- Admin screens.
- Loading.
- Error.
- Empty.
- Offline.
- Permission states.
- Conflict states.
- Payment recovery.
- Accessibility states.

This avoids producing hundreds of throwaway frames.

---

# 62. Design system contract

Use a shared token layer for:

- Color.
- Typography.
- Spacing.
- Radius.
- Elevation.
- Motion.
- z-index.

Prefer CSS logical properties:

```text
margin-inline
padding-inline
inset-inline
border-inline
```

Avoid hardcoding directional left/right assumptions when a logical equivalent exists.

---

# 63. Layout contract

The architecture document defines:

- Breakpoints.
- Grids.
- Containers.
- Gaps.
- Min/max sizing.
- Sticky behavior.
- Safe areas.
- Content constraints.

Exact Figma x/y coordinates and screenshot scroll offsets belong in:

```text
docs/designs/
```

They are QA evidence, not application architecture.

---

# 64. Required responsive widths

Production review includes:

```text
1440
1280
1024
768
390
360
```

Important guarantees at 360:

- No unintended horizontal scroll.
- Minimum usable touch targets.
- Long Persian labels remain usable.
- Prices do not clip.
- Mixed Latin references do not corrupt RTL layout.
- Primary actions remain reachable.

---

# 65. Accessibility target

Public storefront and admin target:

```text
WCAG 2.2 Level AA
```

At minimum test:

- Keyboard navigation.
- Focus visibility.
- Dialog focus trapping.
- Focus restoration.
- Form labels.
- Validation messages.
- Status announcements.
- Reduced motion.
- Touch target size.
- Contrast.
- Semantic landmarks.
- RTL screen-reader behavior.
- Mixed LTR references.

Do not communicate status using color alone.

---

# 66. Customer-visible Persian taxonomy

Fixed audience labels:

```text
زنانه
مردانه
بچگانه
```

Use consistently across:

- Navigation.
- Categories.
- Breadcrumbs.
- Campaigns.
- Filters.
- Fixtures.
- Admin taxonomy.

---

# 67. Mixed-direction text

Explicitly isolate LTR strings such as:

- SKU.
- Phone.
- Order number.
- Tracking code.
- Payment reference.
- Coupon.
- URLs.

Use appropriate direction isolation rather than relying on surrounding RTL context.

---

# 68. Infrastructure objectives

Production infrastructure should:

- Keep critical services available to Iranian customers.
- Avoid unnecessary foreign dependencies.
- Keep application deployment portable.
- Keep PostgreSQL and Redis private.
- Maintain independent backups.
- Support tested restores.
- Support rollback.
- Provide observable failures.

---

# 69. Initial production topology

Conceptually:

```text
Browser
   |
   v
DNS + TLS
   |
Reverse Proxy
   |
   +-------------------+
   |                   |
Storefront          NestJS API
                       |
        +--------------+-------------+
        |              |             |
    PostgreSQL       Redis        Object storage
        |
    Backup/WAL
        |
Independent Iranian backup target
```

---

# 70. Initial capacity

Starting pilot target:

```text
Application/worker:
~4 vCPU
~8 GB RAM

PostgreSQL:
~4 vCPU
~8 GB RAM
NVMe-backed storage
```

These are not guaranteed production capacity values.

Benchmark with realistic:

- Catalog.
- Image volume.
- Search traffic.
- Checkout concurrency.
- Worker jobs.

Scale based on measured bottlenecks.

---

# 71. Environment separation

## Local

- Seed data.
- Local credentials.
- No production secrets.

## Staging

- Integration testing.
- Provider sandbox.
- Synthetic/anonymized data.
- Production-like deployment topology where practical.

## Production

- Real customer data.
- Restricted access.
- Audited privileged actions.
- Tested backups.

---

# 72. Provider selection

Choose primary infrastructure using a measured pilot rather than brand preference.

Evaluate:

- Iranian network latency.
- Stability.
- SLA.
- Incident transparency.
- Private networking.
- Backup support.
- Restore capability.
- Storage.
- Migration path.
- Support.
- Price predictability.
- Exit procedure.

Run the same release on at least two shortlisted providers before final selection where practical.

---

# 73. Backup policy

Starting objectives:

```text
RPO:
15 minutes where WAL/continuous archiving is available.

RTO:
60 minutes for core commerce recovery.
```

Minimum policy:

- Daily encrypted full backup.
- 30-day retention.
- Frequent transactional backup/WAL where supported.
- Media versioning or independent media sync.
- Monthly restore drill.
- Quarterly provider-failure exercise.
- Backup keys separated from the application VM.

A backup is not considered valid until restoration succeeds.

---

# 74. Security baseline

At minimum:

- Private PostgreSQL.
- Private Redis.
- Restricted object-storage management.
- Least-privilege database users.
- Separate migration/runtime database credentials.
- Secure server sessions.
- Admin TOTP MFA.
- OTP throttling.
- CSRF protection.
- Origin verification.
- Provider signature verification.
- Webhook idempotency.
- Rate limits.
- Input validation.
- Authorization inside use cases.
- Sensitive log redaction.
- Upload MIME and size restrictions.
- Dependency security updates.
- Audit events.
- Incident runbooks.

---

# 75. Logging

Structured logs should include useful operational context such as:

```text
requestId
actorType
safe actor identifier
orderId
paymentAttemptId
module
operation
result
duration
errorCode
```

Never log:

- OTP values.
- Passwords.
- Session tokens.
- Authorization headers.
- Recovery codes.
- Payment secrets.
- Full sensitive customer data.
- Raw unrestricted provider payloads.

---

# 76. Monitoring

Track:

- Availability.
- TLS expiry.
- HTTP 5xx.
- p50/p95/p99 latency.
- Request rate.
- Checkout conversion.
- Order creation failures.
- Payment callback failures.
- Old pending payments.
- Queue depth.
- Queue retries.
- Dead-letter jobs.
- Database connections.
- Slow queries.
- Database disk.
- Backup age.
- WAL/archive health.
- Redis memory.
- Redis evictions.
- Object-storage errors.
- CPU.
- Memory.
- Disk.
- Network saturation.

Alert on actionable customer-facing or recovery risks.

---

# 77. Deployment

Production deployment must use immutable versioning.

Suggested flow:

```text
build
↓
test
↓
tag image/release
↓
migrate
↓
deploy
↓
readiness
↓
smoke tests
```

Use:

```bash
prisma migrate deploy
```

Never use destructive development reset commands in production.

---

# 78. CI and CD

CI starts in Phase 1.

CI should run:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run build
```

Add integration/e2e suites as the application grows.

CD is introduced after deployment and rollback behavior is sufficiently stable.

---

# 79. Health endpoints

Provide:

```text
GET /health/live
GET /health/ready
```

`live` checks process viability.

`ready` checks dependencies required to safely receive production traffic.

Do not make readiness so strict that harmless optional providers constantly remove the application from service.

---

# 80. SEO architecture

SEO applies to public indexable pages.

Primary locale:

```text
fa-IR
```

Document direction:

```text
rtl
```

Use one canonical public domain.

---

# 81. Indexable pages

Generally index:

- Home.
- Category landing pages.
- Product pages.
- Useful editorial content.
- Buying guides.
- Campaign landing pages where valuable.
- Trust/support pages where appropriate.

Generally do not index:

- Search result pages.
- Arbitrary filter combinations.
- Sort URLs.
- Cart.
- Checkout.
- Account.
- Admin.
- Temporary state URLs.

---

# 82. SEO rendering

Important public pages must contain useful initial HTML.

Do not require a crawler to wait for client-only catalog fetching before seeing:

- Product title.
- Price.
- Availability.
- Description.
- Internal links.
- Metadata.

---

# 83. SEO contracts

Implement:

- Canonical URLs.
- Redirects.
- `robots.txt`.
- XML sitemap.
- Product sitemap.
- Category sitemap.
- Content sitemap.
- Image sitemap where valuable.
- Real 404 responses.
- Product structured data.
- Offer structured data.
- Breadcrumb structured data.
- Organization data.
- Review data only when truthful.
- Shipping/returns data where supported.

Visible information and structured data must agree.

---

# 84. URL policy

Choose exactly one slug strategy before publishing production pages.

Either:

```text
Persian Unicode
```

or:

```text
normalized Latin transliteration
```

Do not casually mix policies.

Once public URLs exist:

- Preserve them.
- Redirect intentionally.
- Avoid mass unnecessary slug changes.

---

# 85. Image SEO and performance

Images should include:

- Correct intrinsic dimensions.
- Responsive variants.
- Modern formats where supported.
- Useful Persian alt text.
- Reserved aspect ratios.
- Lazy loading below fold.
- Meaningful focal cropping.
- Long-lived caching for immutable transformed media.

Do not serve large original assets through the API process.

---

# 86. Advertising

NOVA should not depend on restricted foreign ad services to launch.

Do not design operational plans around:

- Borrowed accounts.
- False billing addresses.
- Proxy ownership.
- Policy circumvention.

Advertising policy and availability should be rechecked at campaign execution time.

---

# 87. Iran-first acquisition

Potential channels:

- Local search/display networks.
- Persian publishers.
- Native placements.
- Creators.
- Influencers.
- Affiliates.
- Referral partnerships.
- Consent-based email.
- Consent-based SMS.
- Telegram or other business-supported owned channels.

Do not hard-code one advertising provider into the application.

---

# 88. Attribution

Capture:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Recommended funnel events:

```text
page_view
search_submitted
product_viewed
filter_applied
add_to_cart
checkout_started
shipping_selected
payment_started
payment_succeeded
order_created
order_cancelled
return_requested
refund_created
```

Do not make business decisions using clicks alone.

---

# 89. Business north star

Primary outcome:

```text
successfully paid completed orders
with healthy contribution margin
```

Conceptually:

```text
Contribution margin =
revenue
- product cost
- payment cost
- shipping subsidy
- support cost
- refund/return cost
```

Allowable CAC must be derived from contribution economics, not copied from another ecommerce business.

---

# 90. Marketing document split

Detailed:

- Creator strategy.
- Lifecycle campaigns.
- Budget allocation.
- Content calendar.
- Campaign templates.
- Creative guidelines.

belong in:

```text
docs/marketing/
```

The root architecture document only defines the measurement and integration requirements required by engineering.

---

# 91. SEO document split

Detailed:

- Keyword research.
- 90-day content plan.
- Search demand analysis.
- Editorial schedule.
- Content briefs.

belong in:

```text
docs/seo/
```

---

# 92. Infrastructure document split

Detailed:

- Provider scorecards.
- Provider-specific commands.
- DNS configuration.
- Backup commands.
- Firewall rules.
- Deployment scripts.
- Restore procedures.

belong in:

```text
docs/infrastructure/
docs/runbooks/
```

---

# 93. Design document split

Exact:

- Figma frame coordinates.
- Long-page scroll offsets.
- Screenshot paths.
- Visual regression dimensions.
- Screen-sheet x/y geometry.

belong in:

```text
docs/designs/
```

The architecture document defines behavioral and responsive contracts only.

---

# 94. Required architecture ADRs

Before the relevant production module is implemented, create:

```text
ADR-001 Money and provider money units
ADR-002 Customer and staff identity model
ADR-003 Session and OTP security
ADR-004 Product option and variant model
ADR-005 Inventory reservation and concurrency
ADR-006 Checkout transaction and idempotency
ADR-007 Payment callback and reconciliation
ADR-008 Search and Persian normalization
ADR-009 Public storefront rendering
ADR-010 External provider adapter ownership
```

Additional ADRs should be created only for durable, significant decisions.

Do not create ADRs for trivial implementation details.

---

# 95. Phase 0 — architecture cleanup

Resolve only blocking invariants.

Deliver:

- `CONTEXT.md`.
- Core ADRs.
- Domain vocabulary.
- Product variant model.
- Inventory semantics.
- Checkout semantics.
- Payment state model.
- Refund model.
- Search strategy.
- Rendering strategy.
- Reduced P0 scope.

Do not block Phase 1 on:

- Final ad network.
- Final creator partners.
- Final hosting winner.
- Final payment vendor selection.
- Final SMS vendor.
- Final brand assets.

### Exit gate

Core domain invariants are written and mutually consistent.

---

# 96. Phase 1 — engineering foundation

Build:

```text
apps/storefront
apps/admin
apps/api
apps/worker
```

Add:

- Bun workspace.
- TypeScript strict mode.
- ESLint.
- Formatting.
- Environment validation.
- PostgreSQL.
- Redis.
- Prisma.
- NestJS.
- Error contract.
- Logging.
- OpenAPI.
- Generated API client.
- Basic UI tokens.
- CI.
- Docker development stack.

### Exit gate

From a clean environment:

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
docker compose up
```

works using documented steps.

---

# 97. Phase 2 — catalog and discovery

Build:

- Product model.
- Product options.
- Variants.
- Categories.
- Media.
- Inventory basics.
- Admin catalog.
- Home.
- Category.
- PLP.
- PDP.
- PostgreSQL Persian search.
- Filter/sort/pagination.
- SEO metadata contracts.

### Exit gate

A seeded product can be:

- Created.
- Published.
- Searched.
- Filtered.
- Viewed.

on desktop and mobile.

---

# 98. Phase 3 — identity and cart

Build:

- Customer OTP.
- Customer sessions.
- Staff password login.
- Staff TOTP.
- Staff sessions.
- Authorization.
- Audit events.
- Rate limiting.
- Guest cart.
- Customer cart.
- Cart persistence.
- Cart merge.
- Cart conflict responses.
- Addresses.

### Exit gate

A guest and authenticated customer can maintain a valid cart across refresh and authentication.

---

# 99. Phase 4 — checkout and commerce core

Build:

- Checkout quote.
- Final validation.
- Inventory reservations.
- Reservation expiry.
- Order creation.
- Immutable snapshots.
- Payment attempts.
- Gateway adapter.
- Payment callbacks.
- Idempotency.
- Payment reconciliation.
- Shipping calculation.
- Customer confirmation.

This phase receives the strongest integration and concurrency testing.

### Exit gate

All of these pass:

- Successful payment.
- Failed payment.
- Cancelled payment.
- Timeout.
- Duplicate checkout.
- Duplicate callback.
- Delayed callback.
- Reservation expiry.
- Late paid callback after expiry.
- Concurrent purchase of final stock.

---

# 100. Phase 5 — operations

Build:

- Order admin.
- Fulfillment workflow.
- Shipment.
- Tracking.
- Return request.
- Refund.
- Coupon.
- Customer support lookup.
- Notifications.
- Payment inspection.
- Audit interface.

### Exit gate

An operator can process an order without editing the database directly.

---

# 101. Phase 6 — production design completion

After one design direction wins:

- Complete account screens.
- Complete checkout states.
- Complete admin workflows.
- Tablet layouts.
- 360 px QA.
- Error states.
- Offline states.
- Payment recovery.
- Stock conflict.
- Accessibility review.
- Visual regression.

### Exit gate

The selected design has equivalent behavior across core supported viewports and states.

---

# 102. Phase 7 — SEO and content production

Complete:

- Production SSR/hybrid rendering.
- Canonicals.
- Sitemap.
- Robots.
- Redirects.
- Structured data.
- Editorial pages.
- Trust pages.
- Shipping policy.
- Returns policy.
- Size guide.
- Search Console setup where operationally available.
- Analytics baseline.

### Exit gate

Important pages are indexable and expose useful initial HTML.

---

# 103. Phase 8 — Iran production readiness

Select and integrate real providers:

- Primary Iranian hosting.
- Independent backup target.
- Payment gateway.
- SMS.
- Shipping.
- Object storage.
- Monitoring.

Run:

- Load test.
- Restore drill.
- Rollback drill.
- Payment sandbox.
- Provider timeout test.
- Backup verification.
- Multiple Iranian network checks.

### Exit gate

Rollback and restore have been executed successfully, not merely documented.

---

# 104. Phase 9 — controlled launch

Launch with:

- Limited product set.
- Explicit inventory.
- Working tracking.
- Working support.
- Core SEO pages.
- One measured acquisition test.
- One creator/affiliate test if ready.
- Contribution-margin reporting.

### Exit gate

The business can explain:

```text
where orders came from
how much acquisition cost
payment success rate
refund/return rate
contribution margin
```

---

# 105. Local engineering checks

Root commands should eventually expose:

```bash
bun run typecheck
bun run lint
bun run test
bun run test:integration
bun run test:e2e
bun run build
```

Database:

```bash
bunx prisma migrate deploy
bun run db:seed
```

Infrastructure:

```bash
docker compose config
docker compose up
```

---

# 106. Required commerce tests

At minimum:

## Catalog

- Draft cannot appear publicly.
- Published product appears.
- Archived product disappears without corrupting old orders.
- SKU uniqueness.
- Slug redirects.

## Search

- Persian normalization.
- Arabic/Persian character variants.
- Typo tolerance.
- Filters.
- Sort.
- Pagination.
- Empty result.

## Cart

- Add valid variant.
- Reject unavailable variant.
- Quantity update.
- Server price change.
- Stock conflict.
- Guest/auth merge.
- Duplicate mutation handling.

## Inventory

- Reservation create.
- Reservation consume.
- Reservation release.
- Reservation expiry.
- Final unit concurrent purchase.
- No negative available-to-sell.

## Checkout

- Authoritative recalculation.
- Invalid address.
- Expired quote.
- Duplicate request.
- Same idempotency key.
- Different idempotency key.

## Payment

- Success.
- Failure.
- Cancellation.
- Timeout.
- Duplicate callback.
- Delayed callback.
- Invalid signature.
- Reconciliation.
- Late payment after reservation expiry.
- Refund success.
- Refund failure.

## Order

- Immutable snapshots.
- Valid transitions.
- Invalid transitions rejected.
- Unauthorized transition rejected.
- Admin override audited.

## Identity

- OTP expiration.
- OTP retry limit.
- OTP resend invalidates old code.
- Rate limiting.
- Session rotation.
- Session revocation.
- Staff MFA.
- Customer cannot access staff context.
- CSRF rejection.
- Authorization denied by default.

---

# 107. Frontend QA

Test:

- RTL.
- Mixed LTR values.
- Keyboard navigation.
- Screen-reader semantics.
- 360 px.
- 390 px.
- 768 px.
- Desktop.
- Slow network.
- Offline.
- Loading.
- Empty.
- Request failure.
- Payment recovery.
- Stock conflict.
- Long Persian strings.
- Very large prices.
- Disabled actions.
- Reduced motion.
- Focus restoration.

---

# 108. Production smoke checks

After each production release verify:

```text
/health/live
/health/ready
```

Then test:

- Home.
- Category.
- Search.
- Product.
- Cart.
- Checkout.
- Authentication.
- Order lookup.
- Admin login.
- Object storage.
- Queue.
- Database.
- Payment sandbox/safe production verification where appropriate.
- Monitoring.
- Backup age.

A duplicate callback test must not create a duplicate order/payment.

---

# 109. Blocking decisions

These must be resolved before their affected implementation begins:

- Domain money semantics.
- Payment conversion boundary.
- Customer/staff identity separation.
- Session model.
- OTP policy.
- Variant model.
- Inventory reservation rules.
- Order state machine.
- Payment state machine.
- Refund state.
- Checkout idempotency.
- Search architecture.
- Public SSR strategy.
- Authorization roles.

---

# 110. Late-binding decisions

These do not block unrelated domain implementation:

- Payment gateway vendor.
- SMS vendor.
- Shipping vendor.
- Storage vendor.
- Analytics sink.
- Iranian infrastructure vendor.
- Support integration.

They remain behind adapters until selected.

---

# 111. Launch decisions

These must be finalized before public launch but do not block foundation engineering:

- Final brand name.
- Logo.
- Production domain.
- Tone of voice.
- Launch assortment.
- Final hosting winner.
- Final payment contract.
- Final SMS contract.
- Final shipping contract.
- Privacy/legal policy.
- Support process.
- Launch budget.
- Gross margin.
- Allowable CAC.
- Marketing partners.

---

# 112. Current open decisions

## Brand

- Final store name.
- Domain.
- Logo.
- Tone.

## Providers

- Payment gateway.
- SMS.
- Shipping.
- Primary hosting.
- Backup hosting.
- Support channel.

## Infrastructure

- Managed vs self-hosted PostgreSQL.
- Backup ownership.
- Monitoring provider.

## Product

- Exact launch assortment.
- Size systems.
- Shipping price policy.
- Final return operational process.

# Design strategy

NOVA intentionally maintains **three complete design directions** before selecting the production baseline.

The goal is not to quickly eliminate alternatives. The goal is to compare three genuinely complete ecommerce experiences under identical functional constraints and select the strongest direction based on evidence.

Current candidates:

```text
AE  = Atelier Editorial
NAE = NOVA Atelier Editorial
QG  = Quiet Grid
```

All three directions are considered equal candidates until the final design review.

No direction may receive a reduced feature set merely because another direction appears more promising.

---

# Visual design artifact workflow

Every new non-trivial visual page, flow, component family, or direction must move through a design artifact before production code is written.

```text
define the exact page, states, content and target viewports
→ inspect any user-supplied reference as the primary constraint
→ create one concrete design image/mockup when no exact reference exists
→ review the artifact in desktop and relevant mobile RTL compositions
→ implement the same composition with the shared contracts and Tailwind primitives
→ render at the target viewports
→ compare the render with the design artifact and iterate
```

The generated image is the design target for implementation; it is not a source of product truth, a replacement for real API data, or evidence that the runtime flow is complete. Generated concepts must preserve NOVA's functional, RTL, accessibility, performance and responsive constraints. Keep one primary artifact per design decision and attach its path/reference plus same-viewport comparison evidence to the task or PR. Do not generate visual artifacts for non-visual work or create speculative variants without a concrete design decision.

If an exact user reference is supplied, it remains authoritative for the requested fidelity and may be used directly as the artifact. If no reference is supplied, visual work should not wait for one: generate the artifact from the relevant product/architecture brief. Only block before visual implementation when the required design capability or a necessary product constraint is genuinely unavailable.

---

# Why three complete directions

A homepage-only or PDP-only comparison is not sufficient for NOVA.

A visual direction that looks strong on a marketing page may perform poorly when applied to:

- Product comparison.
- Dense filters.
- Variant selection.
- Checkout.
- Account pages.
- Order tracking.
- Forms.
- Error states.
- Mobile navigation.
- Admin tables.
- Inventory operations.
- RTL content.
- Long Persian text.

Therefore all three design candidates must demonstrate how their visual language behaves across the complete ecommerce system.

The selected production direction should win because it performs better as a **complete product system**, not merely because its homepage looks better.

---

# Shared functional contract

All three directions must support exactly the same product functionality.

Differences between directions are limited primarily to:

- Visual hierarchy.
- Typography.
- Spacing.
- Density.
- Image treatment.
- Merchandising emphasis.
- Navigation presentation.
- Card styling.
- Color system.
- Surface treatment.
- Motion.
- Editorial expression.
- Component composition.

Functional behavior must remain equivalent.

For example:

```text
AE cart behavior
=
NAE cart behavior
=
QG cart behavior
```

while the visual presentation may differ significantly.

---

# Required customer screens

Every direction must include:

```text
HOME

CATEGORY_WOMEN
CATEGORY_MEN
CATEGORY_CHILDREN

PLP_WOMEN
PLP_MEN
PLP_CHILDREN

SEARCH

PDP

CART_DRAWER
CART

AUTH

CHECKOUT_ADDRESS
CHECKOUT_SHIPPING
CHECKOUT_PAYMENT

CONFIRMATION
TRACKING

ACCOUNT_DASHBOARD
PROFILE
ADDRESSES
ORDERS
ORDER_DETAIL

SUPPORT
SECURITY
NOTIFICATIONS

CAMPAIGN
GUIDE
ARTICLE
LOOKBOOK

ABOUT
TRUST
SHIPPING_POLICY
RETURNS_POLICY
SIZE_GUIDE
CARE_GUIDE

FAQ
CONTACT
PRIVACY
TERMS

NOT_FOUND
OFFLINE
MAINTENANCE
```

A direction is not considered complete if one of these required product surfaces is missing.

---

# Required admin screens

Every direction must also demonstrate the full admin surface:

```text
ADMIN_LOGIN

ADMIN_DASHBOARD

ADMIN_PRODUCTS
ADMIN_PRODUCT_EDIT

ADMIN_VARIANTS
ADMIN_MEDIA
ADMIN_CATEGORIES
ADMIN_INVENTORY

ADMIN_ORDERS
ADMIN_ORDER_DETAIL

ADMIN_PAYMENTS
ADMIN_PROMOTIONS

ADMIN_CUSTOMERS
ADMIN_CUSTOMER_DETAIL

ADMIN_CONTENT
ADMIN_AUDIT
ADMIN_OPERATIONS
```

The admin experience may have a different visual density from the storefront while still belonging to the same overall direction.

---

# Required viewport coverage

Each direction must be evaluated at:

```text
1440 desktop
1280 desktop
1024 compact desktop
768 tablet
390 mobile
360 narrow mobile
```

Not every state needs a completely independent handcrafted frame at every width when responsive behavior can be deterministically derived.

However, high-risk screens must have explicit frames.

At minimum:

```text
HOME
PLP
PDP
CART
CHECKOUT
ORDER_DETAIL
ACCOUNT
ADMIN_PRODUCTS
ADMIN_PRODUCT_EDIT
ADMIN_ORDERS
ADMIN_ORDER_DETAIL
```

must receive explicit responsive review.

---

# Required state coverage

Each direction must support the same baseline state matrix.

## Discovery

Home, category, PLP, and search:

```text
default
loading
slow network
slow image
empty
no results
request error
offline
```

## PDP

```text
default
variant not selected
color selected
size selected
size error
low stock
out of stock
sale
gallery loading
gallery failure
zoom
add-to-cart success
price changed
stock changed
request error
offline
```

## Cart

```text
default
empty
quantity updating
item removed
stock conflict
price change
coupon success
coupon error
recalculating
request error
offline
```

## Checkout

```text
saved address
new address
validation error
unsupported region

shipping loading
shipping unavailable
quote expired

payment ready
processing
redirecting
pending verification
failed
cancelled
timeout

stock conflict
price conflict
offline
```

## Order and tracking

```text
paid
pending
confirmed
preparing
shipped
delayed
shipment exception
delivered
cancelled
returned
support handoff
```

## Account and content

```text
default
loading
empty
validation error
permission error
request error
offline
maintenance
success
```

## Admin

```text
login invalid
login rate limited
login locked
MFA required
MFA invalid

table loading
table empty
table error

draft
invalid
saving
saved
publish blocked

media upload failure
inventory discrepancy
payment mismatch
refund pending
refund failed

permission denied
audit success
```

---

# Equal-scope comparison rule

The three directions must be compared at equivalent scope.

Do not compare:

```text
Direction A:
complete desktop + mobile ecommerce

against

Direction B:
homepage concept

against

Direction C:
partial component system
```

Before final selection, all three candidates must reach the same defined design-completeness gate.

---

# Shared customer terminology

Customer-visible audience labels are fixed:

```text
زنانه
مردانه
بچگانه
```

Use these exact labels consistently in all directions.

They should appear consistently in:

- Navigation.
- Category cards.
- Breadcrumbs.
- Filters.
- Campaigns.
- Search.
- Fixtures.
- Admin taxonomy.

This prevents copy differences from distorting the visual comparison.

---

# Shared data fixtures

All three directions should use the same representative catalog fixtures whenever possible.

For example:

```text
same product
same image
same title
same price
same sale
same stock state
same sizes
same colors
same delivery promise
```

This is important.

If AE uses premium photography and QG uses poor placeholder assets, the comparison becomes meaningless.

The same content should be placed into each visual system unless a direction specifically demonstrates an intentional merchandising treatment.

---

# Shared interaction contract

Functional interaction behavior is shared.

Examples:

## Product selection

Add-to-cart remains unavailable until all required variant options are selected.

## Stock conflicts

A changed stock state keeps the customer in context and explains what changed.

## Cart merge

Guest and customer carts use the same backend merge behavior.

## Checkout

All directions use the same checkout ordering and validation behavior.

## Payment

All directions show distinct states for:

```text
processing
pending verification
failed
cancelled
timeout
```

## Dialog behavior

All directions must:

- Trap keyboard focus.
- Support Escape when dismissible.
- Restore focus to the trigger.
- Provide an explicit close action.
- Not depend solely on backdrop clicking.

---

# Shared component behavior

The three systems may style components differently, but should use the same behavioral component contracts.

Examples:

```text
Button
IconButton
Field
Select
ProductCard
MediaGallery
SizeSelector
CartItem
OrderSummary
Dialog
Drawer
Sheet
DataTable
StatusBadge
Price
QuantityControl
Pagination
Breadcrumb
```

The implementation should ideally expose one behavioral API while allowing direction-specific visual composition during design evaluation.

---

# Design architecture

The design candidates are **visual adapters over a shared product contract**.

Conceptually:

```text
Shared behavior
      |
      +----------------+
      |       |        |
      v       v        v
     AE      NAE       QG
```

Do not build three independent checkout implementations.

Do not build three separate cart state systems.

Do not build three separate authentication systems.

Do not build three separate accessibility models.

The design exploration can be broad while application behavior stays centralized.

---

# Direction-specific freedom

Each direction is allowed to strongly differ in:

## AE — Atelier Editorial

May prioritize:

- Large editorial photography.
- Story-led merchandising.
- High-fashion visual rhythm.
- Larger whitespace.
- More expressive campaign composition.
- Premium typography.
- Reduced visible UI chrome.

It must still remain practical for comparison, checkout, accessibility, and admin work.

---

## NAE — NOVA Atelier Editorial

May prioritize:

- Editorial identity with stronger ecommerce practicality.
- Clearer information density.
- Stronger product comparison.
- Balanced imagery and commerce information.
- Calm premium styling.
- More implementation-aligned component behavior.

---

## QG — Quiet Grid

May prioritize:

- Systematic grid.
- Strong information hierarchy.
- High product-comparison efficiency.
- Lower visual noise.
- More consistent density.
- Faster browsing.
- Strong utilitarian admin compatibility.

It should still feel branded rather than generic.

---

# Figma construction contract

Each design direction must maintain its own complete Figma section or page.

Recommended Figma structure:

```text
00 — Foundations

01 — Shared Content Fixtures

10 — AE
  10.1 Foundations
  10.2 Components
  10.3 Storefront
  10.4 Checkout
  10.5 Account
  10.6 Content
  10.7 Admin
  10.8 States
  10.9 Responsive QA

20 — NAE
  20.1 Foundations
  20.2 Components
  20.3 Storefront
  20.4 Checkout
  20.5 Account
  20.6 Content
  20.7 Admin
  20.8 States
  20.9 Responsive QA

30 — QG
  30.1 Foundations
  30.2 Components
  30.3 Storefront
  30.4 Checkout
  30.5 Account
  30.6 Content
  30.7 Admin
  30.8 States
  30.9 Responsive QA

90 — Comparison

99 — Approved Production Direction
```

This allows direct comparison without mixing component ownership.

---

# Frame metadata

Every approval frame should record:

```text
Screen ID
Direction
Viewport
Scroll state
Data state
RTL mode
Grid
Component set
Content fixture
Asset fixture
Review status
```

Example:

```text
Screen ID:
PDP

Direction:
QG

Viewport:
390 × 844

State:
low-stock

Content:
PRODUCT_FIXTURE_004

Review:
pending
```

---

# Exact geometry and QA

Exact x/y coordinates, screenshot scroll positions, and long-page capture geometry may remain deterministic for design QA.

These values belong primarily in the corresponding design documentation:

```text
docs/designs/atelier-editorial.md
docs/designs/nova-atelier-editorial.md
docs/designs/quiet-grid.md
```

They are valid because NOVA intentionally wants detailed design comparison.

However, implementation should translate those measurements into:

- Grid rules.
- Spacing tokens.
- Responsive constraints.
- Min/max sizing.
- Sticky behavior.
- Content limits.

rather than blindly hardcoding long-page absolute coordinates into React components.

---

# Design QA requirements

Each direction must independently pass:

## RTL

- Persian navigation.
- Breadcrumbs.
- Carousels.
- Pagination.
- Timelines.
- Tables.
- Mixed SKU/reference values.
- Mixed phone numbers.
- Prices.

## Accessibility

Target:

```text
WCAG 2.2 Level AA
```

Check:

- Contrast.
- Keyboard navigation.
- Focus.
- Modal focus trap.
- Focus return.
- Touch targets.
- Form labels.
- Validation.
- Reduced motion.
- Screen-reader structure.

## Responsive

Check:

```text
1440
1280
1024
768
390
360
```

At 360:

- No horizontal clipping.
- Persian labels remain readable.
- Prices remain readable.
- Product controls remain usable.
- Primary CTA remains accessible.

## Content stress tests

Each direction should be tested with:

- Very long Persian product names.
- Long category names.
- Sale pricing.
- Expensive pricing.
- Low stock.
- No stock.
- Multiple color swatches.
- Many size options.
- Long delivery text.
- Long validation errors.
- Missing images.

---

# Three-direction visual regression

Maintain independent screenshot baselines:

```text
visual/
  ae/
  nae/
  qg/
```

Snapshots should cover representative:

```text
desktop
tablet
mobile
narrow mobile
```

and important states.

Visual regression should detect unintended changes inside a direction without forcing the three directions to visually match each other.

---

# Design comparison scorecard

When all three directions reach the completeness gate, evaluate them with the same scorecard.

Recommended weighting:

| Criterion                      | Weight |
| ------------------------------ | -----: |
| Product clarity                |    15% |
| Mobile usability               |    15% |
| Persian RTL quality            |    10% |
| Brand distinctiveness          |    10% |
| Product comparison             |    10% |
| Checkout clarity               |    10% |
| Accessibility                  |    10% |
| Responsive robustness          |     5% |
| Admin usability                |     5% |
| Implementation maintainability |     5% |
| Performance implications       |     5% |

Total:

```text
100%
```

Do not select purely from subjective visual preference.

---

# Product clarity review

Evaluate:

- Is price obvious?
- Is sale state obvious?
- Is selected variant obvious?
- Is stock obvious?
- Is delivery expectation visible?
- Is return information easy to find?
- Is the primary CTA dominant?
- Can users compare products quickly?

---

# Mobile review

Evaluate:

- One-hand usability.
- Sticky purchase controls.
- Bottom navigation.
- Filters.
- Size selection.
- Cart access.
- Checkout actions.
- Persian text wrapping.
- Keyboard/input behavior.

---

# Brand review

Ask:

- Does it look distinctive?
- Does it look appropriate for clothing?
- Does it look trustworthy?
- Does it feel modern without looking like a generic AI-generated template?
- Can campaigns vary without breaking the system?
- Can photography lead the experience where appropriate?

---

# Admin review

A beautiful storefront direction is not automatically the best system.

Evaluate:

- Product editing.
- Variant editing.
- Inventory scanning.
- Order processing.
- Payment problems.
- Customer lookup.
- Refund operations.
- Dense table readability.

The selected direction may use a more operational visual mode inside admin while retaining the same design language.

---

# Performance review

Design selection should account for technical cost.

Review:

- Number of large above-fold images.
- Required font files.
- Animation complexity.
- Video usage.
- Blur/backdrop effects.
- Large DOM structures.
- Mobile GPU cost.
- Layout shift risk.

A visually attractive direction that materially harms mobile commerce performance should lose points.

---

# Implementation comparison

Before final design selection, implement a representative coded slice of all three directions.

At minimum:

```text
HOME
PLP
PDP
```

using shared production-grade React components and the same fixtures.

This validates that the design is not only attractive in Figma but also practical in:

- Real browser layout.
- Real Persian typography.
- Responsive behavior.
- Image loading.
- Accessibility.
- Actual component architecture.

The implementation experiment should not create three independent applications.

Use one route or preview mechanism to switch visual direction.

Conceptually:

```text
/design/ae
/design/nae
/design/qg
```

or an equivalent development-only preview system.

---

# Final selection gate

No direction wins until all three have:

- Equivalent functional scope.
- Equivalent representative content.
- Required responsive coverage.
- RTL review.
- Accessibility review.
- State coverage.
- Admin review.
- Performance review.
- Representative coded preview.
- Screenshot QA evidence.

Then compare:

```text
AE
vs
NAE
vs
QG
```

using the shared scorecard.

---

# After a winner is selected

After final selection:

1. Mark the winning direction as the production baseline.
2. Preserve the other two as design research/history.
3. Stop production expansion of the losing directions.
4. Consolidate production tokens.
5. Consolidate production components.
6. Remove development-only direction switches.
7. Continue QA only against the selected production baseline.

The discarded directions should not remain active production themes unless the business later intentionally introduces multiple storefront themes.

---

# Important rule

NOVA is intentionally doing:

```text
three complete design explorations
```

but not:

```text
three independent product architectures
```

The correct structure is:

```text
ONE commerce architecture
ONE behavioral contract
ONE backend
ONE application state model

THREE complete visual/product design candidates
```

This gives NOVA meaningful design choice without tripling engineering complexity.

## Commerce architecture references

- Medusa
  https://github.com/medusajs/medusa

- Vendure
  https://github.com/vendurehq/vendure

## Frameworks

- NestJS
  https://docs.nestjs.com/

- Prisma
  https://www.prisma.io/docs/

- Vite
  https://vite.dev/

- TanStack Query
  https://tanstack.com/query/

- TanStack Table
  https://tanstack.com/table/

- Zustand
  https://zustand.docs.pmnd.rs/

- shadcn/ui
  https://ui.shadcn.com/

- Tailwind CSS
  https://tailwindcss.com/

## SEO

- Google Search ecommerce documentation
  https://developers.google.com/search/docs/specialty/ecommerce

- JavaScript SEO basics
  https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

- Product structured data
  https://developers.google.com/search/docs/appearance/structured-data/product

- Sitemaps
  https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

## Accessibility

- WCAG 2.2
  https://www.w3.org/TR/WCAG22/

## Iran domain/infrastructure references

- IANA `.ir` record
  https://www.iana.org/domains/root/db/ir.html

Provider-specific documentation must be rechecked at procurement time because pricing, policies, availability, and service guarantees can change.

---

# 117. Final implementation rule

NOVA should begin implementation after its **core domain invariants** are resolved.

It should not wait for every provider, marketing, design, or commercial choice to become final.

Build deep stable boundaries first:

```text
Identity
Catalog
Inventory
Cart
Checkout
Orders
Payments
Shipping
Returns
```

Keep external dependencies replaceable.

Keep server commerce state authoritative.

Avoid speculative abstractions.

Ship the smallest architecture that can safely process real customer money, inventory, orders, and refunds.

Then expand using real product evidence.
