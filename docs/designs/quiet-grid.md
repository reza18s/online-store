# 03 / QUIET GRID — NOVA COLLECTION INDEX

> Complete Figma design specification for a modular Persian clothing storefront serving women, men, and children equally. The file keeps the `QUIET GRID` route identity and evolves the visual direction into **NOVA COLLECTION INDEX**: a distinct, high-legibility archive/catalog system with warm paper, near-black structure, muted-red index markers, numbered product language, and systematic comparison. This is one of three equal, complete design candidates for NOVA Store.

## 1. Direction

NOVA COLLECTION INDEX treats the storefront as a numbered collection archive: a warm paper canvas, softened near-black navigation bands, muted-red index markers, rounded but disciplined commerce surfaces, strong RTL alignment, and product-first indexed cards.

The direction is **audience-neutral by design**. Women, men, and children use the same archive grammar and receive equal visual authority. A campaign may feature one audience, but the design identity cannot depend on clothing, Jordan drops, streetwear language, or any single external retailer.

The direction must feel:

- Quietly confident, contemporary, and easy to scan.
- Equally credible for women, men, and children.
- High-legibility and resilient on slow Iranian mobile networks.
- Editorial enough for collection storytelling, structured enough for side-by-side comparison.
- Distinct from Design 1's luxury ivory/oxblood magazine language and Design 2's mint/green boutique language.
- Recognizable through numbering, rules, archive metadata, near-black structure, warm paper, and muted-red signals rather than a borrowed brand aesthetic.

All customer, content, account, and admin pages remain required. The visual adapter may foreground a specific campaign audience in an individual fixture, but the shared navigation, taxonomy, imagery system, and component language must remain audience-balanced.

Source grounding:

- Historical research source: ElevenStyle may remain documented as inspiration for catalog density and dispatch messaging, but it is **not** the visual or content authority for NOVA Collection Index. Production fixtures must come from NOVA-owned taxonomy and approved content.
- Supplied visual references: the five attached `Photo 1`–`Photo 5` screens. Retain their useful behavior—filter rail, rounded product media, variant selectors, PDP detail blocks, cart summary, and responsive stacking—but do not copy their brand, logo, copy, or exact composition.
- Asset rule: use NOVA-owned, licensed, or project-approved women/men/children product photography. Do not use the reference screenshots as product images in the storefront.

## Shared feature and API contract

Design 3 is a visual adapter over the same customer, commerce, identity, content, and admin interface as Designs 1 and 2. Its index/archive styling may change hierarchy, density, copy treatment, and composition, but it must not fork behavior, payloads, identifiers, or state meanings.

### Feature parity with Designs 1 and 2

| Capability group | Shared features | Design 3 visual adapter |
| --- | --- | --- |
| Discovery | Home merchandising, women/men/children category landing, catalog filters and sorting, search/autocomplete, pagination or incremental loading, product detail, recently viewed, wishlist, and collection entry points | NOVA Collection Index category rail, collection story circles, numbered product cards, dispatch-led home hero, and archive-style filter rail |
| Product truth | Product identity, audience/category, media and alt text, price and compare-at price, toman formatting, color, size, fit, care, stock, low-stock, unavailable, and sale states | Clear product index metadata, 4:5 media, muted-red sale/dispatch markers, size grid, color swatches, fit/material details |
| Cart and checkout | Cart drawer and page, quantity updates, removal, coupon, stock/price conflict, address, shipping quote, payment method, payment recovery, confirmation, and order tracking | Dispatch-manifest cart summary, near-black rounded primary CTA, muted-red conflict markers, same three-step checkout and recovery semantics |
| Identity and access | Customer phone/OTP authentication, guest continuation, session expiry/revocation, admin password plus MFA-ready flow, roles, permission denied, locked/rate-limited/error states, and security settings | Compact paper auth surfaces and dark operations shell; authorization remains in the shared access interface |
| Account and support | Profile, communication preferences, addresses and destructive confirmation, orders and empty state, immutable order snapshot, support entry, security/session, notifications, and order-related help | Order index rows, delivery/support cards, session controls, and readable status timeline |
| Editorial and utility | Campaign, guide, article, lookbook, about/brand story, trust/authenticity, shipping, returns, size, garment care, FAQ/contact, privacy/terms, 404, offline, and maintenance states | Collection archive, seasonal collection story rails, dispatch/trust blocks, reading-column policy pages, and low-decoration utility surfaces |
| Admin operations | Login, dashboard, products, product create/edit, variants, media, categories, inventory, orders, order detail, payments, promotions, customers, customer detail, content, audit log, and operations health | Soft-carbon sidebar/topbar, red queue markers, compact data tables, product media board, and responsive priority cards |

### Shared API seam

Both directions must call the same typed interface from `packages/api-client`. Page modules may choose different visual adapters, but they must not call direction-specific endpoints or send direction-specific payloads.

| Shared module | Interface responsibilities | Typical consumers |
| --- | --- | --- |
| Catalog | List/search products, categories, facets, sort, pagination, product detail, media, availability, and related products | Home, category, catalog, search, PDP, wishlist |
| Cart | Read cart, add/update/remove lines, merge guest cart, apply coupon, reconcile price/stock conflicts | Product cards, PDP, cart drawer/page, checkout |
| Checkout | Validate address, quote shipping, select method, create/reuse payment intent, recover payment, create order, and read confirmation | Checkout, confirmation, tracking, support |
| Identity and access | Start/verify customer OTP, read/revoke sessions, authenticate admin, check role/permission, and record sensitive access events | Auth, account, admin shell, customer detail |
| Account | Read/update profile and preferences, manage addresses, list orders, read order snapshots/timeline, create support entry, and manage notifications | Account, orders, tracking, support |
| Content | Read published campaign, guide, article, lookbook, policy, FAQ, and SEO content; preview/publish content in admin | Editorial routes, footer links, admin content |
| Operations | Manage products, variants, media, categories, inventory, orders, payments, promotions, customers, audit events, and service health | Every admin route |

Keep the interface deep: route modules depend on customer-visible transitions and typed result/error states, while HTTP paths, cache keys, retry rules, optimistic updates, and provider details remain inside the API client and flow adapters. TanStack Query owns server state; Zustand owns cart draft, drawer/session preferences, and intentionally local UI state.

### Shared data and state invariants

- Money is an integer toman value in the API and is rendered in Persian UI as `۲٬۶۹۸٬۰۰۰ تومان`; SKU, phone, coupon, payment, tracking, and order IDs remain isolated LTR strings.
- Product, variant, media, order, and customer identifiers are stable across directions. Design 3 may change labels and composition, not identifier semantics or response shape.
- Every core flow supports loading, populated, empty, validation error, request error, offline/slow network, disabled, success, stock conflict, price conflict, and payment conflict where applicable.
- Permission and privacy rules are enforced by the identity/access and use-case interfaces. The visual direction may show locked or denied states but cannot decide authorization in the browser.
- Shared events keep the same meaning: add-to-cart is blocked until required variants are selected, payment recovery reuses the same order intent, destructive actions are recoverable, and admin mutations create audit events.

### Direction-specific boundary

Design 3 owns the `NOVA COLLECTION INDEX` tokens, archive layout, near-black/stone/muted-red visual language, rounded paper surfaces, source-grounded Persian fixture copy, product-card metadata, and responsive arrangements documented below. Designs 1 and 2 keep their own palettes and compositions. Shared behavior, state names, data contracts, accessibility requirements, and API interfaces belong to the common contract and must not be duplicated per direction.

### Parity acceptance checklist

- [ ] Design 3 covers every capability group above, including authentication, wishlist/recovery, utility policy content, and the complete admin surface.
- [ ] Designs 1, 2, and 3 use the same API-client interfaces, identifiers, money unit, state names, error envelope, and permission semantics.
- [ ] A feature can be added once at the shared API/client seam and consumed by all three visual adapters without changing its request or response contract.
- [ ] A visual difference is expressed through tokens, layout, copy, imagery, and composition only; it is not a second cart, checkout, auth, account, or admin behavior module.

## 1.2 Direction uniqueness lock

NOVA Collection Index is approved only when it remains identifiable without brand/logo text.

Required distinguishing signals:

- Warm stone outer canvas and warm paper inner surfaces.
- Near-black primary structure and actions.
- Muted-red dispatch/index markers used sparingly.
- Numbered category/product/collection notation (`01`, `02`, `03`...).
- Thin rules, metadata, folio-like indexing, and comparison-oriented alignment.
- Structured `4:5` media grids and archive-style filter rails.
- Equal women/men/children treatment; no menswear or external-retailer dependence.
- No mint/forest-green storefront identity.
- No ivory/oxblood fashion-magazine identity.
- Rounded geometry remains disciplined (`12–16 px` cards, `24 px` large panels) rather than soft-boutique or pill-heavy.

## 2. Audience and catalog

Primary NOVA navigation:

```text
مردانه / پیراهن مردانه / شلوار مردانه / تیشرت و پلوشرت مردانه / کفش و کتونی مردانه / اکسسوری مردانه / ست مردانه
```

The audience switcher always exposes `زنانه / مردانه / بچگانه` as equal first-class destinations.

The initial design fixtures must include balanced examples from all three audiences. Recommended top-level seed groups are:

- `01 / زنانه`
- `02 / مردانه`
- `03 / بچگانه`
- `04 / اکسسوری`
- `05 / کفش`
- `06 / تازه‌ها`
- `07 / تخفیف`

Counts are API data and must refresh with the catalog. No audience may be visually treated as a secondary fallback merely because a reference source originally emphasized another category.

Collection labels use NOVA-owned seasonal and editorial names such as `کالکشن شهریور`, `ویرایش روزمره`, `لایه‌های پاییز`, or campaign-specific approved copy. Example product names and prices are project fixtures; displayed values remain localized to toman and Persian numerals in the UI.

## Visual design analysis and implementation handoff

### Layout Structure

**Observed:** the references use a spacious commerce shell, rounded media, a persistent filter rail on desktop, and a split gallery/detail product page. The live source uses a wide RTL header, category navigation, collection stories, a packaging-led hero, category links, product rails, and a service/contact footer.

**Recommended:** use a `1200 px` centered paper board on a `#EAE8E2` canvas, with a 12-column desktop grid (`78 px` columns, `24 px` gutters) and `16 px` mobile gutters. The home hero is a 7/5 split: a licensed dispatch/product image in a rounded media panel and a warm near-black copy panel with matching rounded corners. PLP keeps a `240–282 px` index rail plus a three-column product grid; PDP remains gallery + purchase info; cart/checkout/account/admin reuse the shared page geometry.

At `1024 px`, the admin rail collapses to icons; at `768 px`, PLP filters become a sheet and PDP stacks; at `390/360 px`, content becomes one column except two-up product cards, with a sticky purchase/checkout action.

### Section Order

Home order: announcement strip → RTL header and category nav → collection story circles → dispatch hero → category index → new drops → footwear/accessory rail → trust and daily-dispatch block → footer/contact. On mobile, stories become a horizontal rail and the hero copy precedes the image when that produces the clearest first action.

PLP order: breadcrumb → collection heading/count → applied filters and sort → index/filter rail or sheet → product grid → pagination/incremental loading. PDP order: gallery → title/category/price → size and color selection → stock/delivery → primary CTA → key features → model/material/care → returns → reviews → related products.

### Navigation

Use a `30 px` near-black announcement strip, a `76 px` white header, and a `44 px` category row on desktop. Keep the header cluster inside a soft `16 px` rounded paper shell when the board allows it. In RTL, brand/logo stays on the right; search, account, cart, and order tracking stay on the left in the same visual order as the live source. The active category gets a near-black underline plus text state, never color alone. The header becomes sticky after the announcement scrolls away.

On mobile use a `52 px` header, a `48 px` search trigger, a full-height right-anchored navigation drawer, and a `64 px` bottom navigation for home, catalog, search, wishlist, and cart. Drawers/sheets trap focus, close with Escape/backdrop/explicit close, and return focus to the trigger. Every icon-only control is labeled and at least `44 × 44 px`.

### Typography

Use `Vazirmatn` for Persian UI and `Inter` for Latin brand/product identifiers, with `font-display: swap` and local fallbacks. Proposed hierarchy: hero `56/64 px` desktop and `34/44 px` mobile, H1 `36/48` → `28/40`, H2 `28/40` → `22/32`, body `16/28`, metadata `13/20`, price `22/32` at `700`. Product titles are two lines max; long Persian labels wrap before they clip. Isolate Latin names, phone numbers, SKUs, and numeric references with LTR spans while preserving RTL page alignment.

### Color System

Use `canvas #EAE8E2`, `paper #FFFDF9`, `paper-subtle #F7F5F0`, `ink #1C1B1A`, `ink-muted #6E6A63`, `line #DFDAD0`, `signal-red #C95747`, `signal-red-soft #F8E8E3`, `cobalt #3E61C4`, `success #39705A`, `warning #8A6433`, and `error #B94B40`. Warm near-black is the primary action and header color; muted red marks sales, dispatch, attention, and selected archive markers; cobalt is reserved for information links/focus support. Maintain WCAG AA contrast for body text and controls, and use a visible two-ring focus treatment.

### Spacing and Layout Rhythm

Use a `4/8/12/16/24/32/48/64/80/96/120 px` scale. Keep `24 px` desktop section gaps, `16 px` mobile section gaps, `12 px` product-grid gaps on mobile, and `12–16 px` internal card gaps. Large surfaces use `24–32 px` radius; product media and cards use `16 px`; controls use `12 px`; pills use `999 px`; tables keep soft one-pixel dividers inside rounded containers, while only dense data separators may remain square. Prefer one-pixel rules and gentle elevation over hard visual separation.

### Image Treatment

Use licensed editorial/product imagery representing rotating women, men, or children collections for the index hero, `1:1` circular collection portraits, `4:5` product masters, and `4:5` category tiles. Product media uses neutral studio or source-approved backgrounds, `object-fit: cover`, declared focal points, and `16–24 px` rounded corners; hero and campaign media may use `28 px` corners when the surrounding shell supports it. Do not draw product silhouettes with CSS or replace missing images with screenshots. Provide desktop/mobile crops, lazy loading below the first viewport, explicit Persian alt text, and a stable neutral skeleton that preserves aspect ratio.

### Cards and Content Blocks

Product cards use `4:5` media, an index label (`01`, `02`, …), category metadata, two-line title, localized price, compare-at price when present, sale/stock text, wishlist, and optional swatches. Default cards use warm paper, a one-pixel line, and a `16 px` radius; hover adds a small lift and soft shadow, never a dramatic zoom. Collection cards are image-led with rounded `999 px` near-black or muted-red label pills. Featured dispatch blocks use a near-black surface, a rounded muted-red marker, a `24 px` radius, and one clear action. Loading, empty, unavailable, selected, and error variants preserve the same height and grid rhythm.

### Buttons and CTAs

Primary actions are warm near-black filled buttons (`44 px` ordinary, `52 px` purchase/checkout) with white text and a `14 px` radius; hover lightens to `#34312E`, pressed uses `#0F0E0D`, and focus uses the two-ring treatment. Secondary actions are white/stone outline buttons with the same rounded geometry; tertiary actions are underlined text links. Muted red is not used for every CTA—it is reserved for sale/dispatch emphasis and destructive confirmation. Icon-only actions remain rounded `12 px` targets at a physical `44 × 44 px` with accessible names; loading preserves the label and disables repeat submission.

### Overall Design Feel

The result should feel like a premium collection archive crossed with a reliable dispatch board, softened by warm paper, near-black type, rounded panels, and gentle shadows. Thin rules and numbered metadata keep comparison precise; muted red markers create urgency without turning the whole storefront into a sale page. Rounded media, pill labels, and the split PDP retain the familiar reference pattern, while story circles, softened navigation bands, and source-grounded collection language make the direction recognizably NOVA Collection Index rather than a copy of Designs 1 or 2.

### Component inventory and boundaries

Shared primitives and commerce modules remain the same as Designs 1 and 2. Design 3 adds only visual adapters: `IndexHeader`, `CollectionStoryRail`, `IndexHero`, `IndexLabel`, `ArchiveFilterRail`, `DispatchTrustBlock`, and `OrderManifestSummary`. These adapters consume the shared `Catalog`, `Cart`, `Checkout`, `Identity and access`, `Account`, `Content`, and `Operations` interfaces; they do not own fetching, authorization, pricing, stock reconciliation, or payment transitions.

### Responsive behavior matrix

| Breakpoint | Storefront | Admin | Fixed actions |
| --- | --- | --- | --- |
| `1440+` | 1200 px board, 7/5 home hero, 240–282 px filter rail, three-card filtered grid | 240 px sidebar, 1136 px content | none except drawers/modals |
| `1024` | 12-column shell, tighter hero, compact filter rail | 72 px icon rail | in-flow checkout CTA |
| `768` | stacked PDP, filter/sort sheet, priority product grid | labeled priority cards | sticky purchase/checkout CTA where required |
| `390/360` | 16 px gutters, two product columns, one-column forms, horizontal story rail | topbar + card queues, contained variant matrix scroll | `52/72 px` action reserve; no clipping |

### Design-token proposal

The direction-specific tokens are `canvas`, `paper`, `paper-subtle`, `ink`, `ink-muted`, `line`, `signal-red`, `signal-red-soft`, `cobalt`, `success`, `warning`, and `error`; type is `Vazirmatn`/`Inter`; spacing is the scale above; radii are `8/12/16/24/32/999`; elevation is border-first with gentle `0 8 24 rgba(28,27,26,.06)` surfaces and a restrained `0 8 24 rgba(28,27,26,.08)` menu shadow; motion is `120/160/240 ms` with shimmer disabled under reduced motion.

### Interaction and state model

All shared default, hover, focus-visible, active, disabled, loading, empty, validation, request-error, offline, slow-network, success, stock-conflict, price-conflict, and payment-conflict states remain present. Filter/sort changes update query parameters and reset pagination; variant selection updates price/stock before add-to-cart; cart and payment conflicts use recoverable sheets; every admin mutation shows save/publish status and creates an audit event.

### Accessibility and content rules

Use semantic landmarks, one H1 per route, logical CSS properties, `fa-IR`/RTL at document level, keyboard-operable menus/sheets/accordions, focus trap and return, visible errors with summary links, `44 × 44 px` targets, `16 px` mobile inputs, WCAG AA contrast, reduced-motion support, explicit Persian alt text, and non-color status labels. Preserve LTR spans for Eleven/brand names, English model names, phone numbers, SKUs, payment IDs, and tracking codes. Keep public source copy editable and never encode source-site claims as permanent product truth.

### Acceptance checklist

- [ ] The home reads as NOVA Collection Index at a glance: warm paper, near-black structure, muted-red index markers, numbered collection stories, structured hero, category index, and balanced women/men/children fixtures.
- [ ] PLP, PDP, cart/checkout, account/support, and admin use the shared Design 1/2 feature and API contract.
- [ ] The design is visibly distinct from Atelier and Nova: no inherited forest/mint palette, hero treatment, or editorial card composition; its softness comes from stone paper, rounded geometry, and archive indexing.
- [ ] `1440`, `1024`, `768`, `390`, and `360 px` frames preserve hierarchy, readable prices, RTL behavior, and no horizontal clipping.
- [ ] Reference screenshots and external storefronts are research inputs only; NOVA-approved multi-audience imagery, taxonomy, and content fixtures are used in implementation.

## 3. Figma organization

Create the top-level page `03 — QUIET GRID` in the shared Figma file.

Required sections:

```text
00 Cover and direction index
01 Foundations
02 Primitive components
03 Commerce components
04 Storefront desktop
05 Storefront mobile
06 Cart and checkout
07 Account and support
08 Editorial and utility
09 Admin desktop
10 Admin responsive
11 States and edge cases
12 Prototype flows
```

Use prefix `QG` for frames, such as `QG/PDP/Mobile/Size-Selected` and `QG/Admin/Orders/Desktop/Default`.

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide desktop | 1728 px | 1440 px | 12 | 144 px | 24 px |
| Primary desktop | 1440 px | 1200 px | 12 × 78 px | 120 px | 24 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 24 px |
| Tablet | 768 px | 704 px | 8 × 74 px | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Rules:

- Storefront content stops growing at `1200 px`.
- Desktop product grids use four cards; filtered listings use a `282 px` sidebar plus three `282 px` cards.
- Tablet uses three cards where content width permits.
- Mobile uses two cards, except cart, checkout, account forms, and order details.
- Section spacing and one-pixel rules create hierarchy before cards or shadows.

## 5. Color system

| Token | Hex | Use |
| --- | --- | --- |
| `paper/0` | `#FFFDF9` | Warm primary surface |
| `canvas/50` | `#EAE8E2` | Soft stone outer page canvas |
| `paper/50` | `#F7F5F0` | Secondary surface |
| `paper/200` | `#EEEAE2` | Selected or muted surface |
| `ink/950` | `#1C1B1A` | Warm near-black primary text and action |
| `ink/800` | `#34312E` | Hover action and strong secondary |
| `ink/600` | `#6E6A63` | Supporting text |
| `ink/450` | `#928D84` | Metadata and placeholder |
| `ink/300` | `#C8C2B8` | Disabled |
| `line/200` | `#DFDAD0` | Soft border |
| `line/100` | `#EEEAE3` | Soft divider |
| `signal/700` | `#C95747` | Muted sale, dispatch, and attention |
| `signal/100` | `#F8E8E3` | Soft sale or dispatch surface |
| `cobalt/700` | `#3E61C4` | Informational link and focus support |
| `cobalt/100` | `#EAF0FF` | Informational surface |
| `success/700` | `#39705A` | Success |
| `success/100` | `#E8F1EB` | Success surface |
| `warning/700` | `#8A6433` | Warning |
| `warning/100` | `#FFF3DD` | Warning surface |
| `error/700` | `#B94B40` | Error |
| `error/100` | `#FBE9E6` | Error surface |

Semantic aliases:

```text
color/bg/page              canvas/50
color/bg/surface           paper/0
color/bg/subtle            paper/50
color/bg/selected          signal/100
color/text/primary         ink/950
color/text/secondary       ink/600
color/text/muted           ink/450
color/text/inverse         paper/0
color/border/default       line/200
color/border/subtle        line/100
color/action/primary       ink/950
color/action/primary-hover ink/800
color/action/primary-down  #0F0E0D
color/action/focus         cobalt/700
color/promotion/strong     signal/700
color/promotion/soft       signal/100
```

Warm near-black ink is the global action color. Muted signal red is limited to sale, dispatch, attention, and destructive emphasis; cobalt is reserved for information and focus support. Interface status always combines color, text, and icon.

## 6. Typography

- Persian interface family: `Vazirmatn`.
- Latin and technical fallback: `Inter`.
- Use only `400`, `500`, `600`, and `700`.

| Style | Desktop | Mobile | Weight |
| --- | --- | --- | ---: |
| `display/xl` | 56/64 px | 34/44 px | 700 |
| `display/lg` | 44/56 px | 30/40 px | 700 |
| `heading/h1` | 36/52 px | 28/40 px | 700 |
| `heading/h2` | 28/40 px | 22/32 px | 700 |
| `heading/h3` | 22/32 px | 20/28 px | 600 |
| `heading/h4` | 18/28 px | 17/26 px | 600 |
| `body/lg` | 18/32 px | 17/30 px | 400 |
| `body/md` | 16/28 px | 16/28 px | 400 |
| `body/sm` | 14/24 px | 14/24 px | 400 |
| `label/md` | 14/24 px | 14/24 px | 600 |
| `caption` | 12/20 px | 12/20 px | 400 |
| `price/lg` | 22/32 px | 20/30 px | 700 |

Product-card titles use two lines maximum. Identifiers use Inter tabular numerals and isolated LTR direction.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120 px`.

Radius:

- `0 px`: only one-pixel data separators, never the outer edge of a customer surface.
- `8 px`: compact status badges and dense admin controls.
- `12 px`: buttons, inputs, and icon controls.
- `16 px`: product media, product cards, and category tiles.
- `24 px`: panels and drawers.
- `32 px`: campaign and hero boards.
- `999 px`: chips, dispatch markers, and avatars.

Effects:

- Standard product cards use a barely visible lift: `0 2 12 rgba(28,27,26,0.04)`.
- Hover card: `0 10 24 rgba(28,27,26,0.08)`.
- Dropdown: `0 8 24 rgba(28,27,26,0.08)`.
- Drawer: `0 16 48 rgba(28,27,26,0.12)`.
- Sticky: `0 -4 20 rgba(28,27,26,0.06)`.
- Focus: white `2 px` separation plus `2 px #3E61C4`.

Motion: `120 ms` hover, `160 ms` controls, `240 ms` drawers, `1200 ms` skeleton shimmer. Reduced-motion mode removes translation and scale.

Layer variables:

```text
z/base 0
z/content 10
z/sticky 100
z/header 200
z/dropdown 300
z/drawer 400
z/modal 500
z/toast 600
z/critical 700
```

## 8. Shell and navigation

Desktop:

- Announcement bar: `30 px`, warm near-black with a short dispatch promise and softened shell corners where it is inset.
- Header: `76 px`, white, RTL brand on the right and utility controls on the left.
- Category navigation: `44 px`.
- Sticky header: `64 px`.
- Search overlay: `640–720 px`.
- Footer: four columns within `1200 px`, including contact, order tracking, policies, and social links.

Mobile:

- Announcement: hidden after first scroll; header becomes `52 px`.
- Header: `52 px`.
- Search row: `48 px`.
- Bottom navigation: `64 px` plus safe area.
- Full-height right-anchored RTL navigation drawer.

Women, men, and children remain direct destinations at desktop and mobile widths.

## 9. Component inventory

Primitive components: `Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Commerce components: `Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Dispatch Hero`, `Collection Story Rail`, `Index Label`, `Product Card`, `Compact Product Card`, `Category Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Dispatch Trust Block`, `Product Rail`, `Archive Filter Rail`, `Editorial Rail`, and `Recently Viewed`.

Admin components: `Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

Every component uses Auto Layout and variables. Standard input height is `48 px`, compact admin input `40 px`, button `44 px`, purchase CTA `52 px`, and minimum target `44 × 44 px`.

### 9.1 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `ink/950` | `ink/950` | `paper/0` | No shadow |
| Hover primary | `ink/800` | `ink/800` | `paper/0` | `120 ms` transition |
| Pressed primary | `#0F0E0D` | `#0F0E0D` | `paper/0` | No scale animation |
| Focus | Existing fill | White separation plus `cobalt/700` | Existing text | Two-ring focus outside bounds |
| Disabled | `paper/100` | `line/100` | `ink/450` | No pointer action; explicit unavailable state |
| Loading | Originating state | Originating state | Spinner plus preserved label | Prevent repeat action |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.2 Construction-level component contracts

| Component | Anatomy and measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; padding `12/16/24 px`; icon `16/20 px`; gap `8 px`; radius `14 px` | Primary, Secondary, Outline, Ghost, Destructive; sizes; icon slots; interaction states | Purchase CTA fills mobile width; ordinary buttons hug content |
| Icon Button | `36/44/52 px` rounded target; icon `18/20/24 px`; radius `12 px` | Ghost, Surface, Outline; tooltip/accessibility label | Minimum `44 px` on customer mobile |
| Text/Phone Field | Height `48 px`; padding `14 px`; label gap `8 px`; icon `20 px`; helper gap `6 px` | Empty, filled, focus, disabled, error, success; prefix/suffix | Full mobile width; phone value LTR-isolated |
| Search Field | Height `48 px`; icon `20 px`; clear target `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | `640–720 px` overlay desktop; full-screen mobile |
| Select | Trigger `48 px`; item `44 px`; menu padding `8 px`; chevron `20 px` | Placeholder, selected, open, disabled, error; single/multiple | Filter selections use a bottom sheet on mobile |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed, focus, disabled, error | Clickable row minimum `44 px` |
| Tabs/Chip/Badge | Tab `44 px`; chip `36 px`; badge `24 px`; padding `12/10/8 px` | Active, inactive, focus, disabled; removable/status variants | Tabs scroll on mobile with continuation cue |
| Dialog | Width `480/640 px`; padding `24/32 px`; radius `16 px`; footer gap `12 px` | Info, form, confirmation, destructive; loading/error | Mobile `calc(100% - 32px)` or bottom sheet |
| Drawer/Bottom Sheet | Drawer `420 px`; sheet max `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide | Full width below `480 px`; bottom safe area |
| Toast/Inline Message | Toast `360 px`; padding `16 px`; icon `20 px`; inline padding `12 px` | Success, warning, error, info; optional actions | Mobile width `calc(100% - 32px)` |
| Breadcrumb/Pagination/Stepper | Breadcrumb `32 px`; pagination target `44 px`; step node `28 px` | Full/collapsed; first/middle/last; current/complete/error | Collapse deep paths; compact checkout labels |
| Product Card | Desktop `282 px`; mobile `173 px`; image `4:5`; content gap `12 px`; index label `28 px`; swatch `24 px`; radius `16 px` | Regular, sale, new, low/out stock, loading; swatches/second image; archive number | Four desktop, three filtered, two mobile; title two lines |
| Media Gallery | Main image `4:5`; thumbnail `72 × 90 px`; gap `10 px`; zoom target `44 px` | Image, video-ready, zoom, loading, failed | Thumbnail rail desktop; swipe gallery mobile |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wraps without page overflow; guide sheet on mobile |
| Cart Item | Image `112 × 140 px` desktop, `88 × 110 px` mobile; quantity `112 × 40 px`; padding `16 px` | Default, updating, removed, stock conflict, price change, error | Actions stack below metadata on mobile |
| Order Summary | Width `384 px`; padding `24 px`; row gap `12 px`; CTA `52 px` | Default, recalculating, coupon success/error, quote expired | Full width mobile; sticky CTA where specified |
| Address/Shipping/Payment | Minimum `88 px`; padding `16 px`; radio `20 px`; text gap `4 px` | Default, hover, selected, disabled, unavailable, error | Full-width stack; explicit radio and label selection |
| Data Table | Header `48 px`; rows `48/56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Converts to labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; two-column fields; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color | One-column below `768 px`; contained matrix scroll |

### 9.3 Realistic Persian UI content set

```text
Brand: الون استایل / ELEVEN
Navigation: مردانه، پیراهن مردانه، شلوار مردانه، تیشرت و پلوشرت مردانه، کفش و کتونی مردانه، اکسسوری مردانه، ست مردانه
Audience switcher: زنانه، مردانه، بچگانه
Collections: کالکشن جردن، کالکشن تنگ‌تاپ
Dispatch hero: نگران ارسال بسته‌هاتون نباشید / بسته‌ها به صورت روزانه در حال ارسال هستند
Category counts: پیراهن مردانه — ۱۵ محصول؛ شلوار مردانه — ۳۰؛ تیشرت و پلوشرت مردانه — ۱۸؛ کفش و کتونی مردانه — ۲۷؛ اکسسوری مردانه — ۲۰
Product 01: بگ بزیاق ترک مردانه الون — ۲٬۶۹۸٬۰۰۰ تومان
Product 02: پیراهن کتان مستر الون — ۱٬۷۵۸٬۰۰۰ تومان
Product 03: Vans veja الون — ۲٬۴۹۸٬۰۰۰ تومان
Product 04: لانگ اسلیو الون — ۲٬۹۹۸٬۰۰۰ تومان
Product 05: پیراهن ساده کلاسیک مردانه الون — ۱٬۳۹۸٬۰۰۰ تومان
Product 06: مام بزیاق ترک مردانه الون — ۲٬۱۹۸٬۰۰۰ تومان
Product 07: پیراهن مودال الون — ۱٬۵۹۸٬۰۰۰ تومان
Product 08: تیشرت بیسیک الون — ۱٬۱۸۰٬۰۰۰ تومان
Product 09: کفش لوفر مردانه الون — ۲٬۱۸۰٬۰۰۰ تومان
Product 10: کتونی Jordan 1 Retro الون — ۲٬۹۹۸٬۰۰۰ تومان
Actions: افزودن به سبد خرید، انتخاب اندازه، مشاهده راهنمای اندازه، مشاهده همه، پیگیری سفارش
Search: جست‌وجوی محصول یا دسته… / نتیجه‌ای پیدا نشد؛ فیلترها را حذف کنید.
Stock: موجود / موجودی محدود / این اندازه ناموجود است
Delivery: ارسال روزانه / تحویل در تهران بین ۲ تا ۴ روز کاری
Returns: مرجوعی تا ۷ روز طبق شرایط کالا
Checkout: نشانی تحویل، روش ارسال، پرداخت، بررسی و ثبت سفارش
Errors: لطفاً اندازه را انتخاب کنید. / پرداخت ناموفق بود. / موجودی سبد خرید تغییر کرده است.
Order: سفارش ثبت شد، پرداخت شد، در حال آماده‌سازی، ارسال شد، تحویل داده شد
Footer contact: قم — بلوار الغدیر — روبروی شهرک قدس — جنب سینمای ونوس / ۰۹۹۱۴۵۳۴۱۷۸
Admin: محصولات، دسته‌بندی‌ها، موجودی، سفارش‌ها، پرداخت‌ها، تخفیف‌ها، مشتریان، محتوا، عملیات ارسال
```

## 10. Storefront pages

| Page | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Home | `1200 px` board; softened near-black header bands inside a rounded shell; `7/5` dispatch hero; collection story rail; category index; four-card new drops; footwear/accessory rail; dispatch trust; footer/contact | `358 px` board; horizontal story rail; stacked hero copy/image; two-up rounded product cards; `64 px` section rhythm | Campaign/no campaign, slow image, request error, offline, daily-dispatch promise |
| Category landing | Source category intro and count, subcategories, collection rail, four-card products, size/fit guide, delivery/returns trust, concise and expanded SEO copy | Portrait category image, two-column subcategories, products, expandable copy | Women, men, children, empty campaign, unavailable category |
| Product listing | Breadcrumb; `NOVA COLLECTION INDEX` heading/count; `282 px` archive/filter rail; `894 px` three-card grid; numbered cards; sort; applied chips; pagination | Two-column grid; `52 px` sticky filter/sort; `90%` bottom sheet; index labels retained | Default, filtered, sale, no results, loading, error, offline |
| Search | `640–720 px` warm near-black/paper overlay with recent, popular, category, and product results; full page | Full-screen overlay with sticky `48 px` field and rounded category chips | Closed, focused, typing, typo, no result, loading, error |
| Product detail | `588 + 24 + 588 px`; rounded `4:5` gallery; thumbnail rail `72 px`; rounded near-black purchase panel; price, swatches, size, fit, stock, delivery, CTA, returns | `390 px` gallery; `16 px` padding; size sheet; `72 px` sticky purchase bar; muted-red selected marker | Variant empty/selected, size error, low/out stock, sale, zoom, added, price change |
| Cart drawer | `420 px` dispatch manifest; scrollable items; fixed subtotal and rounded near-black CTA; muted-red stock/price markers | Full-width rounded sheet with same manifest order | Empty, quantity update, remove, stock conflict, price change, loading, error |
| Cart page | `792 px` items plus `384 px` summary, `24 px` gap | One column; summary below items; sticky CTA | Empty, coupon states, unavailable item |
| Authentication | Centered `440 px` paper panel with ELEVEN mark and short dispatch reassurance | Full-height one-column form | Guest, login, invalid, expired, rate limit, network error |
| Checkout address | `792 px` forms/cards plus `384 px` sticky summary | One column and sticky CTA | Saved/new, validation, unsupported region, save error |
| Checkout shipping | Selectable carrier/ETA/price cards | Stacked cards | Quote loading, selected, unavailable, expired |
| Checkout payment | Gateway cards and final total | Stacked methods and sticky CTA | Processing, redirect, success, failed, cancelled, timeout, pending |
| Confirmation | Dispatch receipt with paid status, order reference, ETA, next actions, and customer support | Stacked receipt with prominent tracking CTA | Paid, pending, guest invitation |
| Tracking | Horizontal-to-vertical dispatch timeline with carrier/ETA and exception action | Vertical timeline with sticky support action | Preparing, shipped, delayed, delivered, cancelled, exception |

Images use `4:5` product ratio. Product masters are at least `1600 × 2000 px`; desktop hero `2400 × 1200 px`; mobile hero `1080 × 1350 px`; category image `1200 × 1600 px`.

## 11. Account, support, and content

Desktop account uses `282 px` navigation, `894 px` content, and `24 px` gap. Required pages:

- Dashboard.
- Profile and consent preferences.
- Addresses: list, create, edit, delete.
- Orders and order detail.
- Support and FAQ entry.
- Security/session page.
- Notification preferences.
- Campaign landing.
- Buying guide, article, and lookbook.
- About, trust, shipping, returns, size guide, care guide, FAQ, contact, privacy, and terms.
- `404`, offline, and maintenance.

P1 uses the same system for wishlist, alerts, returns, store credit, referrals, reviews, product comparison, and questions.

## 12. Admin pages

Admin uses a soft-carbon `240 px` sidebar, white `64 px` topbar, `32 px` content padding, `48 px` dense rows, and `56 px` comfortable rows. Rounded panels and gentle elevation separate work areas; signal red marks low stock, payment attention, failed dispatch, and unsaved/publish-blocked states but does not replace status text.

Required pages:

- Login and MFA-ready verification.
- Dashboard.
- Products list and product create/edit, with NOVA launch categories as the initial taxonomy seed.
- Size × color variant matrix.
- Media and color association.
- Women/men/children category management.
- Inventory and stock movements.
- Orders and order detail.
- Payment attempts, callbacks, and mismatch inspection.
- Promotions and coupons.
- Customer lookup and restricted detail.
- Home/campaign/SEO content management.
- Audit log.
- Notification retries and operational status.

The clothing editor includes audience, type, season, material, care, fit, size system, colors, model measurements, media, stock, shipping values, Persian SEO metadata, collection label, source asset/license, draft, preview, publish, and archive. The home editor supports the dispatch hero, collection story rail, category counts, product rails, contact block, and campaign fallback without changing the public API.

At `1024 px`, collapse the sidebar. At `768/390 px`, queues and details become cards; catalog editing remains usable with a desktop-recommended note.

## 13. RTL, accessibility, and states

- Set `fa-IR` and RTL at document level.
- Use logical properties and validate physical drawer placement.
- Isolate Latin and numeric references.
- Validate breadcrumbs, carousels, sliders, pagination, timelines, and steppers in RTL.
- Maintain minimum `44 × 44 px` targets and `16 px` mobile form text.
- Expose swatch names and size availability accessibly.
- Never use color alone for sale, stock, validation, payment, or order state.
- Provide visible focus, error summary, field errors, focus trap, Escape behavior, and focus return annotations.
- Include loading, empty, error, slow-network, offline, disabled, success, stock-conflict, payment-conflict, and retry states.

## 14. Prototype flows

Customer:

1. Home → women → filtered PLP → PDP.
2. Home → men → PDP → size guide → cart.
3. Home → children → age/size filter → PDP.
4. Cart → guest checkout → address → shipping → payment → confirmation.
5. Payment failure → retry → pending → success.
6. Search typo → correction → product.
7. Confirmation → tracking → exception → support.
8. Account → orders → detail.

Admin:

1. Create garment → media → variants → publish.
2. Low stock → adjustment → audit.
3. New order → paid → preparing → shipped.
4. Payment mismatch → verification.
5. Edit home campaign → preview → publish.

## 15. Completion criteria

- Every customer and admin page exists at `1440 px` and `390 px`.
- PLP, PDP, cart, checkout, account order detail, admin product edit, and admin order detail exist at `768 px`.
- `360 px` QA has no clipping or horizontal scrolling.
- Women, men, and children are present throughout customer and admin examples.
- All visible money is in toman.
- Components use Auto Layout, variables, styles, and documented properties.
- Core customer and admin prototypes work.
- RTL, keyboard, focus, contrast, reduced-motion, and state coverage pass.
- Screenshot comparison finds no crop, spacing, hierarchy, or responsive drift.

## 16. Construction appendix

This appendix instantiates the shared deterministic Figma contract in the root [architecture document](../../arch.md). Every frame uses the `QG` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

### 16.1 Frame matrix and coordinate anchors

| Frame family | Desktop | Tablet | Mobile | Narrow QA |
| --- | --- | --- | --- | --- |
| Storefront shell | `1440 × 900`, content `x=120,w=1200`, 12 columns, 24 px gutter | `768 × 1024`, content `x=32,w=704`, 8 columns, 16 px gutter | `390 × 844`, content `x=16,w=358`, 4 columns, 12 px gutter | `360 × 800`, content `x=16,w=328` |
| Account shell | `1440 × 900`, nav `x=120,w=282`, gap `24`, content `w=894` | `768 × 1024`, nav becomes a summary row, content `w=704` | `390 × 844`, stacked destination list and one-column content | `360 × 800`, same stack with 16 px side padding |
| Admin shell | `1440 × 900`, sidebar `240`, topbar `64`, content padding `32` | `768 × 1024`, sidebar hidden, priority cards | `390 × 844`, card queues and sticky save/action bar | `360 × 800`, no table overflow |

Use these top-level coordinates in every primary frame:

| Screen | Desktop coordinate anchors | Mobile coordinate anchors |
| --- | --- | --- |
| Shell | Announcement `y=0,h=32`; header `y=32,h=72`; category nav `y=104,h=44`; content starts `y=148` | Announcement `h=28`; header `h=56`; content starts `y=84`; bottom nav fixed `h=64` plus safe area |
| `HOME` | Hero `x=120,y=148,w=1200,h=600`; category cards `w=282,h=376`; product rail cards `w=282`; editorial split `588+24+588` | Hero `x=16,y=84,w=358,h=448`; category cards `173×230`; product cards `173`; section gap `64` |
| `PLP_*` | Filter rail `x=120,w=282`; gap `24`; product grid `x=426,w=894`, three columns of `282` with 24 px gutters | Sticky filter/sort bar `x=16,y=84,w=358,h=52`; two cards `173` with 12 px gap; filter sheet max `90vh` |
| `PDP` | Gallery `x=120,w=588`; gap `24`; info `x=732,w=588`; thumbnail rail `72`; sticky information begins at `y=148` | Gallery `x=16,y=84,w=358,aspect=4:5`; info padding `16`; purchase bar fixed `h=72` |
| `CART`/checkout | Items `x=120,w=792`; gap `24`; summary `x=936,w=384` | One-column content `x=16,w=358`; summary below items; sticky CTA above bottom navigation |
| Account | Nav `x=120,w=282`; gap `24`; content `x=426,w=894` | Summary header `x=16,w=358`; destination cards and content stack |
| Admin | Sidebar `x=0,w=240`; topbar `y=0,h=64`; content `x=272,w=1136` | Topbar `h=56`; content padding `16`; tables become labeled cards |

Frame names follow `QG/<Screen>/<Viewport>/<State>`, for example `QG/PLP/Desktop/Filtered`, `QG/PDP/Mobile/Size-Error`, and `QG/Admin/Inventory/Tablet/Discrepancy`. Record the actual node URL beside each name after the Figma frame is created.

### 16.2 Screen-sheet map

Each row below represents an individual frame even where IDs are grouped. Every row inherits the complete baseline from the root [shared page and state matrix](../../arch.md#shared-page-and-state-matrix); the state cell lists direction-specific or visually emphasized states and is additive, never a replacement. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Direction-specific / emphasized states (plus full root baseline) |
| --- | --- | --- | --- |
| `HOME` | 1200 px dispatch hero, collection story rail, four 282 px category cards, four-card new-drop rail, footwear/accessory rail, dispatch trust, footer | 358 px stacked dispatch hero, horizontal story rail, two 173 px category cards, two-column products, 64 px section spacing, horizontal dispatch/trust rail | Campaign, no campaign, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Intro, subcategories, four-card product rail, guide, delivery/returns trust, concise/expanded SEO copy | Portrait header, two-column subcategories/products, expandable copy | Default, campaign off, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 282 px archive/filter rail, numbered three 282 px cards, result count, applied chips, sort, pagination | Two-column numbered grid, sticky filter/sort, 90% height sheet | Default, filtered, sale, no results, loading, error, offline |
| `SEARCH` | 640–720 px overlay, recent/popular/category/product groups, full results page | Full-screen surface with sticky 48 px field and grouped results | Closed, focused, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 588+24+588 composition, 72 px thumbnails, sticky information, rounded near-black purchase panel, muted-red dispatch marker, price/swatch/size/fit/stock/delivery/returns/details/reviews | Swipe gallery, 16 px information padding, size-guide sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 420 px dispatch-manifest drawer; full cart uses 792 px items plus 384 px summary | Full-width manifest sheet; one-column cart with summary below items and sticky CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 440 px centered panel with ELEVEN mark, dispatch reassurance, and guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | `792+384` two-column flow; clear 3-step indicator; restrained surfaces | One-column step panels; sticky next/pay CTA; selectable methods stack | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | Dispatch receipt with paid status, references, ETA, and horizontal labeled dispatch timeline | Stacked receipt and vertical dispatch timeline | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | 282 px account navigation plus 894 px content; 24 px gaps; card sections with explicit dividers | Summary header, stacked destinations, one-column forms and immutable order snapshots | Loading, empty orders/addresses, validation error, save success/error, permission error, offline |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | Searchable FAQ, support entry, sessions, and preference groups in 894 px content | Accordion groups and full-width controls | Empty search, ticket submitted, session revoke success/error, preference save error |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | 1200 px grid with 640–720 px reading measure, editorial split, product references | Single-column reading flow, horizontal product rail, collapsible contents | Published, scheduled, missing media, loading, unavailable, offline |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | Neutral reading surface, 640–720 px measure, concise and expanded blocks | 358 px reading column, stacked accordions | Default, loading, error, offline, contact validation/success |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | Centered 480 px message with return/search/support action and no decorative drift | Full-width 358 px message and one primary action | 404, offline cached shell, maintenance window |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | 240 px sidebar, 64 px topbar, stat cards, action queues, neutral surfaces | Sidebar hidden; cards and priority queue | Invalid, locked, rate-limited, MFA step, loading, permission error |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | Filter bar, 48/56 px rows, audience/category/status filters, bulk actions, pagination | Priority columns become labeled cards; filters become a sheet | Loading, empty, request error, stock discrepancy, bulk-action success/error |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | Sectioned form, 2-column fields, 120 × 44 px matrix cells, media crop/reorder panel | One-column sections; contained matrix scroll; sticky save bar | Draft, invalid, saving, saved, publish blocked, upload/crop failure |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | Queue tabs, immutable snapshots, payment attempt/callback timeline, internal notes | Queue/detail cards with labeled event rows | New/paid/preparing/shipped, payment mismatch, retry, webhook error, permission error |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | Promotion rules, restricted customer lookup/detail, home/campaign/SEO blocks, audit before/after, notification health | Card sections with explicit section navigation and unsaved-change guard; PII stays permission-gated | Draft, scheduled, publish blocked, success, failure, no activity, service degraded, permission error |

### 16.2.1 Exact section-bound stacks

The values below use `x,y,width,height` in pixels in one full-page coordinate system. The `1440 × 900` and `390 × 844` viewports show the portion intersecting their recorded scroll offset; `Scroll-0` starts at `y=0`, and `Scroll-1` and later frames retain these coordinates while recording the new offset. Slash-separated IDs share this geometry but still receive separate Figma frames and node URLs.

| Screen IDs | Desktop section stack (`1440 × 900`) | Mobile section stack (`390 × 844`) |
| --- | --- | --- |
| `HOME` | `DispatchHero(120,148,1200,600)` → `CategoryIndex(120,780,1200,376)` → `NewDrops(120,1204,1200,510)` → `CollectionRail(120,1762,1200,420)` → `FootwearAccessoryRail(120,2230,1200,510)` → `DispatchTrust(120,2788,1200,320)` → `Footer(120,3156,1200,280)` | `DispatchHero(16,84,358,448)` → `CategoryIndex(16,564,358,230)` → `Products(16,826,358,420)` → `CollectionRail(16,1278,358,300)` → `DispatchTrust(16,1610,358,260)` → `Footer(16,1902,358,320)` |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | `Intro(120,148,1200,180)` → `Subcategories(120,352,1200,224)` → `Products(120,600,1200,510)` → `GuideTrust(120,1158,1200,320)` → `SEOCopy(120,1526,1200,360)` | `PortraitHeader(16,84,358,360)` → `Subcategories(16,476,358,220)` → `Products(16,728,358,420)` → `GuideSEO(16,1180,358,360)` |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | `Toolbar(120,148,1200,96)` → `FilterRail(120,268,282,620)` + `ProductGrid(426,268,894,620)`; card rows are `282×510`, row gap `24` | `FilterSortBar(16,84,358,52)` → `ProductGrid(16,160,358,900)`; cards are `173×420`; filter sheet `16,84,358,756` |
| `SEARCH` | `SearchOverlay(360,148,720,600)` → `SearchResults(120,792,1200,620)` | `SearchSurface(0,84,390,760)` with field `16,84,358,48` and results `16,148,358,696` |
| `PDP` | `Gallery(120,148,588,900)` + `PurchaseInfo(732,148,588,760)` → `DetailsReviews(120,1072,1200,420)` → `RelatedProducts(120,1516,1200,510)` | `Gallery(16,84,358,448)` → `PurchaseInfo(16,564,358,650)` → `DetailsReviews(16,1238,358,420)` → `RelatedProducts(16,1682,358,420)`; purchase bar `0,692,390,72`; narrow `0,648,360,72` |
| `CART_DRAWER`, `CART` | Drawer `1020,0,420,900`; cart page `Items(120,148,792,720)` + `Summary(936,148,384,640)` | Sheet `0,84,390,760`; cart page `Items(16,84,358,620)` → `Summary(16,736,358,360)`; sticky CTA `16,712,358,52`; narrow `16,668,328,52` |
| `AUTH`, `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Auth `Panel(500,188,440,560)`; checkout `Form(120,148,792,680)` + `Summary(936,148,384,640)` and stepper `120,108,792,32` | Auth `Form(16,84,358,650)`; checkout `Step(16,84,358,620)` → `Summary(16,728,358,300)`; sticky CTA `16,712,358,52`; narrow `16,668,328,52` |
| `CONFIRMATION`, `TRACKING` | `Receipt(120,148,792,560)` + `NextSteps(936,148,384,320)`; timeline `120,732,1200,220` | `Receipt(16,84,358,420)` → `NextSteps(16,536,358,240)` → `Timeline(16,804,358,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountNav(120,148,282,620)` + `AccountContent(426,148,894,720)`; 24 px section gaps | `AccountSummary(16,84,358,120)` → `DestinationList(16,228,358,360)` → `AccountContent(16,612,358,620)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `AccountNav(120,148,282,620)` + `SupportContent(426,148,894,720)`; first control row `h=96` | `Summary(16,84,358,120)` → `SearchOrControls(16,228,358,104)` → `AccordionContent(16,356,358,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHeader(120,148,1200,420)` → `ReadingMeasure(360,592,720,920)` → `ProductReferences(120,1536,1200,510)` | `StoryHeader(16,84,358,320)` → `ReadingMeasure(16,436,358,980)` → `ProductRail(16,1440,358,420)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(120,148,1200,180)` → `ReadingMeasure(360,364,720,920)` → `RelatedOrContact(120,1316,1200,300)` | `DocumentHeader(16,84,358,160)` → `ReadingMeasure(16,268,358,980)` → `RelatedOrContact(16,1280,358,320)` |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | `Message(480,288,480,300)` with action `520,504,400,52` | `Message(16,208,358,300)` with action `16,536,358,52` |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | `AdminSidebar(0,0,240,900)` + `AdminTopbar(240,0,1200,64)` + `Dashboard(272,96,1136,720)` | `AdminTopbar(0,0,390,56)` + `DashboardCards(16,80,358,720)` |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | `AdminSidebar(0,0,240,900)` + `FilterBar(272,96,1136,56)` + `DataTable(272,176,1136,620)` | `AdminTopbar(0,0,390,56)` + `FilterBar(16,80,358,52)` + `PriorityCards(16,156,358,760)` |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | `AdminSidebar(0,0,240,900)` + `FormHeader(272,96,1136,64)` + `FormSections(272,184,760,640)` + `Preview(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `FormSections(16,80,358,980)` + sticky save bar `16,712,358,52`; narrow `16,668,328,52` |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | `AdminSidebar(0,0,240,900)` + `QueueOrDetail(272,96,760,720)` + `EventsOrSummary(1056,96,352,720)` | `AdminTopbar(0,0,390,56)` + `QueueOrDetail(16,80,358,840)` |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | `AdminSidebar(0,0,240,900)` + `SectionHeader(272,96,1136,64)` + `PrimaryPanel(272,184,760,640)` + `SecondaryPanel(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `SectionNav(16,80,358,52)` + `PrimaryPanel(16,156,358,820)` |

### 16.2.2 Tablet, narrow, and scroll instantiation

Use the root [responsive section-bound templates](../../arch.md#responsive-section-bound-templates) for tablet and narrow section geometry. The direction-specific stack above changes only the named section composition; for all other sections, copy the root coordinates verbatim. Create separate frames at these exact offsets:

| Frame state | Viewport | Base usable height | Fixed-action reserve | Scroll step and offset sequence | Fixed overlays |
| --- | --- | ---: | ---: | --- | --- |
| Desktop, no fixed action | `1440 × 900` | `900` | `0` | `900`: `0, 900, 1800, 2700…` | none |
| Tablet, no fixed action | `768 × 1024` | `1024` | `0` | `1024`: `0, 1024, 2048, 3072…` | none; checkout CTA is in-flow |
| Mobile, no fixed action | `390 × 844` | `764` | `0` | `764`: `0, 764, 1528, 2292…` | none |
| Mobile, `52 px` CTA/save | `390 × 844` | `764` | `52` | `712`: `0, 712, 1424, 2136…` | CTA/save `16,712,358,52` |
| Mobile, `72 px` purchase | `390 × 844` | `764` | `72` | `692`: `0, 692, 1384, 2076…` | purchase `0,692,390,72` |
| Narrow, no fixed action | `360 × 800` | `720` | `0` | `720`: `0, 720, 1440, 2160…` | none |
| Narrow, `52 px` CTA/save | `360 × 800` | `720` | `52` | `668`: `0, 668, 1336, 2004…` | CTA/save `16,668,328,52` |
| Narrow, `72 px` purchase | `360 × 800` | `720` | `72` | `648`: `0, 648, 1296, 1944…` | purchase `0,648,360,72` |

For every section, record `localY = pageY - scrollOffset` and clip against the viewport; do not rewrite the full-page `pageY`. Use the action-specific stride whenever that fixed action is present so content under the overlay is captured in the next frame. Fixed overlays remain outside the scroll canvas and must not intersect bottom navigation or the safe-area inset. If a section ends behind an overlay, add bottom padding equal to the overlay stack and capture its evidence in a separate overlay layer. `SEARCH` and `AUTH` use full-viewport modal layers in both primary mobile (`390 × 844`) and narrow (`360 × 800`) frames; hide the underlying shell and bottom navigation while the modal is open, and do not count the hidden navigation in active-frame bounds. `CART_DRAWER` follows the same modal-layer rule from the root fallback template.

### 16.3 Direction-specific component property values

The property names come from the root contract; these are the NOVA COLLECTION INDEX defaults and overrides:

| Component | NOVA COLLECTION INDEX value |
| --- | --- |
| `Button` | `primary=ink/950`, `hover=ink/800`, `pressed=#0F0E0D`, radius `14`, purchase height `52`; gentle elevation only where the state needs separation |
| `ProductCard` | `imageRatio=4:5`, desktop `w=282`, mobile `w=173`, title `maxLines=2`, `showSwatches=true`, `showSecondImage=false`, `showIndexLabel=true` |
| `EditorialRail` | `layout=dispatchSplit`, `columns=2`, desktop `588+588`, mobile `horizontalScroll=true`, accents use `signal/700` only |
| `MediaGallery` | `thumbnail=72×90`, `gap=10`, `zoom=true`, `state=ready\|loading\|failed`; paper surface, no decorative shadow |
| `PriceBlock` | `Vazirmatn 700`, primary text `ink/950`, sale `signal/700` plus label/icon, currency suffix `تومان` |
| `FilterBar` | `railWidth=282`, `sectionGap=16`, `appliedChipHeight=36`, `mobilePresentation=sheet`, reset action always visible when filters exist |
| `Drawer/Sheet` | Drawer `w=420`; sheet max `90vh`; paper surface; ink CTA; signal conflict markers; focus return to trigger |
| `Admin` | Soft-carbon sidebar, paper panels, ink actions, signal only for sale/dispatch/attention; no shadow used to communicate status |

### 16.4 State and Persian copy fixtures

Use these state fixtures consistently in frames and prototypes:

| State | Required visible copy/action |
| --- | --- |
| Loading | Skeletons preserve the final card/table height and do not shift the grid |
| Empty PLP | `محصولی مطابق این فیلتر پیدا نشد` / `حذف فیلترها` |
| Offline | `ارتباط برقرار نشد؛ اطلاعات ذخیره‌شده را می‌بینید.` / `تلاش دوباره` |
| PDP size error | `لطفاً اندازه را انتخاب کنید.`; focus moves to the size group |
| Stock conflict | `موجودی کالا تغییر کرده است.` / `به‌روزرسانی سبد` |
| Price change | `قیمت این کالا تغییر کرده است.` / `مشاهده قیمت جدید` |
| Payment failure | `پرداخت کامل نشد؛ دوباره تلاش کنید.` / `پشتیبانی` |
| Success | `به سبد خرید اضافه شد` or `سفارش ثبت شد`; include icon, label, and next action |

### 16.5 Asset and content rules

- Hero source: minimum `2400×1200` desktop and `1080×1350` mobile; use a declared crop/focal point for the NOVA collection/dispatch story or approved replacement, and preserve a quiet copy area.
- Product master: minimum `1600×2000`, `4:5`, neutral background, center crop only when the asset record does not define a focal point.
- Category image: minimum `1200×1600`; preserve garment silhouette, category context, and collection label.
- Every asset record includes `assetId`, license/owner, source dimensions, crop/focal point, desktop/mobile variant, and Persian alt text.
- Every fixture records audience, product/category/content ID, title, price in toman, sale/regular price, color, size set, fit, material, care, inventory, delivery, returns, and alt text.
- Use the Section 9.3 fixture strings and test long titles, filter labels, prices, and empty-state copy at `360 px`.

### 16.6 Responsive and interaction rules

- At `1024 px`, collapse the admin sidebar to a 72 px rail and preserve the 12-column hierarchy until content no longer fits.
- At `768 px`, the PDP changes from `588+588` to stacked gallery/information; PLP filters move to a sheet; data tables expose priority columns/cards.
- At `390 px`, maintain two product columns, one-column forms, a sticky purchase/checkout action, and bottom navigation.
- At `360 px`, reduce gaps from `24` to `16` before reducing body text; no price, title, filter chip, or CTA may clip.
- Filter/sort changes update query parameters, reset pagination, and keep the selected audience. Cart and payment conflicts use a recoverable sheet.
- Index-friendly card geometry is invariant across campaigns; editorial content may add source context but may not change card anatomy or shared data meaning.

### 16.7 Handoff and approval checklist

For every `QG/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds, grid values, and tokens match this appendix;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- contrast is checked for ink, signal red, paper, cobalt, and every status alias;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of the handoff table.
