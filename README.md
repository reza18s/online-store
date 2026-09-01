# NOVA Store

> Planning document for an Iran-first, single-merchant ecommerce platform built with Node.js, NestJS, Prisma, React, Vite, TanStack, shadcn/ui, Zustand, and Tailwind CSS.

## Project status

This repository is currently documentation-only: no application code has been implemented yet. This README is the initial product, engineering, infrastructure, SEO, advertising, marketing, and Figma source of truth. The product category is clothing for women, men, and children, and customer-facing prices will use toman. No production credentials, hosting account, payment account, or final brand identity has been selected yet.

The implementation should begin only after the decisions in [Open decisions](#open-decisions) are resolved.

## Executive decisions

| Area | Recommendation | Reason |
| --- | --- | --- |
| Product model | Start as a single-merchant store; design boundaries so a marketplace can be added later | Keeps checkout, inventory, permissions, and operations manageable for the first release |
| Primary audience | Persian-speaking customers in Iran | Drives `fa-IR`, RTL, Iranian payment/shipping adapters, local hosting, and local acquisition |
| Product category | Clothing for women, men, and children, with accessories and seasonal collections | Gives every design direction a concrete catalog, variant, sizing, photography, and content model |
| Customer currency display | Show all storefront prices and totals in toman | Matches the confirmed customer-facing convention; the backend integer storage unit remains a separate open engineering decision |
| Frontend | React + Vite, with prerendering or Vite SSR for public indexable pages | Preserves the requested Vite stack while avoiding a client-only SEO trap |
| Backend | Node.js + NestJS + Prisma + PostgreSQL | Modular domain boundaries, type-safe persistence, and reliable transactional workflows |
| Client state | Zustand for cart/session/UI preferences; TanStack Query for server state | Prevents duplicated server caches and keeps local interaction state simple |
| UI system | shadcn/ui + Tailwind CSS + CSS variables | Fast composition, accessible primitives, and a theme that can evolve without rewriting components |
| Design directions | Complete all five existing directions as equal design candidates, then select the production baseline after responsive and RTL review | Prevents a partial concept from being compared with a complete system and preserves meaningful visual choice |
| Primary hosting | Iranian VPS/cloud or PaaS, with application and data in an Iranian data center | Lower latency for Iranian users and fewer dependencies on foreign infrastructure |
| Backup strategy | Encrypted backups in a second Iranian provider/data center | Avoids a single provider or single data-center failure |
| Search acquisition | Organic SEO first; local paid channels and owned channels for launch | Google Ads is unavailable to Iran-based advertisers under Google's current sanctions policy |
| Measurement | First-party analytics on the Iranian deployment, plus Search Console where accessible | Reduces dependence on third-party scripts and makes campaign attribution more resilient |

The wording “Node” in the original request is interpreted as **Node.js with NestJS**. The wording “Zunstand” is interpreted as **Zustand**.

## Goals and non-goals

### Goals

- Make browsing, search, product comparison, checkout, and order tracking fast on Iranian mobile networks.
- Support Persian RTL correctly without making the UI unusable for Latin text, numbers, codes, or payment references.
- Make product, inventory, order, promotion, payment, and shipping behavior explicit and auditable.
- Launch with a small operational surface that one team can support.
- Build indexable public pages, useful Persian content, and measurable acquisition loops from day one.
- Keep payment, SMS, shipping, storage, and analytics behind adapters so an unavailable provider can be replaced.
- Keep the deployment portable across Iranian providers using Docker and documented infrastructure configuration.

### Non-goals for the first release

- A multi-vendor marketplace with vendor settlement and per-vendor fulfillment.
- A native mobile application before the web funnel is proven.
- A complex recommendation engine before reliable catalog and event data exists.
- A foreign-cloud dependency that is required for checkout or order operations.
- Paid acquisition before landing pages, checkout, attribution, and contribution margin are measurable.

## What we learned from popular GitHub ecommerce projects

The following benchmark was observed on 2026-09-01; GitHub star counts change over time. No single project exactly matches the requested stack, so the best approach is to combine the strongest patterns while keeping NOVA Store's architecture smaller.

| Repository | Observed popularity | Useful patterns | What NOVA should change |
| --- | ---: | --- | --- |
| [Medusa](https://github.com/medusajs/medusa) | About 36k stars | Headless commerce, modular commerce primitives, extensibility, DTC/B2B/marketplace/POS thinking | Do not copy the full platform surface; start with a focused single-store domain |
| [Vendure](https://github.com/vendurehq/vendure) | About 8k stars | NestJS and GraphQL foundation, plugin-first design, channels, catalog, orders, promotions, stock, payments, shipping | Use the modular boundaries, but keep the first API REST-first unless GraphQL is clearly needed |
| [React Ecommerce Boilerplate](https://github.com/viniarruda/react-ecommerce) | About 230 stars | NestJS, Prisma, PostgreSQL, TanStack Query, typed client SDK, Tailwind design system, guest cart, checkout, admin flows | Replace Next.js with React + Vite as requested; add explicit SSR/prerendering for public pages |
| [VZ Commerce](https://github.com/ValentinZoia/e-commerce) | A few stars | React 19, TypeScript, Vite, Tailwind, Radix/shadcn, TanStack Query/Table, React Hook Form, Zod, clean architecture, admin tables | Replace MongoDB/Express/Redux choices with PostgreSQL/NestJS/Prisma/Zustand |
| [ShopVerse](https://github.com/vivirony955/ShopVerse) | A few stars | Inventory reservations, order state machine, returns/refunds, coupons, flash sales, loyalty, referrals, search facets, price history, Q&A | Treat these as later capabilities; do not put all of them in the MVP |
| [Mirai website-cms](https://github.com/mirai-sh379/website-cms) | A few stars | NestJS, Prisma, PostgreSQL, shadcn/Tailwind, TanStack Query/Table, auth, search, favorites, cart, checkout, multi-tenant concepts | Avoid multi-tenant complexity until the single-store operating model is validated |

### Benchmark conclusion

1. **Most popular overall:** Medusa is the strongest popularity benchmark, but it is a commerce platform rather than a drop-in NOVA implementation.
2. **Best backend architecture reference:** Vendure's NestJS/module/plugin boundaries are the most relevant.
3. **Closest requested full-stack reference:** React Ecommerce Boilerplate is the closest match for NestJS + Prisma + PostgreSQL + TanStack Query, even though it uses Next.js.
4. **Closest frontend reference:** VZ Commerce is the closest match for React + Vite + Tailwind + shadcn + TanStack.
5. **Best later feature reference:** ShopVerse contains the most useful advanced commerce ideas, especially inventory reservations and order-state discipline.

### Practices to adopt

- Organize the backend by business capability, not by generic `controllers`, `services`, and `utils` folders.
- Keep the public storefront, authenticated account area, and admin operations as distinct product surfaces.
- Use an order state machine and immutable order-item snapshots so historic orders do not change when products change.
- Treat inventory reservation, payment confirmation, and order creation as a transactional workflow.
- Use typed API contracts so the Vite client does not hand-maintain request and response shapes.
- Use guest cart support to reduce checkout friction.
- Build search, filtering, sorting, and pagination as first-class API contracts.
- Make every webhook idempotent and auditable.
- Add returns, loyalty, referrals, and price alerts only after the core funnel is producing trustworthy data.

## Product scope

### Primary customer journey

```text
Landing page -> category/search -> product detail -> cart -> address/shipping -> payment
-> order confirmation -> tracking/support -> review/referral/repeat purchase
```

### P0 launch features

#### Storefront

- Home page with clear value proposition, featured categories, best sellers, trust signals, and seasonal campaigns.
- Category pages with pagination, sorting, stock filter, price range, and carefully controlled facets.
- Search with typo tolerance, autocomplete, recent searches, no-result recovery, and popular queries.
- Product detail pages with gallery, title, price, availability, variants, specifications, delivery estimate, returns summary, and reviews.
- Guest cart and authenticated cart merge.
- Checkout with address, shipping method, order summary, payment selection, and failure recovery.
- Order confirmation and order-status page.
- Account area with profile, addresses, orders, and support entry point.
- Persian RTL layout with safe handling of Latin product codes, digits, phone numbers, and payment references.
- Responsive mobile-first layout with accessible keyboard and screen-reader behavior.

#### Admin

- Product, category, variant, media, price, and inventory CRUD.
- Draft/published product lifecycle.
- Order queue with status transitions and internal notes.
- Payment attempt and webhook inspection.
- Coupon and promotion management.
- Customer lookup with restricted access to personal information.
- Content blocks for home-page campaigns and SEO landing pages.
- Audit log for sensitive changes.

#### Operations

- Inventory reservation with expiry during checkout.
- Idempotent payment callbacks.
- Retryable notification jobs.
- Shipping-provider adapter with tracking reference.
- Health checks, structured logs, error reporting, and backup verification.

### P1 after launch

- Wishlist and back-in-stock alerts.
- Verified-purchase reviews, moderation queue, product questions and answers.
- Abandoned-cart and browse-reminder lifecycle messages with consent controls.
- Referral codes and simple store credit.
- Bundles, flash sales, volume discounts, and scheduled campaigns.
- Product comparison.
- Basic related-product rules based on category, tags, and purchase history.
- Returns and refunds workflow.
- Customer support inbox or integration with the selected support channel.

### P2 after product-market evidence

- Loyalty tiers and points.
- Price-drop alerts and price history.
- Advanced personalization and recommendations.
- Multi-warehouse routing.
- Marketplace/vendor support.
- Native mobile apps.
- Experiment platform and automated customer lifetime value modeling.

## Technology plan

### Required stack

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Runtime | Node.js | Server and worker runtime |
| API | NestJS | Modules, controllers, providers, guards, validation, and operational boundaries |
| ORM | Prisma | Schema, migrations, typed queries, and transaction boundaries |
| Database | PostgreSQL | Durable source of truth for commerce data |
| Frontend | React + Vite + TypeScript | Storefront, account, and admin application surfaces |
| Server state | TanStack Query | Fetching, caching, invalidation, prefetching, and mutation synchronization |
| Tables | TanStack Table | Admin data tables and dense operational views |
| Client state | Zustand | Cart draft, drawer state, filters that are intentionally local, and UI preferences |
| Components | shadcn/ui | Accessible primitives and composable application UI |
| Styling | Tailwind CSS + CSS variables | Responsive layout, tokens, themes, and RTL-aware utilities |
| Forms | React Hook Form + Zod | Typed validation shared between UX and API boundaries where practical |
| Jobs/cache | Redis-compatible service | Queue coordination, short-lived cache, rate-limit counters, and locks |
| Files | S3-compatible object storage | Product media, exports, and private operational files |
| Delivery | Docker Compose initially; CI/CD later | Repeatable local, staging, and production runtime |

### Recommended repository structure

```text
apps/
  web/                 # React + Vite storefront, account, and admin shells
  api/                 # NestJS HTTP API
  worker/              # Queue consumers, notifications, imports, and scheduled jobs
packages/
  db/                  # Prisma schema, migrations, seed data, database helpers
  api-client/          # Generated or hand-maintained typed client contract
  ui/                  # Shared shadcn/ui composition and design tokens
  config/              # TypeScript, ESLint, Tailwind, and environment schemas
infra/
  docker/              # Container definitions and local compose files
  deploy/              # Production compose, backup, and deployment documentation
  monitoring/          # Dashboards, alerts, and health checks
docs/
  adr/                 # Architecture decisions
  runbooks/            # Deploy, restore, incident, and rollback procedures
```

Use a workspace package manager selected during Phase 0. `pnpm` is the recommended default for a TypeScript monorepo, but the repository should record the final choice in `package.json` and this README before implementation.

### Backend module boundaries

```text
Auth
Users
Catalog
Search
Carts
Checkout
Orders
Payments
Inventory
Shipping
Promotions
Reviews
Content
Notifications
Analytics
Admin
```

Each NestJS module owns its application use cases, domain rules, persistence boundary, and HTTP mapping. A module should expose only the providers or contracts that another module truly needs. Keep external providers behind adapters such as `PaymentGateway`, `SmsProvider`, `ShippingProvider`, `ObjectStorage`, and `AnalyticsSink`.

### Data model outline

The first Prisma schema should include at least:

- `User`, `Role`, `Permission`, `Session`, and `Address`.
- `Product`, `ProductVariant`, `Category`, `ProductCategory`, `ProductMedia`, and `ProductAttribute`.
- `InventoryItem`, `InventoryReservation`, and `StockMovement`.
- `Cart`, `CartItem`, and `CartOwnership`.
- `Order`, `OrderItem`, `OrderAddressSnapshot`, `PaymentAttempt`, `Shipment`, and `OrderEvent`.
- `Coupon`, `Promotion`, `PromotionRule`, and `PromotionRedemption`.
- `Review`, `ReviewMedia`, `ReviewModeration`, `Wishlist`, and `ProductQuestion`.
- `ContentPage`, `ContentBlock`, `SeoMetadata`, and `Redirect`.
- `WebhookEvent`, `AuditEvent`, `NotificationJob`, and `AnalyticsEvent`.

Important modeling rules:

- Store price, title, SKU, tax/shipping-relevant values, and product identity as order-time snapshots on `OrderItem`.
- Never infer inventory from a cached product response; inventory mutations belong to a transaction or a controlled reservation workflow.
- Add indexes for every high-volume lookup: product slug, SKU, order number, user email/phone, status plus created date, and active promotion windows.
- Use soft deletion or archival for products and categories that appear in historic orders.
- Keep payment provider IDs and webhook payload hashes unique where idempotency requires it.
- Store money in the smallest integer unit selected by the business and document whether it is rial or toman. Never mix units silently.

### API shape

The first API can be REST with versioned routes and generated types:

```text
GET    /v1/catalog/categories
GET    /v1/catalog/products
GET    /v1/catalog/products/:slug
GET    /v1/search?q=&filters=
POST   /v1/carts
GET    /v1/carts/:id
POST   /v1/carts/:id/items
PATCH  /v1/carts/:id/items/:itemId
DELETE /v1/carts/:id/items/:itemId
POST   /v1/checkout/quote
POST   /v1/checkout/orders
POST   /v1/payments/:provider/callback
GET    /v1/orders
GET    /v1/orders/:orderNumber
POST   /v1/reviews
```

Admin routes should be separately guarded and namespaced. Public catalog responses should be cacheable; customer, checkout, payment, and admin responses must not be publicly cached.

### State ownership

| State | Owner |
| --- | --- |
| Products, categories, prices, availability, orders, reviews | API + TanStack Query |
| Cart draft and optimistic cart interactions | Zustand, reconciled with API |
| Auth/session status | Secure server session or httpOnly cookie plus a small client auth view |
| Drawer, modal, theme, density, temporary form state | Local React state or Zustand |
| Filters encoded in a shareable URL | Router/search params; query data still belongs to TanStack Query |
| Admin table sorting/pagination | URL/search params and TanStack Table state |

Do not use Zustand as a second general-purpose API cache. After mutations, invalidate or update the relevant TanStack Query keys.

## Design and Figma plan

### Figma deliverable

The editable design file is [NOVA Store — Five Product Directions](https://www.figma.com/design/8gjPhe0Xjb29mT67MUlYB1).

| Direction | Figma frame | Character | Complete specification |
| --- | --- | --- | --- |
| 01 / ATELIER EDITORIAL | `3:2` | Premium editorial commerce, large imagery, story-led merchandising | [Design README](docs/designs/01-atelier-editorial/README.md) |
| 02 / CHROMA MARKET | `3:3` | Expressive color, campaign energy, stronger promotional moments | [Design README](docs/designs/02-chroma-market/README.md) |
| 03 / QUIET GRID | `3:4` | Calm grid, clear hierarchy, efficient product comparison | [Design README](docs/designs/03-quiet-grid/README.md) |
| 04 / NIGHT SHIFT | `3:5` | Dark, cinematic, high-contrast, technical feel | [Design README](docs/designs/04-night-shift/README.md) |
| 05 / FIELD NOTES | `3:6` | Editorial notes, utility, discovery, and content-led browsing | [Design README](docs/designs/05-field-notes/README.md) |

All five directions are equal, complete design candidates. Each must support the same functional feature map: women’s, men’s, and children’s clothing discovery; home; category landing; listing and filters; search; product detail; cart; checkout; payment recovery; order confirmation and tracking; account and support; editorial and SEO pages; and the complete admin surface. Each direction must include desktop, tablet, mobile, loading, empty, error, slow-network, offline, disabled, success, stock-conflict, and payment-conflict states. Only visual hierarchy, density, tone, merchandising emphasis, and design tokens change.

Customer-visible Persian audience labels are fixed across all five directions: `زنانه` (women), `مردانه` (men), and `بچگانه` (children). Use these exact labels in navigation, category chips, filters, breadcrumbs, campaign copy, and admin taxonomy fixtures.

### Shared design-system rules

- Use a token layer for color, spacing, radius, typography, elevation, motion, and z-index.
- Define both LTR-safe and RTL-safe layout primitives. Prefer logical CSS properties such as `margin-inline` and `padding-inline`.
- Keep product cards consistent enough for comparison; use editorial modules around them rather than redefining every card.
- Make price, availability, shipping promise, and primary action visually dominant.
- Treat mobile bottom actions, filters, and cart access as first-class interaction patterns.
- Use shadcn/ui components as primitives, then compose branded components in `packages/ui`.
- Add loading skeletons, empty states, errors, and offline/slow-network states to every core flow.
- Never rely on color alone for stock, status, discount, or validation feedback.

### Figma-to-code acceptance

- Every direction has desktop and mobile frames for home, listing, product, cart, checkout, account, content, support, and admin, with tablet frames for the highest-risk workflows.
- The component inventory maps to implemented shadcn/ui primitives or documented custom components.
- RTL review covers Persian text, mixed numerals, breadcrumbs, drawers, tables, charts, and payment references.
- Visual regression snapshots are approved at mobile, tablet, and desktop breakpoints.
- Screenshot QA evidence is a release gate. The initial automated visual capture was rate-limited on the Figma Starter plan, so each approved frame must later receive a manual or successful automated screenshot record.

### Deterministic Figma construction contract

The five direction READMEs are visual specifications layered on top of one shared contract. A designer must be able to build a frame by reading the relevant direction README and this section without inventing dimensions, states, copy, or component behavior. If a direction-specific rule conflicts with this contract, the direction-specific rule wins only when it is explicitly labelled as an override.

#### Required frame metadata

Every Figma frame and exported screenshot must record the following metadata in its description or handoff table:

| Field | Required value |
| --- | --- |
| Screen ID | One canonical ID from the screen inventory below, for example `PDP` or `ADMIN_PRODUCT_EDIT` |
| Direction | `AE`, `CM`, `QG`, `NS`, or `FN` |
| Viewport | Exact width × height in pixels; use `1440`, `1280`, `1024`, `768`, `390`, or `360` width where applicable |
| Scroll state | `top`, `mid`, `bottom`, or a named scroll position such as `PDP/Details` |
| Data state | Default, populated, empty, loading, error, offline, or another state from the state matrix |
| RTL mode | `fa-IR` document direction; every embedded Latin/numeric reference is explicitly marked LTR |
| Grid | Column count, content width, margin, gutter, and alignment origin |
| Component set | Exact component instance names and property values used in the frame |
| Content set | Product/order/content fixture ID and approved Persian strings |
| Asset set | Image asset ID, source dimensions, crop mode, focal point, and alt text |
| Handoff | Direct Figma node URL, owner, review date, and screenshot path once approved |

#### Viewport and long-page policy

Use explicit viewport frames for construction and screenshot comparison; do not use `auto` height for an approval frame. The standard viewport heights are `1440 × 900` desktop, `768 × 1024` tablet, `390 × 844` mobile, and `360 × 800` narrow-mobile QA. Long pages are represented by multiple frames with the same viewport and named scroll states (`Scroll-0`, `Scroll-1`, and so on). Each scroll frame repeats the shell metadata and records the exact section bounds visible in that capture.

Scroll offsets are deterministic per viewport and fixed-action state. A section's viewport-local y-position is `pageY - scrollOffset`; a section is visible only when that value intersects the viewport. Use the following scroll strides so content covered by a fixed action is not skipped between captures:

| Frame state | Base usable height | Fixed-action reserve | Scroll step and offset sequence |
| --- | ---: | ---: | --- |
| Desktop, no fixed action | `900` | `0` | `900`: `0, 900, 1800, 2700…` |
| Tablet, no fixed action | `1024` | `0` | `1024`: `0, 1024, 2048, 3072…` |
| Mobile, no fixed action | `764` | `0` | `764`: `0, 764, 1528, 2292…` |
| Mobile, `52 px` CTA/save bar | `764` | `52` | `712`: `0, 712, 1424, 2136…` |
| Mobile, `72 px` purchase bar | `764` | `72` | `692`: `0, 692, 1384, 2076…` |
| Narrow, no fixed action | `720` | `0` | `720`: `0, 720, 1440, 2160…` |
| Narrow, `52 px` CTA/save bar | `720` | `52` | `668`: `0, 668, 1336, 2004…` |
| Narrow, `72 px` purchase bar | `720` | `72` | `648`: `0, 648, 1296, 1944…` |

Mobile regular frames reserve a `64 px` bottom navigation and a `16 px` safe-area inset (`80 px` total), so base usable height is viewport height minus `80 px`. A full-width `72 px` purchase bar uses `bottom=80` and y=`692` in a `390 × 844` frame or y=`648` in a `360 × 800` frame. A `52 px` checkout/cart/save CTA uses y=`712` or y=`668` respectively. Fixed overlays are excluded from the scroll canvas, and the corresponding action reserve is subtracted from the scroll step. Full-viewport modal layers such as `SEARCH`, `AUTH`, and `CART_DRAWER` explicitly suppress the underlying navigation and use the full frame instead. Direction READMEs must use these formulas instead of advancing every mobile screen by the base stride.

#### Canonical screen inventory

These IDs are shared by all five directions. A direction may add a visual variant, but it may not remove a required screen.

```text
HOME
CATEGORY_WOMEN / CATEGORY_MEN / CATEGORY_CHILDREN
PLP_WOMEN / PLP_MEN / PLP_CHILDREN
SEARCH
PDP
CART_DRAWER / CART
AUTH
CHECKOUT_ADDRESS / CHECKOUT_SHIPPING / CHECKOUT_PAYMENT
CONFIRMATION / TRACKING
ACCOUNT_DASHBOARD / PROFILE / ADDRESSES / ORDERS / ORDER_DETAIL
SUPPORT / SECURITY / NOTIFICATIONS
CAMPAIGN / GUIDE / ARTICLE / LOOKBOOK
ABOUT / TRUST / SHIPPING_POLICY / RETURNS_POLICY / SIZE_GUIDE / CARE_GUIDE
FAQ / CONTACT / PRIVACY / TERMS
NOT_FOUND / OFFLINE / MAINTENANCE
ADMIN_LOGIN / ADMIN_DASHBOARD / ADMIN_PRODUCTS / ADMIN_PRODUCT_EDIT
ADMIN_VARIANTS / ADMIN_MEDIA / ADMIN_CATEGORIES / ADMIN_INVENTORY
ADMIN_ORDERS / ADMIN_ORDER_DETAIL / ADMIN_PAYMENTS / ADMIN_PROMOTIONS
ADMIN_CUSTOMERS / ADMIN_CUSTOMER_DETAIL / ADMIN_CONTENT / ADMIN_AUDIT / ADMIN_OPERATIONS
```

#### Screen-sheet schema

Each canonical screen gets a screen sheet with one row for every major section. The row format is intentionally mechanical so that the five directions can be compared at equal scope.

| Column | What must be recorded |
| --- | --- |
| Section | Stable name such as `Header`, `Hero`, `FilterRail`, `ProductGrid`, or `StickyPurchaseBar` |
| Bounds | Exact `x`, `y`, `width`, and `height` at the target viewport |
| Layout | Auto Layout direction, gap, padding, alignment, wrapping, and min/max sizing |
| Token | Color, type, spacing, radius, elevation, motion, and z-index token names; no unexplained one-off values |
| Content | Exact Persian copy, content fixture, character limit, line limit, and truncation rule |
| Asset | Figma asset ID, source size, aspect ratio, crop/focal point, loading fallback, and alt text |
| Component | Component name, variant, component properties, instance swaps, and nested slots |
| State | State ID and visible state-specific copy/action |
| Responsive change | What moves, hides, stacks, becomes sticky, or changes interaction at each breakpoint |
| Interaction | Trigger, result, transition duration, focus target, URL/query change, and recovery path |

#### Responsive section-bound templates

The direction READMEs provide desktop and primary-mobile stacks. Unless a direction explicitly overrides a value, the following exact tablet and narrow-mobile bounds apply to every screen ID in the corresponding family. Coordinates use the same full-page coordinate system as the direction stacks.

| Screen family | Tablet `768 × 1024` | Narrow `360 × 800` |
| --- | --- | --- |
| `HOME` | `Hero(32,140,704,480)` → `Audience(32,652,704,240)` → `Products(32,924,704,432)` → `Editorial(32,1380,704,320)` → `Trust(32,1724,704,280)` | `Hero(16,84,328,400)` → `Audience(16,516,328,200)` → `Products(16,740,328,396)` → `Editorial(16,1168,328,300)` → `Trust(16,1500,328,260)` |
| `CATEGORY_*` | `Hero(32,140,704,360)` → `Subcategories(32,516,704,220)` → `Products(32,768,704,432)` → `GuideSEO(32,1224,704,360)` | `Hero(16,84,328,320)` → `Subcategories(16,428,328,200)` → `Products(16,660,328,396)` → `GuideSEO(16,1080,328,360)` |
| `PLP_*` | `FilterSortBar(32,140,704,52)` → `ProductGrid(32,216,704,900)`; cards `224×396`, 16 px gap; filter sheet `32,140,704,844` | `FilterSortBar(16,84,328,52)` → `ProductGrid(16,160,328,900)`; cards `160×396`, 8 px gap; filter sheet `16,84,328,716` |
| `SEARCH` | `SearchSurface(32,140,704,600)` → `Results(32,756,704,620)` | `SearchLayer(0,0,360,800)` + `SearchSurface(0,84,360,716)` with field `16,84,328,48` and results `16,148,328,640`; modal layer hides underlying bottom navigation |
| `PDP` | `Gallery(32,140,704,600)` → `PurchaseInfo(32,764,704,600)` → `Details(32,1388,704,420)` | `Gallery(16,84,328,410)` → `PurchaseInfo(16,510,328,680)` → `Details(16,1214,328,420)`; fixed purchase bar `390: 0,692,390,72`; narrow `0,648,360,72` |
| `CART`/checkout | `ItemsOrStep(32,140,704,600)` → `Summary(32,764,704,360)`; checkout CTA `32,956,704,52` is in-flow, not fixed | `ItemsOrStep(16,84,328,600)` → `Summary(16,700,328,360)`; fixed CTA `390: 16,712,358,52`; narrow `16,668,328,52` |
| `AUTH` | `AuthLayer(0,0,768,1024)` + `Panel(164,180,440,560)` | `AuthLayer(0,0,360,800)` + `Form(16,84,328,650)`; no fixed action; modal layer hides underlying bottom navigation |
| `CART_DRAWER` | `Drawer(384,0,384,1024)` | `Sheet(0,84,360,716)`; modal layer suppresses underlying navigation |
| `NOT_FOUND`/`OFFLINE`/`MAINTENANCE` | `Message(144,300,480,300)`; action `176,616,416,52` | `Message(16,216,328,300)`; action `16,532,328,52` |
| `CONFIRMATION`/`TRACKING` | `Receipt(32,140,704,520)` → `Timeline(32,684,704,520)` | `Receipt(16,84,328,400)` → `Timeline(16,516,328,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountHeader(32,140,704,144)` → `AccountNav(32,316,704,52)` → `PrimaryContent(32,392,704,820)` | `AccountHeader(16,84,328,120)` → `AccountNav(16,228,328,52)` → `PrimaryContent(16,296,328,820)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `SupportHeader(32,140,704,144)` → `SearchOrTabs(32,316,704,96)` → `FAQOrTicketContent(32,436,704,820)` | `SupportHeader(16,84,328,120)` → `SearchOrTabs(16,228,328,104)` → `FAQOrTicketContent(16,356,328,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHero(32,140,704,420)` → `ReadingMeasure(64,592,640,760)` → `ProductReferences(32,1384,704,432)` | `StoryHero(16,84,328,320)` → `ReadingMeasure(16,428,328,900)` → `ProductReferences(16,1352,328,396)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(32,140,704,160)` → `TOCOrControls(32,332,704,96)` → `ReadingMeasure(64,460,640,820)` → `RelatedOrContact(32,1304,704,300)` | `DocumentHeader(16,84,328,140)` → `TOCOrControls(16,244,328,96)` → `ReadingMeasure(16,356,328,900)` → `RelatedOrContact(16,1272,328,300)` |
| `ADMIN_*` | `Topbar(0,0,768,56)` → `SectionNav(32,80,704,52)` → `PrimaryPanel(32,156,704,820)` | `Topbar(0,0,360,56)` → `SectionNav(16,80,328,52)` → `PrimaryPanel(16,156,328,760)` |

#### Canonical component property API

The same property names must be used in all five directions. Visual styles may change, but property names and behavior stay compatible.

| Component | Required properties |
| --- | --- |
| `Button` | `size=sm\|md\|lg`, `tone=primary\|secondary\|outline\|ghost\|destructive`, `state=default\|hover\|pressed\|focus\|disabled\|loading\|error\|success`, `leadingIcon=true\|false`, `trailingIcon=true\|false`, `fullWidth=true\|false` |
| `IconButton` | `size=sm\|md\|lg`, `tone=ghost\|surface\|outline`, `state`, `icon`, `tooltip`, `ariaLabel` |
| `Field` | `kind=text\|phone\|search\|textarea`, `state=empty\|filled\|focus\|disabled\|loading\|error\|success`, `direction=rtl\|ltr`, `prefix`, `suffix`, `helper` |
| `Select` | `mode=single\|multiple`, `state=placeholder\|selected\|open\|disabled\|error`, `optionCount`, `selectedCount`, `mobilePresentation=inline\|sheet` |
| `ProductCard` | `audience=women\|men\|children`, `status=regular\|new\|sale\|lowStock\|outOfStock\|loading`, `showSwatches`, `showSecondImage`, `showWishlist`, `imageRatio=4:5`, `titleLines=1\|2` |
| `MediaGallery` | `mode=image\|video\|fallback`, `mediaCount`, `activeIndex`, `zoom=true\|false`, `state=ready\|loading\|failed` |
| `SizeSelector` | `system=women\|men\|children`, `state=empty\|selected\|lowStock\|unavailable\|error`, `sizeCount`, `showGuide` |
| `CartItem` | `state=default\|updating\|removed\|stockConflict\|priceChange\|error`, `quantity`, `showRemove`, `showConflictAction` |
| `OrderSummary` | `state=default\|recalculating\|couponSuccess\|couponError\|quoteExpired`, `showShipping`, `showCoupon`, `ctaState` |
| `Dialog/Drawer/Sheet` | `type=info\|form\|confirmation\|destructive\|navigation\|cart\|filters\|sizeGuide`, `state=open\|closing\|loading\|error`, `dismissible`, `returnFocusId` |
| `DataTable` | `density=dense\|comfortable`, `state=ready\|loading\|empty\|error`, `selectable`, `sortable`, `expandedRows`, `mobileMode=table\|cards` |

#### Shared page and state matrix

At minimum, each direction must show these states in the named screens. Additional direction-specific states are allowed but do not replace this baseline.

| Screen | Required state frames |
| --- | --- |
| Home/category/PLP/search | Default, loading, slow image/network, empty/no result, request error, offline |
| PDP | Variant empty, color selected, size selected, size error, low stock, out of stock, sale, zoom, add success, price changed, request error |
| Cart | Default, empty, quantity updating, removed item, stock conflict, price change, coupon success, coupon error, recalculating, offline |
| Checkout | Saved address, new address, validation error, unsupported region, quote loading, unavailable method, expired quote, payment processing, redirect, failed, cancelled, timeout, pending verification |
| Confirmation/tracking | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception, support handoff |
| Account/support/content | Default, loading, empty, validation error, permission error, offline, maintenance, success confirmation |
| Admin | Login invalid/locked/rate-limited, table loading/empty/error, draft invalid/saving/saved/publish-blocked, media failure, inventory discrepancy, payment mismatch, audit success |

#### Interaction and data contracts

- PLP filters serialize to stable query parameters in this order: audience, category, size, color, fit, material, price, stock, sale; removing a chip removes only that parameter.
- Sort is a single query parameter and survives back/forward navigation; filter and sort changes reset pagination to page one.
- Search exposes recent searches locally, debounces requests, labels suggestions by category/product/content, and preserves the corrected query when a typo suggestion is accepted.
- A guest cart has a local draft ID. Signing in merges compatible lines, preserves the latest server price/stock truth, and presents a conflict sheet before removing or changing a line.
- Add-to-cart is disabled until required variants are selected. A stock conflict keeps the customer on the PDP or cart and explains the exact line change.
- Payment retries reuse the same order intent, never silently create a duplicate order, and show `processing`, `pending verification`, `failed`, `cancelled`, and `timeout` as distinct states.
- Address forms validate required Persian fields, phone format, province/city relationship, and unsupported delivery regions before enabling the next step.
- Drawers and dialogs trap focus, close on Escape when dismissible, return focus to the trigger, and never rely on backdrop click alone.
- Every destructive action has a confirmation state and a recoverable success/error message.

#### Asset, copy, and content contract

Every final frame uses named fixtures instead of placeholder text. Each fixture records audience, product/category/content ID, Persian title, price in toman, sale/regular price, color, size set, fit, material, care, inventory, delivery promise, returns summary, and alt text. Asset records include source license/owner, original dimensions, crop, focal point, contrast-safe overlay, and mobile/desktop variants. Text records include maximum characters, maximum lines, and the fallback string for loading, missing, or failed content.

Prices are formatted as `۲٬۴۹۰٬۰۰۰ تومان` for customer UI. SKU, phone, coupon, payment, tracking, and order references are isolated LTR strings. No design may use an English placeholder where a Persian fixture is required.

#### Breakpoint transition contract

| Width | Required transition |
| --- | --- |
| `1440` | Full header/navigation; 12-column grid; desktop rails; full account/admin navigation |
| `1280` | Preserve hierarchy; reduce outer margin before reducing type; keep core two-column PDP/checkout layout |
| `1024` | Collapse admin sidebar to icon rail; convert wide editorial splits to stacked or 8-column compositions; keep primary CTA visible |
| `768` | Use tablet frames for PLP, PDP, cart, checkout, account order detail, admin product edit, and admin order detail; convert data tables to priority columns/cards where specified |
| `390` | Two-column product grid; one-column forms; sticky mobile purchase/checkout action; bottom navigation; filter and size bottom sheets |
| `360` | No horizontal scroll; preserve 44 px targets; reduce gaps before reducing body text; verify long Persian labels and prices |

#### Figma handoff and QA evidence

Before a direction is marked approved, its README must link every canonical frame and state to a direct node URL and record:

- Screenshot exports for `1440`, `768`, `390`, and `360` where required.
- Pixel dimensions and grid overlays checked against the screen sheet.
- Contrast checks for text, controls, status, campaign colors, and dark/light garment media.
- RTL checks for navigation, breadcrumbs, carousels, pagination, timelines, tables, and mixed LTR references.
- Keyboard focus, dialog return-focus, reduced-motion, loading, offline, and error checks.
- Crop, text-wrap, annotation-overlap, sticky-element, and 360 px clipping checks.
- Reviewer, date, evidence path, unresolved issue, and approval status.

The direction-specific READMEs below now include the values and screen maps that instantiate this contract for each candidate.

## Iran hosting and production setup

### Hosting objectives

- Keep primary compute, database, media, and backups inside Iran unless a documented exception is approved.
- Optimize for Iranian user latency, provider support, recoverability, and operational simplicity.
- Avoid coupling application code to one vendor's proprietary deployment API.
- Maintain a second Iranian backup destination in a different provider or data center.
- Treat current service availability, contracts, acceptable-use terms, and data obligations as items to re-check before purchase.

### Recommended topology

```text
Customer browser
    |
    v
.ir / optional .com domain -> authoritative DNS -> TLS reverse proxy
                                               |
                         +---------------------+---------------------+
                         |                                           |
                   React/Vite assets                         NestJS API
                         |                                           |
                         +------------------+------------------------+
                                            |
                 +--------------------------+--------------------------+
                 |                          |                          |
             PostgreSQL                 Redis/queue              Object storage
             private network            private network            private or S3-compatible
                 |                          |                          |
                 +--------------------------+--------------------------+
                                            |
                                   encrypted backup job
                                            |
                              second Iranian provider/data center
```

### Environment separation

| Environment | Purpose | Data policy |
| --- | --- | --- |
| Local | Development and component work | Seed data only; never production secrets |
| Staging | QA, integration, payment sandbox, SEO preview | Synthetic or anonymized data |
| Production | Customer traffic and operations | Restricted access, audited changes, tested backups |

### Initial production shape

These are starting points for a pilot, not promises of capacity. Benchmark with realistic catalog, image sizes, and checkout concurrency before committing:

- One application VM or managed app service: approximately 4 vCPU and 8 GB RAM.
- One private PostgreSQL VM or managed PostgreSQL service: approximately 4 vCPU, 8 GB RAM, and NVMe-backed storage.
- Redis-compatible service for queues, locks, rate limits, and short-lived cache; keep it private.
- S3-compatible object storage for product media and exports; do not serve large media from the API container.
- One worker process from the same release artifact as the API.
- Reverse proxy with TLS, compression, request limits, security headers, and static asset caching.
- A separate encrypted backup destination in another Iranian provider/data center.

For a very small pilot, app and worker can share a VM, but PostgreSQL should remain private and backups must be independent of the application disk.

### Provider shortlist and evaluation

These are candidates to benchmark, not endorsements or a final ranking:

| Candidate | What its published material suggests | Use in the pilot | Verify before purchase |
| --- | --- | --- | --- |
| [Liara](https://liara.ir/) | Iranian cloud platform with PaaS, database, Redis, storage, DNS, and Iranian VM offerings | Fastest path if managed services and developer workflow are more valuable than host-level control | Data export, backup ownership, private networking, quotas, incident process, and exit procedure |
| [Parspack](https://docs.parspack.com/server/cloud-server/) | Iranian cloud/VPS products, multiple locations, resource management, and documentation for backups | IaaS-style option when Docker and host control are required | SLA wording, snapshot/PITR behavior, restore test, network isolation, and support response |
| [IranServer](https://www.iranserver.com/) | Iranian hosting/VPS offerings, status page, and published multi-location hosting information | Candidate for managed support or multiple-location evaluation | Exact product SLA, data-center placement, backup responsibility, and production support terms |
| Secondary provider | Any provider meeting the same scorecard | Encrypted backup and disaster-recovery target | Independent failure domain and successful restore drill |

Use a written scorecard instead of choosing by brand or advertised CPU alone:

| Criterion | Weight | Pass condition |
| --- | ---: | --- |
| Iranian network latency and consistency | 20% | Load-test p95 API and asset latency from at least three Iranian networks |
| Availability and incident transparency | 15% | Published SLA, status process, and clear incident communication |
| Backup and restore | 15% | Restore a clean database and media snapshot within the target RTO |
| Private networking and firewall controls | 10% | Database and Redis have no public inbound exposure |
| Object storage and media delivery | 10% | Signed/private media and predictable egress behavior |
| Scaling and migration path | 10% | Resize or move without vendor-specific application code |
| Support quality | 10% | Test ticket receives a useful technical response within the target window |
| Price predictability | 5% | Clear monthly, traffic, storage, and backup costs |
| Terms and compliance fit | 5% | Contract, acceptable use, data handling, and exit terms are acceptable |

### Provider pilot procedure

1. Provision the same Dockerized release on two shortlisted providers.
2. Seed the same catalog, image set, and anonymized traffic profile.
3. Measure page TTFB, API p50/p95, image delivery, error rate, and deploy time.
4. Kill the app process, database process, worker, and one VM independently; verify recovery behavior.
5. Create a backup, delete a disposable database, and restore it to a clean environment.
6. Open a support ticket with a non-sensitive technical question.
7. Record actual monthly cost, backup cost, egress, and support response.
8. Select a primary and a secondary provider only after the restore drill passes.

### Domain, DNS, and TLS

- Register the `.ir` domain through the current IRNIC process and keep the registrant, renewal email, and recovery procedure under company control. The IANA delegation record identifies IRNIC/nic.ir as the `.ir` registry service: [IANA .ir delegation record](https://www.iana.org/domains/root/db/ir.html).
- Consider owning the matching `.com` as a brand-protection and future-accessibility measure, but choose one canonical public domain.
- Decide whether `www` or the apex is canonical and redirect the other with a single permanent redirect.
- Use authoritative DNS with documented ownership, low-risk changes, and DNSSEC if the selected registrar/DNS service supports it reliably.
- Automate TLS certificate renewal and test renewal before launch. Keep a documented fallback certificate procedure.
- Use separate subdomains such as `app.example.ir`, `api.example.ir`, `admin.example.ir`, and `media.example.ir` only when the security and caching boundaries justify them.

### Deployment sequence

1. Provision the production and backup environments.
2. Create a non-root deployment user and SSH-key-only access.
3. Configure firewall rules: public 80/443 only; restrict SSH; deny public PostgreSQL and Redis.
4. Install security updates, time synchronization, log rotation, and intrusion/rate controls.
5. Configure environment secrets through the provider secret store or an encrypted deployment mechanism.
6. Deploy reverse proxy, web assets, API, worker, PostgreSQL/managed database, Redis, and object storage adapters.
7. Run Prisma migrations using `prisma migrate deploy`; never use development reset commands in production.
8. Run readiness checks, smoke tests, payment sandbox checks, and a test notification.
9. Enable backups, backup alerts, application metrics, error alerts, and uptime checks.
10. Verify a rollback to the previous immutable image/tag.
11. Run the restore drill and record the result in the release checklist.

### Backup and disaster recovery policy

Starting targets:

- RPO: 15 minutes for transactional data if the selected PostgreSQL service supports continuous archiving; otherwise document the larger achievable window.
- RTO: 60 minutes for a complete restore of the core store.
- Daily encrypted full backup retained for 30 days.
- More frequent database backup/WAL archiving where supported.
- Media versioning or daily object-storage sync with integrity checks.
- Monthly restore to an isolated environment.
- Quarterly provider-failure exercise using the secondary target.
- Backup keys stored separately from the production VM.
- Never claim “backed up” until a restore has been verified.

### Security baseline

- Keep PostgreSQL, Redis, object-storage management, and admin services off the public internet.
- Use least-privilege database roles and separate migration credentials from runtime credentials.
- Use secure, httpOnly, same-site session cookies or another documented session design; do not store long-lived access tokens in localStorage.
- Add password hashing, login throttling, reset-token expiry, admin MFA, and audit logs.
- Validate all input at the API boundary with Zod/class-validator and enforce authorization inside use cases.
- Verify payment and shipping webhook signatures; make handlers idempotent.
- Redact tokens, payment payloads, passwords, and personal data from logs.
- Add CSRF protection where cookie-authenticated state-changing requests require it.
- Apply rate limits to login, search, coupon, checkout, review, and webhook endpoints.
- Restrict image uploads by MIME, size, extension, and malware policy; store outside the application filesystem.
- Patch dependencies on a scheduled cadence and record security advisories.
- Prepare an incident runbook covering account compromise, payment mismatch, data leak, provider outage, and rollback.

### Monitoring and alerts

Track at minimum:

- Availability and TLS expiry.
- HTTP 5xx rate, latency p50/p95/p99, and request volume.
- Checkout-start to order-created conversion.
- Payment callback failures and webhook age.
- Queue depth, retry count, and dead-letter jobs.
- PostgreSQL connections, slow queries, disk, backup age, and replication/archiving status.
- Redis memory and eviction behavior.
- Object-storage failures and media 4xx/5xx.
- CPU, memory, disk, and network saturation.

Alert on customer-visible failures and recovery risks, not every harmless warning. Keep a status page or incident communication channel appropriate for the business.

## SEO plan for Persian ecommerce

Organic SEO and Google Ads are separate channels. Google's current advertising policy says Google Ads is not available to Iran-based advertisers and that campaigns on behalf of Iran-based businesses are not allowed; this plan therefore does not include foreign-account workarounds. See [Google Ads countries and territories](https://support.google.com/google-ads/answer/6163740?hl=en-uk) and [Google Ads export compliance](https://support.google.com/adspolicy/answer/6023676?hl=en).

### Technical SEO architecture

- Use `fa-IR` as the primary locale and set document language and direction explicitly.
- Keep the public domain canonical and use HTTPS everywhere.
- Use stable, human-readable routes such as `/fa/category/<slug>` and `/fa/product/<slug>`.
- Choose one slug policy: Persian Unicode slugs or normalized Latin transliteration. Do not mix policies casually, and never change slugs without a 301 redirect.
- Use self-referencing canonical tags on indexable product and category pages.
- Keep filter, sort, internal-search, cart, account, checkout, and admin routes out of the index unless a deliberate SEO page exists.
- Generate XML sitemaps for products, categories, content, and images; submit a sitemap index when the catalog grows.
- Maintain `robots.txt` and test it against staging URLs before launch.
- Return real `404` responses for removed products and categories where no replacement exists; use `301` only when a close replacement exists.
- Render meaningful product and category HTML in the initial response using prerendering or Vite SSR. Keep the admin application client-rendered.
- Make every important navigation link a real `<a href>` link, not only a click handler.
- Produce `Product`, `Offer`, `BreadcrumbList`, `Organization`, `Review`, and relevant shipping/return policy structured data with truthful values.
- Use explicit product-variant URLs or a documented canonical strategy.
- Optimize image dimensions, modern formats, alt text, lazy loading below the fold, and reserved aspect ratios to prevent layout shift.
- Use long-lived immutable caching for fingerprinted assets and short, controlled caching for catalog HTML/API responses.
- Keep Persian copy unique and useful; do not fill pages with machine-generated or repeated descriptions.

The Vite choice makes this rendering decision important: Google can render JavaScript, but Google's own guidance says server-side or pre-rendering is still useful for speed, crawlers, and bots that do not run JavaScript. See [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

### Information architecture

```text
Home
├── Category landing pages
│   ├── Subcategory pages
│   │   └── Product pages
├── Buying guides and editorial content
├── Campaign/seasonal landing pages
├── Brand/about/trust pages
└── Support, shipping, returns, and contact
```

Link important products from the home page, category pages, guides, campaigns, and post-purchase content. Google's ecommerce guidance emphasizes crawlable navigation and internal links between categories, subcategories, and products: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure?hl=en).

### Persian keyword and content system

Build a keyword map after the product category is confirmed. Start with these intent groups:

| Intent | Page type | Example pattern |
| --- | --- | --- |
| Category | Commercial landing page | `خرید [دسته محصول]` |
| Product | Product page | `[نام محصول] + مشخصات/قیمت` |
| Comparison | Guide or comparison page | `[محصول A] یا [محصول B]` |
| Problem/education | Guide | `راهنمای انتخاب [محصول]` |
| Gift/seasonal | Campaign page | `هدیه [مناسبت]` |
| Trust/logistics | Help page | `شرایط ارسال/مرجوعی [دسته]` |

Every target page needs one clear intent, a useful title, a unique description, one H1, helpful internal links, and a conversion path. Do not publish pages solely to capture variants of the same keyword.

### 90-day SEO roadmap

#### Days 0–14: foundation

- Confirm brand, category vocabulary, Persian spelling, rial/toman display, and URL policy.
- Create metadata and structured-data contracts in the API/client.
- Implement SSR/prerendering for home, category, product, and editorial templates.
- Create canonical, robots, sitemap, redirect, 404, and image rules.
- Set up Search Console and a first-party analytics baseline where accessible.

#### Days 15–45: commercial coverage

- Publish every important category and product with unique copy, media, availability, shipping, and FAQ content.
- Add internal-link modules: related categories, alternatives, guides, best sellers, and recently viewed.
- Fix duplicate URLs, filter indexing, missing titles, broken links, image weight, and soft 404s.
- Measure index coverage, impressions, clicks, search queries, organic landing pages, and conversion.

#### Days 46–90: authority and conversion

- Publish one useful guide or comparison per week based on customer questions and search demand.
- Earn relevant mentions through creators, suppliers, expert reviews, and genuinely useful editorial content.
- Improve pages with impressions but low click-through rate; improve pages with clicks but low conversion separately.
- Add verified reviews, FAQ schema where eligible, and post-purchase content requests.
- Build a monthly technical crawl and content refresh process.

### SEO acceptance criteria

- Important public pages contain useful content without waiting for a client-side API request.
- Sitemap URLs, internal links, canonical tags, and final redirects agree.
- Product structured data matches visible price, availability, and review information.
- Faceted navigation does not create uncontrolled indexable URL combinations.
- Search Console or equivalent crawl monitoring has no unresolved critical indexing errors.
- Lighthouse/Core Web Vitals checks are run on representative mobile pages.

## Ads and paid acquisition plan

### Hard constraint

Do not attempt to evade Google's Iran advertising restrictions with borrowed accounts, false billing locations, or proxy workarounds. This creates account, legal, payment, and business-continuity risk. Re-check the policy before every future channel decision because platform rules can change.

### Iran-first paid channel mix

Use a test-and-learn mix of:

- Local search, display, retargeting, or native advertising networks after their current inventory, targeting, reporting, and business terms are verified.
- Sponsored editorial/native placements in relevant Persian publishers. Native advertising can work when the message is useful, clearly labeled, and matched to the host context; see [SabaVision's native advertising guide](https://blog.sabavision.com/ads/native/what-is-native-ads-and-its-kinds).
- Persian creator and influencer partnerships with unique landing pages and codes.
- Sponsored content or video in locally relevant platforms where the audience and category fit.
- Affiliate or referral partnerships with transparent commissions.
- Owned retargeting through consented email, SMS, Telegram, WhatsApp, or other channels that the business can legally and operationally support.

Shortlist vendors at execution time rather than hard-coding one advertising network into the product. Require a written answer about targeting, conversion reporting, invoice/payment method, ad labeling, brand-safety controls, cancellation, and data handling.

### Campaign structure

1. **Proof campaign:** one category, one audience hypothesis, two landing pages, three creative variants, and one clear conversion event.
2. **Product campaign:** best-margin products with a strong offer, stock, shipping promise, and proof.
3. **Content campaign:** guides or comparison pages for users who are not ready to buy.
4. **Creator campaign:** trackable links, unique codes, usage rights, and a post-campaign sales report.
5. **Retention campaign:** consented cart/browse/reorder messages; never assume every visitor may be retargeted.

### Creative rules

- Write natural Persian copy and display pricing consistently in rial or toman.
- Show the product, offer, delivery expectation, and trust proof quickly.
- Use mobile-first 1:1, 4:5, 9:16, and publisher-specific formats.
- Test one variable at a time where possible: hook, product, proof, offer, CTA, or visual.
- Label sponsored/editorial content honestly.
- Do not advertise products that are unavailable, out of stock, or impossible to deliver in the promised region.
- Build a matching landing page for every campaign instead of sending all traffic to the home page.

### Tracking and attribution

Use a consistent UTM convention:

```text
utm_source=<channel>
utm_medium=<cpc|native|creator|affiliate|social>
utm_campaign=<season-or-product>
utm_content=<creative-variant>
utm_term=<keyword-or-audience>
```

Record first-touch, last-touch, and campaign-touch data, but use contribution margin and incrementality for decisions. Required events:

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
refund_created
review_submitted
referral_shared
```

### Budget and stop rules

Start with a small pilot budget defined by the business's cash flow and gross margin, not a generic industry number. A starting allocation hypothesis after tracking is proven:

- 40% toward the best-performing conversion channel or retargeting where consent and data quality permit.
- 25% toward creators and affiliates.
- 20% toward native/content distribution.
- 10% toward referral or partnership tests.
- 5% toward new experiments.

Change these percentages only after comparing:

```text
Contribution margin per order
= revenue - product cost - payment cost - shipping subsidy - support/refund cost

Allowable CAC
<= contribution margin per order adjusted for the intended payback period
```

Pause a campaign when tracking is broken, promised stock is unavailable, the landing page is materially slower, fraud/refunds rise, or the measured CAC exceeds the approved threshold for the agreed observation window. Do not optimize toward clicks alone.

## Marketing improvement plan

### Positioning

Before launch, write one sentence that answers:

> For [specific Persian customer segment], NOVA Store is the [category/benefit] store that provides [distinctive proof], unlike [alternative], because [credible reason].

The storefront, ads, content, packaging, support scripts, and post-purchase messages must repeat the same promise. “Affordable,” “high quality,” and “fast” are not differentiation without proof.

### Owned, earned, and paid system

| System | Examples | Improvement goal |
| --- | --- | --- |
| Owned | Website, SEO pages, email, SMS, Telegram, WhatsApp, customer support | Build a durable audience that is not rented from one platform |
| Earned | Reviews, UGC, referrals, creator mentions, supplier partnerships | Turn satisfied customers into acquisition assets |
| Paid | Local native/search/display, sponsored content, creators, affiliate | Buy learning and profitable demand with strict stop rules |

### Lifecycle messaging

- Welcome: explain the promise, best categories, trust proof, and a useful first action.
- Browse reminder: show the viewed product/category plus a helpful comparison or FAQ, with consent.
- Cart reminder: show the cart, stock/shipping truth, support entry point, and a clear return-to-cart action.
- Purchase confirmation: receipt, payment reference, delivery expectation, support contact, and what happens next.
- Shipping update: tracking and exception handling; never force the customer to hunt for status.
- Post-purchase education: setup, care, usage, or styling guide appropriate to the category.
- Review request: ask after a realistic usage window; only incentivize reviews in a transparent, policy-compliant way.
- Referral: give the customer a simple shareable benefit and attribute the resulting order.
- Win-back: target customers based on expected reorder or category relevance, not arbitrary spam.

### Content engine

Create a repeatable weekly production loop:

1. Collect customer questions from support, search terms, reviews, and sales conversations.
2. Select one commercial intent and one educational intent.
3. Produce one guide/comparison, two short social assets, one product proof asset, and one email/message variation.
4. Link every asset to a relevant category or product and tag its campaign.
5. Review performance after enough exposure; update or retire weak content.

Content pillars:

- How to choose and compare.
- Product demonstrations and real use.
- Customer stories and verified proof.
- Care, maintenance, and troubleshooting.
- Seasonal, cultural, and gifting moments relevant to the audience.
- Behind-the-scenes trust: sourcing, packaging, delivery, and support.

### Conversion-rate improvement backlog

Prioritize experiments by expected impact, confidence, and effort:

- Improve product photography, first-screen copy, price clarity, and delivery promise.
- Add visible stock truth, returns summary, payment options, and support access.
- Reduce checkout fields and preserve cart state across refresh/login.
- Show shipping cost and arrival estimate before payment.
- Add social proof near the primary action without overwhelming the product information.
- Add “compare,” “save,” and “notify me” only where they help a buying decision.
- Test bundles and threshold-based delivery incentives against margin, not revenue alone.
- Recover payment failures with a clear retry path and support fallback.

### North-star measurement tree

Use **completed, successfully paid orders with healthy contribution margin** as the primary business outcome. Supporting metrics:

```text
Qualified traffic
  -> product views
    -> add-to-cart rate
      -> checkout-start rate
        -> payment-success rate
          -> completed-order rate
            -> contribution margin
              -> repeat purchase / referral / LTV
```

Weekly dashboard:

- Sessions and qualified landing-page sessions.
- Organic impressions, clicks, CTR, and indexed commercial pages.
- Product view, add-to-cart, checkout, payment, and order conversion rates.
- Average order value, contribution margin, refund/cancellation rate, and shipping cost.
- CAC, blended ROAS, payback period, repeat purchase, referral orders, and customer support contacts per order.
- Page speed, availability, payment failure, and delivery SLA.

## Delivery roadmap

### Phase 0 — Decisions and validation

- Confirm the final brand, audience segments within women’s, men’s, and children’s clothing, backend currency storage unit, return policy, shipping regions, payment options, and support channels.
- Complete all five Figma directions, compare them at equivalent scope, select the production baseline, and approve responsive/RTL screens.
- Pilot two Iranian hosting providers using the scorecard and restore drill.
- Confirm domain, analytics, ad-channel eligibility, and current legal/compliance requirements with local counsel or qualified advisors.
- Define gross margin, allowable CAC, launch budget, and success thresholds.

**Exit gate:** written decisions exist and no P0 dependency is unknown.

### Phase 1 — Engineering foundation

- Create the monorepo and workspace scripts.
- Add strict TypeScript, linting, formatting, environment validation, and CI.
- Create NestJS modules, Prisma schema baseline, PostgreSQL migrations, seed data, and API error format.
- Establish React/Vite routing, design tokens, RTL shell, shadcn/ui setup, and responsive breakpoints.
- Add typed API client and TanStack Query conventions.

**Exit gate:** a seeded local stack starts from one documented command and passes typecheck/lint/build.

### Phase 2 — Catalog and discovery

- Build product/category/variant/media management.
- Build home, category, search, filters, sorting, pagination, and product detail.
- Add image upload adapter, media transformations, metadata, and structured-data contracts.
- Add loading, empty, error, and out-of-stock states.

**Exit gate:** a user can discover and understand a seeded product on mobile and desktop.

### Phase 3 — Identity and cart

- Add account registration/login/reset and session policy.
- Add guest cart, persistent cart, cart merge, quantity/variant validation, and stock checks.
- Add address management and customer-facing order history shell.

**Exit gate:** a guest and authenticated user can maintain a valid cart across refresh and login.

### Phase 4 — Checkout and order operations

- Add shipping quote, checkout validation, inventory reservation, order creation, payment adapter, callback/webhook idempotency, and failure recovery.
- Add order state machine, admin order queue, notifications, and customer tracking page.
- Add cancellation/refund placeholders even if manual operations handle them initially.

**Exit gate:** sandbox payment success, failure, duplicate callback, timeout, and retry scenarios are tested.

### Phase 5 — Admin and growth primitives

- Finish product/order/customer/promotion administration.
- Add content blocks, redirects, SEO metadata, sitemap generation, and audit logs.
- Add analytics event pipeline, UTM capture, consent controls, and dashboard queries.

**Exit gate:** an operator can publish products, fulfill an order, update content, and measure the funnel without database edits.

### Phase 6 — Iran production readiness

- Provision the selected Iranian primary and backup environments.
- Deploy with Docker, private networking, TLS, backups, monitoring, alerts, and runbooks.
- Test performance from multiple Iranian networks and complete the restore drill.
- Verify payment, shipping, SMS, support, domain renewal, and certificate renewal procedures.

**Exit gate:** rollback, restore, incident, and provider-support procedures have been executed, not just documented.

### Phase 7 — Launch and marketing

- Launch with a narrow category/product set and explicit inventory.
- Publish core category, product, guide, trust, delivery, and returns pages.
- Run one paid proof campaign and one creator/affiliate test only after attribution is validated.
- Start lifecycle messages and request verified feedback.
- Review the weekly dashboard and prioritize two conversion experiments per cycle.

**Exit gate:** the business can explain where every order came from and whether it produced acceptable contribution margin.

## Quality and validation plan

The repository has no application code yet, so the following are planned checks rather than completed checks:

### Local engineering checks

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
docker compose config
```

### Database and API checks

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm test:integration
pnpm test:e2e
```

Cover at minimum:

- Product/category publishing and slug redirects.
- Cart merge and invalid variant/stock behavior.
- Inventory reservation expiry and concurrent checkout.
- Payment success, failure, duplicate webhook, and delayed callback.
- Order state transitions and immutable snapshots.
- Coupon limits, date windows, stacking rules, and refund behavior.
- Auth throttling, authorization, admin MFA, and audit events.
- Sitemap, robots, canonical, 404, structured data, and SSR/prerendered HTML.
- RTL rendering, keyboard navigation, mobile checkout, slow network, and error recovery.

### Production smoke checks

- `GET /health/live` returns process health.
- `GET /health/ready` verifies required dependencies.
- Home, category, product, cart, checkout, and order pages load over HTTPS.
- A sandbox payment can create exactly one order.
- A duplicate callback does not create a second order or payment.
- Backup age is within policy and a restore test has a recorded result.
- Certificate, domain, DNS, object storage, queue, database, and monitoring checks are green.

## Open decisions

These must be resolved before implementation is considered ready to start:

- What is the final brand name, domain, logo, and tone of voice?
- Will the database and payment boundary store money as rial or toman integers? Customer-facing interfaces will display toman.
- Which payment gateway, shipping carriers, SMS provider, and support channel are available and contractually approved?
- Which two Iranian hosting providers pass the pilot scorecard and restore drill?
- Is PostgreSQL managed or self-hosted, and who owns patching and backup verification?
- What is the launch budget, gross margin, allowable CAC, and minimum viable order volume?
- Which of the five complete Figma directions becomes the production baseline after equivalent responsive, RTL, accessibility, and workflow review?
- Which local advertising networks, creators, publishers, and affiliate partners fit the product category?
- Which consent, privacy, consumer-protection, tax, ecommerce, advertising, payment, and content obligations apply? Obtain current local advice rather than treating this README as legal guidance.

## Reference material

### GitHub benchmarks

- [Medusa](https://github.com/medusajs/medusa)
- [Vendure](https://github.com/vendurehq/vendure)
- [React Ecommerce Boilerplate](https://github.com/viniarruda/react-ecommerce)
- [VZ Commerce](https://github.com/ValentinZoia/e-commerce)
- [ShopVerse](https://github.com/vivirony955/ShopVerse)
- [Mirai website-cms](https://github.com/mirai-sh379/website-cms)

### Official framework and library guidance

- [NestJS documentation](https://docs.nestjs.com/)
- [Prisma transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions)
- [Prisma relation queries](https://www.prisma.io/docs/orm/v6/prisma-client/queries/relation-queries)
- [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query invalidation](https://tanstack.com/query/latest/docs/reference/QueryClient?from=reactQueryV3)
- [TanStack Query prefetching](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [shadcn/ui components](https://ui.shadcn.com/docs/components)
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming)
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist.html)
- [Vite guide](https://vite.dev/guide/)

### Iran hosting and domain references

- [IANA `.ir` delegation record](https://www.iana.org/domains/root/db/ir.html)
- [Liara cloud services](https://liara.ir/)
- [Liara Iranian VPS](https://liara.ir/products/iranian-vps)
- [Parspack cloud-server documentation](https://docs.parspack.com/server/cloud-server/)
- [IranServer status page](https://status.iranserver.com/)
- [IranServer terms of service](https://www.iranserver.com/assets/documents/IranServer-Terms-of-Service-v5-new.pdf)

### SEO and advertising references

- [Google Search ecommerce SEO](https://developers.google.com/search/docs/specialty/ecommerce?authuser=77&hl=en)
- [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites?authuser=2)
- [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=en)
- [Google ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure?hl=en)
- [Google Ads countries and territories](https://support.google.com/google-ads/answer/6163740?hl=en-uk)
- [Google Ads export compliance](https://support.google.com/adspolicy/answer/6023676?hl=en)
- [SabaVision native advertising guide](https://blog.sabavision.com/ads/native/what-is-native-ads-and-its-kinds)

## Definition of done for the first launch

NOVA Store is ready for a controlled public launch when:

- Core P0 journeys work in Persian RTL on supported mobile and desktop browsers.
- Product, inventory, order, payment, shipping, notification, and webhook behavior is observable and recoverable.
- The public storefront has prerendered/SSR HTML, working canonical/robots/sitemap behavior, and validated product structured data.
- The primary Iranian deployment and independent Iranian backup target have passed latency, failure, rollback, and restore drills.
- Security, admin access, secrets, logs, rate limits, and personal-data handling have been reviewed.
- Analytics events, UTM capture, consent behavior, and the weekly KPI dashboard are working.
- One launch campaign can be measured from impression or referral through order and contribution margin.
- The team has runbooks for deployment, rollback, payment mismatch, provider outage, backup restore, and customer communication.
