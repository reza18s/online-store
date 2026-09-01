# 04 / NIGHT SHIFT

> Complete Figma design specification for a dark, cinematic, high-contrast Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of five equal, complete design candidates for NOVA Store.

## 1. Direction

NIGHT SHIFT presents clothing as a dramatic, technical, after-dark experience. Deep neutral surfaces, sharp photography, luminous but controlled accents, and precise product data make the direction suitable for streetwear, performance garments, outerwear, and contemporary family fashion.

The direction must feel:

- Cinematic without sacrificing product accuracy.
- Dark by design, not simply an inverted light interface.
- High-contrast and accessible.
- Technical enough for garment details and fit comparison.
- Calm and trustworthy during checkout, payment, account, and admin tasks.

All customer and admin pages are required. Dark product discovery alone is not a complete design.

## 2. Audience and catalog

Primary navigation:

```text
زنانه / مردانه / بچگانه / اکسسوری / کالکشن جدید / استایل شب / تخفیف
```

Women, men, and children receive equal direct navigation, landing pages, listing filters, product examples, campaign modules, and admin taxonomy. Customer prices use toman, such as `۳٬۲۹۰٬۰۰۰ تومان`.

## 3. Figma organization

Create top-level page `04 — NIGHT SHIFT` in the shared Figma file.

Required sections:

```text
00 Cover and direction index
01 Dark foundations
02 Primitive components
03 Commerce components
04 Storefront desktop
05 Storefront mobile
06 Cart and checkout
07 Account and support
08 Campaign, editorial, and utility
09 Admin desktop
10 Admin responsive
11 Contrast, states, and edge cases
12 Prototype flows
```

Use prefix `NS`, for example `NS/PDP/Desktop/Low-Stock` and `NS/Admin/Payment/Desktop/Mismatch`.

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cinematic wide | 1728 px | 1504 px | 12 | 112 px | 32 px |
| Primary desktop | 1440 px | 1248 px | 12 | 96 px | 24 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 24 px |
| Tablet | 768 px | 704 px | 8 | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Rules:

- Full-bleed media is allowed on campaign and product-gallery surfaces.
- Text and controls remain within the content grid.
- Product listing cards use a consistent four-column desktop and two-column mobile grid.
- Dark surfaces must preserve boundaries through tonal contrast, borders, and spacing—not indiscriminate glow.
- Checkout and admin reduce cinematic effects to improve reading endurance.

## 5. Color system

### 5.1 Primitive palette

| Token | Hex | Use |
| --- | --- | --- |
| `night/1000` | `#08090B` | Deep page background |
| `night/950` | `#0E1013` | Main canvas |
| `night/900` | `#15181D` | Surface |
| `night/850` | `#1C2026` | Raised/selected surface |
| `night/750` | `#2B3038` | Strong border |
| `night/650` | `#414853` | Disabled/quiet boundary |
| `white/100` | `#F7F9FC` | Primary text |
| `white/80` | `#D9DEE7` | Secondary text |
| `white/60` | `#AAB2BF` | Supporting text |
| `white/40` | `#8F98A5` | Muted/placeholder |
| `cyan/500` | `#3DD6D0` | Primary action/accent |
| `cyan/600` | `#20BEB8` | Hover action |
| `cyan/100` | `#123A3B` | Selected surface |
| `acid/500` | `#B9F34A` | New/performance accent |
| `acid/100` | `#273414` | Soft acid surface |
| `violet/500` | `#9B7CFF` | Editorial accent |
| `violet/100` | `#2B2448` | Soft violet surface |
| `sale/500` | `#FF6B61` | Sale/error-separated promotion |
| `sale/100` | `#40211F` | Sale surface |
| `success/500` | `#4AD49A` | Success |
| `success/100` | `#173A2C` | Success surface |
| `warning/500` | `#F2B84B` | Warning |
| `warning/100` | `#3B2D14` | Warning surface |
| `error/500` | `#FF7068` | Error |
| `error/100` | `#421F20` | Error surface distinct from sale promotion |
| `info/500` | `#6FA8FF` | Information |
| `info/100` | `#1D2D46` | Information surface |

### 5.2 Semantic aliases

```text
color/bg/page              night/950
color/bg/deep              night/1000
color/bg/surface           night/900
color/bg/raised            night/850
color/text/primary         white/100
color/text/secondary       white/80
color/text/muted           white/60
color/text/placeholder     white/40
color/border/default       night/750
color/border/subtle        night/850
color/action/primary       cyan/500
color/action/primary-hover cyan/600
color/action/selected      cyan/100
color/accent/performance   acid/500
color/accent/editorial     violet/500
color/promotion/sale       sale/500
```

Rules:

- Primary cyan buttons use dark text `#071312`, not white.
- Acid is reserved for new/performance information and never used for body text.
- Violet is editorial and not a transactional state.
- Error red and sale coral use different labels and contextual icons.
- Raised surfaces must differ from the page background by enough luminance to be perceived without shadow.

## 6. Typography

- Persian display and interface family: `Vazirmatn`.
- Technical Latin/identifier family: `IBM Plex Mono`.
- Optional display numerals use tabular variants.
- Weights: `400`, `500`, `600`, `700`.

| Style | Desktop | Mobile | Weight |
| --- | --- | --- | ---: |
| `display/hero` | 58/68 px | 38/48 px | 700 |
| `display/section` | 42/54 px | 30/42 px | 700 |
| `heading/h1` | 38/50 px | 29/40 px | 700 |
| `heading/h2` | 30/42 px | 24/35 px | 700 |
| `heading/h3` | 23/34 px | 20/31 px | 600 |
| `body/lg` | 18/31 px | 17/30 px | 400 |
| `body/md` | 16/28 px | 16/28 px | 400 |
| `body/sm` | 14/24 px | 14/24 px | 400 |
| `label/md` | 14/22 px | 14/22 px | 600 |
| `caption` | 12/20 px | 12/20 px | 500 |
| `price/lg` | 24/34 px | 22/32 px | 700 |
| `technical` | 13/22 px | 13/22 px | IBM Plex Mono 500 |

Technical type is limited to SKU, fit metrics, material data, payment references, tracking IDs, and selected interface micro-labels.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 px`.

Radius:

- `0 px`: full-bleed imagery and tables.
- `4 px`: technical tags.
- `8 px`: inputs, buttons, product cards.
- `12 px`: panels.
- `16 px`: drawers/dialogs.
- `999 px`: status chips and avatars.

Effects:

- Product card border: `1 px #2B3038`.
- Product hover: `0 0 0 1 #414853`, plus `0 12 32 rgba(0,0,0,0.34)`.
- Dropdown: `0 16 40 rgba(0,0,0,0.48)`.
- Drawer: `0 24 72 rgba(0,0,0,0.60)`.
- Focus: dark `2 px` separation plus `2 px #3DD6D0`.
- Glow is limited to selected media controls and campaign art; never use glow around paragraphs or forms.

Motion:

- Controls: `140 ms`.
- Media crossfade: `240 ms`.
- Gallery zoom: `260 ms`.
- Drawer: `260 ms`.
- Reduced motion removes zoom, parallax, and translation.

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

- Announcement strip: `32 px`.
- Header: `76 px`.
- Category navigation: `48 px`.
- Sticky header: `64 px`, translucent `night/950` with solid fallback.
- Search overlay: `720 px`.
- Footer: five columns on `night/1000`.

Mobile:

- Announcement: `28 px`.
- Header: `58 px`.
- Search row: `52 px`.
- Bottom navigation: `64 px` plus safe area.
- Full-height navigation drawer on `night/900`.

Women, men, and children remain direct, equal navigation options. Campaign styling may vary, but primary navigation cannot encode audience only by color.

## 9. Component inventory

Primitive components: `Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Commerce components: `Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Category Card`, `Campaign Feature`, `Product Card`, `Compact Product Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, and `Recently Viewed`.

Admin components: `Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

Every applicable component includes default, hover, focus, pressed/selected, disabled, loading, error, and success states. Default input is `48 px`, admin compact input `40 px`, button `44 px`, purchase CTA `52 px`, and minimum pointer target `44 × 44 px`.

### 9.1 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `cyan/500` | `cyan/500` | `#071312` | No glow required |
| Hover primary | `cyan/600` | `cyan/600` | `#071312` | `140 ms` transition |
| Pressed primary | `white/100` | `white/100` | `night/1000` | No scale animation |
| Focus | Existing fill | `night/950` separation plus `cyan/500` | Existing text | Two-ring focus distinct from decoration |
| Disabled | `night/850` | `night/750` | `white/40` | Explicit disabled label/state |
| Loading | Originating state | Originating state | Spinner plus preserved label | Prevent repeat action |
| Error | `error/100` | `error/500` | `error/500` | Icon, message, summary link |
| Success | `success/100` | `success/500` | `success/500` | Icon and confirmation text |

### 9.2 Construction-level component contracts

| Component | Anatomy and measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; padding `12/16/24 px`; icon `16/20 px`; gap `8 px`; radius `8 px` | Primary, Secondary, Outline, Ghost, Destructive; sizes; icon slots; all states | Purchase CTA fills mobile width; ordinary buttons hug content |
| Icon Button | `36/44/52 px` square; icon `18/20/24 px`; radius `8 px` | Ghost, Raised, Outline; tooltip/accessibility label | Minimum `44 px` on customer mobile |
| Text/Phone Field | Height `48 px`; padding `14 px`; label gap `8 px`; icon `20 px`; helper gap `6 px` | Empty, filled, focus, disabled, error, success; prefix/suffix | Full mobile width; phone value isolated LTR |
| Search Field | Height `48 px`; icon `20 px`; clear target `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | `720 px` desktop overlay; full-screen mobile |
| Select | Trigger `48 px`; item `44 px`; menu padding `8 px`; chevron `20 px` | Placeholder, selected, open, disabled, error; single/multiple | Filter selection uses bottom sheet on mobile |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed, focus, disabled, error | Clickable row minimum `44 px` |
| Tabs/Chip/Badge | Tab `44 px`; chip `36 px`; badge `24 px`; padding `12/10/8 px` | Active, inactive, focus, disabled; removable/status variants | Tabs scroll horizontally with edge cue |
| Dialog | Width `480/640 px`; padding `24/32 px`; radius `16 px`; footer gap `12 px` | Info, form, confirmation, destructive; loading/error | Mobile `calc(100% - 32px)` or bottom sheet |
| Drawer/Bottom Sheet | Drawer `432 px`; sheet max `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide | Full width below `480 px`; safe-area padding |
| Toast/Inline Message | Toast `360 px`; padding `16 px`; icon `20 px`; inline padding `12 px` | Success, warning, error, info; optional actions | Mobile width `calc(100% - 32px)` |
| Breadcrumb/Pagination/Stepper | Breadcrumb `32 px`; pagination target `44 px`; step node `28 px` | Full/collapsed; first/middle/last; current/complete/error | Collapse deep paths; compact checkout labels |
| Product Card | Desktop `288–300 px`; mobile `173 px`; image `4:5`; content gap `10 px`; border `1 px`; radius `8 px` | Regular, sale, new, low/out stock, loading; swatches/second image | Four desktop, three filtered, two mobile; price visible |
| Media Gallery | Main `4:5`; thumbnail `72 × 90 px`; gap `10 px`; zoom target `44 px` | Image, video-ready, zoom, loading, failed | Thumbnail rail desktop; swipe gallery mobile |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wraps without page overflow; guide sheet mobile |
| Cart Item | Image `112 × 140 px` desktop, `88 × 110 px` mobile; quantity `112 × 40 px`; padding `16 px` | Default, updating, removed, stock conflict, price change, error | Stack actions below metadata on mobile |
| Order Summary | Width `408 px`; padding `24 px`; row gap `12 px`; CTA `52 px` | Default, recalculating, coupon success/error, quote expired | Full width mobile; sticky CTA where specified |
| Address/Shipping/Payment | Minimum `88 px`; padding `16 px`; radio `20 px`; text gap `4 px` | Default, hover, selected, disabled, unavailable, error | Full-width stack; explicit radio/label selection |
| Data Table | Header `48 px`; rows `48/56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Becomes labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; two-column fields; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color | One-column below `768 px`; contained matrix scroll |

### 9.3 Realistic Persian UI content set

```text
Navigation: زنانه، مردانه، بچگانه، اکسسوری، کالکشن جدید، استایل شب، تخفیف
Campaign: پس از تاریکی — کالکشن تازه پوشاک شهری
Women product: کت بامبر زنانه نئون — مشکی — ۳٬۴۹۰٬۰۰۰ تومان
Men product: بارانی فنی مردانه — خاکستری گرافیتی — ۴٬۲۹۰٬۰۰۰ تومان
Children product: سویشرت زیپ‌دار کودک — بنفش تیره — ۱٬۳۹۰٬۰۰۰ تومان
Actions: افزودن به سبد، انتخاب اندازه، بررسی مشخصات فنی، مشاهده کالکشن
Search: جست‌وجوی لباس، متریال یا کالکشن… / نتیجه‌ای پیدا نشد؛ عبارت دیگری وارد کنید.
Stock: آماده ارسال / موجودی محدود / اندازه انتخابی ناموجود است
Checkout: نشانی، ارسال، پرداخت، تأیید سفارش
Errors: اندازه را انتخاب کنید. / پرداخت تکمیل نشد. / وضعیت پرداخت در حال بررسی است.
Order: سفارش ثبت شد، پرداخت تأیید شد، در حال آماده‌سازی، ارسال شد، تحویل داده شد
Admin: محصولات، سفارش‌ها، موجودی، پرداخت‌ها، کمپین‌ها، مشتریان، محتوا، عملیات
```

## 10. Storefront pages

| Page | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Home | Full-bleed `1440 × 720 px` cinematic hero with `1248 px` aligned content; audience triptych; new collection; technical product rail; feature story; children/family capsule; trust; footer | `390 × 500 px` hero; three audience destination cards; two-column products; cinematic campaign rail | Campaign, no campaign, video/image fallback, loading, slow image, error |
| Category landing | Full-width category still, high-contrast title, subcategories, products, fit/material guide, SEO copy | Portrait hero, horizontal subcategories, two-column products | Women, men, children, campaign off |
| Product listing | `288 px` dark filter rail plus three-card grid; compact technical metadata | Two-column cards; sticky filter/sort; bottom sheet | Default, filtered, sale, no results, loading, error |
| Search | `720 px` dark overlay with recent, category, and product results | Full-screen search | Recent, popular, typing, typo, no result, loading, error |
| Product detail | `744 px` cinematic gallery plus `456 px` sticky info; contrast-safe product data; technical fit/material block | Full-width gallery; `16 px` info; size sheet; `72 px` sticky purchase bar | Empty/selected variant, size error, low/out stock, sale, zoom, added, price change |
| Cart drawer | `432 px` raised drawer and fixed cyan CTA | Full-width sheet | Empty, stock conflict, price change, loading, error |
| Cart page | `816 px` items plus `408 px` raised summary | One column; sticky CTA | Empty, coupon states, unavailable item |
| Authentication | `456 px` dark raised panel with optional media | Full-height one-column form | Guest, login, invalid, expired, rate limit, error |
| Checkout address | Reduced-effects `816 + 408 px` dark layout | One column | Saved/new, validation, unsupported region, save error |
| Checkout shipping | High-contrast selectable method cards | Stacked cards | Quote loading, selected, unavailable, expired |
| Checkout payment | Gateway cards with cyan action and explicit total | Stacked cards, sticky CTA | Processing, redirect, failed, cancelled, timeout, pending |
| Confirmation | Cyan success state plus dark receipt | Stacked success/receipt | Paid, pending, guest invitation |
| Tracking | Technical labeled timeline with carrier reference | Vertical timeline | Preparing, shipped, delayed, delivered, cancelled |

Photography:

- Product master: at least `1800 × 2250 px` because dark crops expose compression artifacts.
- Desktop hero: `2880 × 1440 px`.
- Mobile hero: `1080 × 1440 px`.
- Category: `1440 × 1800 px`.
- Images require dark-safe and light-garment QA. Black garments cannot disappear into the canvas; white garments cannot clip.

## 11. Account, support, content, and utility

Desktop account uses `280 px` navigation and `920 px` content. Required pages:

- Dashboard.
- Profile and consent.
- Addresses.
- Orders and order detail.
- Support and FAQ search.
- Security/session page.
- Notification preferences.
- Campaign landing.
- Buying guide, lookbook, and article.
- About, trust, shipping, returns, size, care, FAQ, contact, privacy, and terms.
- `404`, offline, and maintenance.

Long-form legal and support content uses `night/900` or an optional high-reading-comfort light document surface within the dark shell. If a light surface is used, it must be a designed semantic mode, not an arbitrary white rectangle.

P1 covers wishlist, back-in-stock, returns, store credit, referrals, reviews, product comparison, and product questions.

## 12. Admin pages

Admin uses `240 px` sidebar, `64 px` topbar, `32 px` padding, `48 px` dense rows, and `56 px` comfortable rows. Admin surfaces avoid glow and use `night/900`, `night/850`, borders, and cyan actions.

Required pages:

- Login and MFA-ready verification.
- Dashboard.
- Products list and product create/edit.
- Size × color variant matrix.
- Media management.
- Women/men/children categories.
- Inventory and movements.
- Orders and order detail.
- Payments, callbacks, and mismatches.
- Promotions and coupons.
- Customer lookup and protected detail.
- Campaign/content management.
- Audit log.
- Notification retry and operational status.

Product editing includes audience, garment type, season, material, care, fit, size system, color, model measurements, imagery, stock, shipping, Persian SEO, draft, preview, publish, and archive.

At `1024 px`, collapse the sidebar. At `768/390 px`, operational lists become cards. Validate dark table headers, selection, hover, focus, disabled, sticky, and overflow states separately.

## 13. RTL, accessibility, and contrast

- Document uses `fa-IR` and RTL.
- Use logical layout properties and validate physical overlay placement.
- Isolate technical references as LTR.
- Validate breadcrumb, carousel, slider, stepper, pagination, and timeline directions.
- Body text and controls must meet WCAG AA against every dark surface.
- Placeholder text cannot use values dimmer than `white/40` without contrast verification.
- Primary cyan controls use dark text.
- Focus is visible and not confused with neon decoration.
- Swatches expose names; unavailable sizes use explicit labels/treatment.
- Errors provide summary and field descriptions.
- Dialog focus trap, Escape, close, and focus return are annotated.
- Loading, empty, error, offline, disabled, success, stock conflict, and payment conflict states are required.

## 14. Prototype flows

Customer:

1. Home → women collection → PLP → PDP.
2. Home → men performance → fit details → cart.
3. Home → children capsule → age/size filter → PDP.
4. Cart → guest checkout → address → shipping → payment → confirmation.
5. Payment failure → pending verification → retry → success.
6. Search typo → correction → product.
7. Confirmation → tracking → delay → support.
8. Account → orders → detail.

Admin:

1. Create product → dark/light garment media QA → variants → publish.
2. Low stock → adjustment → audit.
3. New order → paid → preparing → shipped.
4. Payment mismatch → verification.
5. Edit campaign → preview → publish.

## 15. Completion criteria

- Every customer and admin page exists at `1440 px` and `390 px`.
- PLP, PDP, cart, checkout, account order detail, admin product edit, and admin order detail exist at `768 px`.
- `360 px` QA passes.
- Women, men, and children are represented across navigation, pages, filters, content, and admin.
- All customer prices use toman.
- All components use Auto Layout, variables, styles, and documented properties.
- Light and dark garments remain visually readable in product media.
- Core customer and admin prototypes work.
- Slow-network, stock-conflict, and payment-conflict states are documented and prototyped where relevant.
- Contrast, focus, keyboard, RTL, reduced-motion, and edge-state reviews pass.
- Screenshot comparison finds no glow misuse, clipping, weak boundaries, wrong crop, or responsive drift.

## 16. Construction appendix

This appendix instantiates the shared deterministic Figma contract in the root [README](../../../README.md). Every frame uses the `NS` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

### 16.1 Frame matrix and coordinate anchors

| Frame family | Desktop | Tablet | Mobile | Narrow QA |
| --- | --- | --- | --- | --- |
| Storefront shell | `1440 × 900`, full-bleed media with aligned content `x=96,w=1248`, 12 columns, 24 px gutter | `768 × 1024`, content `x=32,w=704`, 8 columns, 16 px gutter | `390 × 844`, content `x=16,w=358`, 4 columns, 12 px gutter | `360 × 800`, content `x=16,w=328` |
| Account shell | `1440 × 900`, nav `x=96,w=280`, gap `32`, content `w=920` | `768 × 1024`, nav becomes a summary row, content `w=704` | `390 × 844`, stacked destination list and one-column content | `360 × 800`, same stack with 16 px side padding |
| Admin shell | `1440 × 900`, sidebar `240`, topbar `64`, content padding `32`, no glow | `768 × 1024`, sidebar hidden, operational cards | `390 × 844`, card queues and sticky save/action bar | `360 × 800`, no table overflow |

Use these top-level coordinates in every primary frame:

| Screen | Desktop coordinate anchors | Mobile coordinate anchors |
| --- | --- | --- |
| Shell | Announcement `y=0,h=32`; header `y=32,h=76`; category nav `y=108,h=48`; content starts `y=156` | Announcement `h=28`; header `h=58`; content starts `y=86`; bottom nav fixed `h=64` plus safe area |
| `HOME` | Full-bleed hero `x=0,y=156,w=1440,h=720`; aligned copy starts `x=96`; technical product rail cards `w=288` | Hero `x=0,y=86,w=390,h=500`; audience cards use `x=16,w=358`; product cards `w=173` |
| `PLP_*` | Dark filter rail `x=96,w=288`; gap `24`; product grid `x=408,w=936`, three columns; metadata stays visible | Sticky filter/sort bar `x=16,y=86,w=358,h=52`; two cards `w=173`; filters use a sheet |
| `PDP` | Gallery `x=96,w=744`; gap `24`; info `x=864,w=456`; technical data block below purchase essentials | Gallery `x=16,y=86,w=358,aspect=4:5`; info padding `16`; purchase bar fixed `h=72` |
| `CART`/checkout | Items `x=96,w=816`; gap `24`; raised summary `x=936,w=408`; cyan is the only primary action | One-column content `x=16,w=358`; sticky CTA above bottom navigation |
| Account | Nav `x=96,w=280`; gap `32`; content `x=408,w=920`; document pages may use designed light reading surface | Summary header `x=16,w=358`; stacked destinations and content |
| Admin | Sidebar `x=0,w=240`; topbar `y=0,h=64`; content `x=272,w=1136`; raised surfaces differ from page background by luminance, not glow | Topbar `h=56`; content padding `16`; tables become labeled cards |

Frame names follow `NS/<Screen>/<Viewport>/<State>`, for example `NS/Home/Desktop/Video-Fallback`, `NS/PDP/Mobile/Out-of-Stock`, and `NS/Admin/Payments/Desktop/Mismatch`. Record the actual node URL beside each name after the Figma frame is created.

### 16.2 Screen-sheet map

Each row below represents an individual frame even where IDs are grouped. Every row inherits the complete baseline from the root [shared page and state matrix](../../../README.md#shared-page-and-state-matrix); the state cell lists direction-specific or visually emphasized states and is additive, never a replacement. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Direction-specific / emphasized states (plus full root baseline) |
| --- | --- | --- | --- |
| `HOME` | Full-bleed cinematic hero, audience triptych, new collection, technical product rail, feature story, children/family capsule, trust, footer | 390 px hero, three audience destination cards, two-column products, cinematic campaign rail | Campaign, no campaign, video fallback, image fallback, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Full-width category still, high-contrast title, subcategories, products, fit/material guide, SEO block | Portrait hero, horizontal subcategories, two-column products, expandable copy | Default, campaign off, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 288 px dark filter rail, three-card grid, compact technical metadata, sort, applied chips, pagination | Two-column cards, sticky filter/sort, filter bottom sheet | Default, filtered, sale, no results, loading, error, offline |
| `SEARCH` | 720 px dark overlay, recent/category/product groups, technical result metadata, full page | Full-screen search with sticky field and grouped result cards | Empty, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 744 px cinematic gallery, 456 px sticky info, technical fit/material block, contrast-safe price/stock/delivery/returns/details | Full-width gallery, 16 px info, size sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 432 px raised drawer; full cart uses 816 px items plus 408 px raised summary | Full-width sheet; one-column cart with sticky CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 456 px dark raised panel with optional media; guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Reduced-effects `816+408` flow; high-contrast cards; cyan action; explicit total | One-column step panels; sticky next/pay CTA; method cards stack | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | Cyan success state plus dark receipt; technical labeled timeline and carrier reference | Stacked success/receipt and vertical timeline | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | 280 px account navigation plus 920 px content; dark raised cards; immutable order snapshots | Summary header, stacked destinations, one-column forms/order details | Loading, empty orders/addresses, validation error, save success/error, permission error, offline |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | FAQ search, support entry, sessions, and preferences in 920 px content; no decorative glow | Accordion groups and full-width controls | Empty search, ticket submitted, session revoke success/error, preference save error |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | Cinematic story media, technical captions, 720 px reading measure, shoppable references | Single-column reading flow, swipe media, related products after major sections | Published, scheduled, missing media, video fallback, loading, unavailable, offline |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | Dark reading surface or explicitly designed light document mode, 640–720 px measure, labeled callouts | 358 px reading column, collapsible contents and accordions | Default, loading, error, offline, contact validation/success |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | Centered 480 px message on `night/900` with return/search/support action | Full-width 358 px message and one primary action | 404, offline cached shell, maintenance window |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | 240 px sidebar, 64 px topbar, dark stat cards, action queues, no glow | Sidebar hidden; cards and priority queue | Invalid, locked, rate-limited, MFA step, loading, permission error |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | Dark filter bar, 48/56 px rows, audience/category/status filters, bulk actions, pagination | Priority columns become labeled cards; filters become a sheet | Loading, empty, request error, stock discrepancy, bulk-action success/error |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | Sectioned dark form, 2-column fields, 120 × 44 px matrix cells, media crop/reorder panel | One-column sections; contained matrix scroll; sticky save bar | Draft, invalid, saving, saved, publish blocked, upload/crop failure |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | Queue tabs, immutable snapshots, payment callback timeline, internal notes, technical references | Queue/detail cards with labeled event rows | New/paid/preparing/shipped, payment mismatch, retry, webhook error, permission error |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | Promotion/content editor, restricted customer lookup/detail, audit before/after, notification/media/payment health; no glow in operational surfaces | Card sections with explicit section navigation and unsaved-change guard; PII stays permission-gated | Draft, scheduled, publish blocked, success, failure, no activity, service degraded, permission error |

### 16.2.1 Exact section-bound stacks

The values below use `x,y,width,height` in pixels in one full-page coordinate system. The `1440 × 900` and `390 × 844` viewports show the portion intersecting their recorded scroll offset; `Scroll-0` starts at `y=0`, and `Scroll-1` and later frames retain these coordinates while recording the new offset. Slash-separated IDs share this geometry but still receive separate Figma frames and node URLs.

| Screen IDs | Desktop section stack (`1440 × 900`) | Mobile section stack (`390 × 844`) |
| --- | --- | --- |
| `HOME` | `Hero(0,156,1440,720)` with copy aligned `x=96` → `AudienceTriptych(96,940,1248,300)` → `TechnicalRail(96,1288,1248,510)` → `FeatureStory(96,1846,1248,420)` → `Trust(96,2310,1248,300)` → `Footer(96,2642,1248,280)` | `Hero(0,86,390,500)` → `AudienceCards(16,618,358,220)` → `Products(16,870,358,420)` → `CampaignRail(16,1322,358,320)` → `Trust(16,1674,358,260)` → `Footer(16,1966,358,320)` |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | `CategoryHero(0,156,1440,520)` → `Subcategories(96,700,1248,64)` → `Products(96,788,1248,510)` → `FitMaterialGuide(96,1342,1248,360)` → `SEOCopy(96,1746,1248,360)` | `PortraitHero(0,86,390,420)` → `Subcategories(16,538,358,52)` → `Products(16,614,358,420)` → `FitGuideSEO(16,1066,358,420)` |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | `Toolbar(96,156,1248,96)` → `FilterRail(96,276,288,620)` + `ProductGrid(408,276,936,620)`; card rows are `288×510`, row gap `24` | `FilterSortBar(16,86,358,52)` → `ProductGrid(16,162,358,900)`; cards are `173×420`; filter sheet `16,86,358,758` |
| `SEARCH` | `SearchOverlay(360,156,720,600)` → `SearchResults(96,800,1248,620)` | `SearchSurface(0,86,390,758)` with field `16,86,358,52` and results `16,162,358,682` |
| `PDP` | `Gallery(96,156,744,900)` + `PurchaseInfo(864,156,456,760)` → `TechnicalDetails(96,1080,1248,420)` → `RelatedProducts(96,1524,1248,510)` | `Gallery(16,86,358,448)` → `PurchaseInfo(16,566,358,650)` → `TechnicalDetails(16,1238,358,420)` → `RelatedProducts(16,1682,358,420)`; purchase bar `0,772,390,72` |
| `CART_DRAWER`, `CART` | Drawer `1008,0,432,900`; cart page `Items(96,156,816,720)` + `Summary(936,156,408,640)` | Sheet `0,86,390,758`; cart page `Items(16,86,358,620)` → `Summary(16,738,358,360)`; sticky CTA `16,744,358,52` |
| `AUTH`, `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Auth `Panel(492,206,456,560)`; checkout `Form(96,156,816,680)` + `Summary(936,156,408,640)` and stepper `96,116,816,32` | Auth `Form(16,86,358,650)`; checkout `Step(16,86,358,620)` → `Summary(16,730,358,300)`; sticky CTA `16,772,358,52` |
| `CONFIRMATION`, `TRACKING` | `Receipt(96,156,792,560)` + `NextSteps(912,156,336,320)`; timeline `96,740,1248,220` | `Receipt(16,86,358,420)` → `NextSteps(16,538,358,240)` → `Timeline(16,806,358,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountNav(96,156,280,620)` + `AccountContent(408,156,920,720)`; dark raised cards use `night/900` | `AccountSummary(16,86,358,120)` → `DestinationList(16,230,358,360)` → `AccountContent(16,614,358,620)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `AccountNav(96,156,280,620)` + `SupportContent(408,156,920,720)`; no decorative glow | `Summary(16,86,358,120)` → `SearchOrControls(16,230,358,104)` → `AccordionContent(16,358,358,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHero(96,156,1248,520)` → `ReadingMeasure(360,724,720,920)` → `ProductReferences(96,1668,1248,510)` | `StoryHero(16,86,358,360)` → `ReadingMeasure(16,478,358,980)` → `ProductRail(16,1474,358,420)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(96,156,1248,180)` → `ReadingMeasure(360,368,720,920)` → `RelatedOrContact(96,1320,1248,300)` | `DocumentHeader(16,86,358,160)` → `ReadingMeasure(16,270,358,980)` → `RelatedOrContact(16,1282,358,320)` |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | `Message(480,296,480,300)` with action `520,512,400,52` on `night/900` | `Message(16,214,358,300)` with action `16,542,358,52` |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | `AdminSidebar(0,0,240,900)` + `AdminTopbar(240,0,1200,64)` + `Dashboard(272,96,1136,720)`; no glow | `AdminTopbar(0,0,390,56)` + `DashboardCards(16,80,358,720)` |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | `AdminSidebar(0,0,240,900)` + `FilterBar(272,96,1136,56)` + `DataTable(272,176,1136,620)` | `AdminTopbar(0,0,390,56)` + `FilterBar(16,80,358,52)` + `PriorityCards(16,156,358,760)` |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | `AdminSidebar(0,0,240,900)` + `FormHeader(272,96,1136,64)` + `FormSections(272,184,760,640)` + `Preview(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `FormSections(16,80,358,980)` + sticky save bar `16,772,358,52` |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | `AdminSidebar(0,0,240,900)` + `QueueOrDetail(272,96,760,720)` + `EventsOrSummary(1056,96,352,720)` | `AdminTopbar(0,0,390,56)` + `QueueOrDetail(16,80,358,840)` |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | `AdminSidebar(0,0,240,900)` + `SectionHeader(272,96,1136,64)` + `PrimaryPanel(272,184,760,640)` + `SecondaryPanel(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `SectionNav(16,80,358,52)` + `PrimaryPanel(16,156,358,820)` |

### 16.3 Direction-specific component property values

The property names come from the root contract; these are the NIGHT SHIFT defaults and overrides:

| Component | NIGHT SHIFT value |
| --- | --- |
| `Button` | `primary=cyan/500`, `hover=cyan/600`, `pressed=night/1000`, dark text `#071312`, radius `8`, purchase height `52` |
| `CampaignFeature` | `accent=acid/500\|violet/500`, `glow=none\|subtle`, `copySafe=true`, `maxGlowSpread=24`, `campaignOnly=true` |
| `ProductCard` | `imageRatio=4:5`, desktop `w=288–300`, mobile `w=173`, title `maxLines=2`, `showTechnicalMeta=true`, `showSwatches=true` |
| `MediaGallery` | `thumbnail=72×90`, `gap=10`, `zoom=true`, `state=ready\|loading\|failed`, `darkGarmentOutline=true` when needed |
| `PriceBlock` | Customer amount `Vazirmatn 700`; price is `white/100`; sale is `sale/500` with label/icon; currency suffix `تومان` |
| `Drawer/Sheet` | Drawer `w=432`; sheet max `90vh`; raised `night/900` surface; cyan CTA; no glow on checkout |
| `Admin` | `night/950` page, `night/900` surface, `night/750` border, cyan action; glow disabled for all operational controls |

Glow rules: only campaign hero accents and explicitly marked performance badges may glow; blur/spread is at most `24 px`, opacity at most `40%`, and glow is disabled for focus rings, errors, payment states, tables, and admin operations.

### 16.4 State and Persian copy fixtures

Use these state fixtures consistently in frames and prototypes:

| State | Required visible copy/action |
| --- | --- |
| Loading | Skeletons use `night/850` and `night/750` without glow; final card height is preserved |
| Empty PLP | `محصولی مطابق این فیلتر پیدا نشد` / `حذف فیلترها` |
| Offline | `ارتباط برقرار نشد؛ اطلاعات ذخیره‌شده را می‌بینید.` / `تلاش دوباره` |
| PDP size error | `اندازه انتخابی را مشخص کنید.`; focus moves to the size group |
| Stock conflict | `موجودی این کالا تغییر کرده است.` / `به‌روزرسانی سبد` |
| Price change | `قیمت این کالا تغییر کرده است.` / `مشاهده قیمت جدید` |
| Payment failure | `پرداخت تکمیل نشد.` / `تلاش دوباره` / `پشتیبانی` |
| Pending verification | `وضعیت پرداخت در حال بررسی است.`; do not show a second payment CTA until the intent is safe to retry |
| Success | `سفارش ثبت شد` or `به سبد اضافه شد`; cyan action, icon, and label remain readable without glow |

### 16.5 Asset, contrast, and content rules

- Product master: at least `1800×2250` because dark crops expose compression artifacts; test both black and white garments.
- Hero source: `2880×1440` desktop and `1080×1440` mobile; each asset records a dark-safe and light-garment-safe crop.
- Category source: `1440×1800`; preserve garment silhouette and a contrast-safe title area.
- Every asset record includes `assetId`, license/owner, source dimensions, crop/focal point, overlay opacity, desktop/mobile variant, and Persian alt text.
- Every text/control combination records measured contrast against its exact dark surface; body and controls must meet WCAG AA, and placeholders cannot be used without verification.
- Every fixture records audience, product/category/content ID, title, price in toman, sale/regular price, color, size, fit, material, care, inventory, delivery, returns, and alt text.
- Use Section 9.3 strings and test long Persian titles, technical references, prices, and CTA labels at `360 px`.

### 16.6 Responsive and interaction rules

- At `1024 px`, collapse the admin sidebar to a 72 px rail and remove decorative glow before reducing information density.
- At `768 px`, the PDP changes from `744+456` to stacked gallery/information; PLP filters move to a sheet; operational tables become priority cards.
- At `390 px`, maintain two product columns, one-column forms, sticky purchase/checkout actions, and bottom navigation.
- At `360 px`, reduce gaps from `24` to `16` before reducing body text; white garments, cyan labels, and dark borders must remain readable.
- Video hero fallback is explicit: `video → poster image → neutral media placeholder`; never leave a black silent block without status text.
- Filter/sort changes update query parameters, reset pagination, and preserve audience. Cart and payment conflicts use recoverable sheets with no duplicate-payment path.

### 16.7 Handoff and approval checklist

For every `NS/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds, grid values, and tokens match this appendix;
- contrast is measured for every dark surface, cyan/acid/violet control, status, placeholder, and garment crop;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- no glow appears on focus, error, payment, table, or admin operational states;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of the handoff table.
