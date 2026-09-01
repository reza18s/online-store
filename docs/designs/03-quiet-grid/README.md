# 03 / QUIET GRID

> Complete Figma design specification for a calm, comparison-focused Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of five equal, complete design candidates for NOVA Store.

## 1. Direction

QUIET GRID uses disciplined alignment, warm neutral surfaces, restrained green accents, and consistent product cards to make clothing comparison effortless. Editorial content supports the catalog but never disrupts the buying path.

The direction must feel:

- Calm, modern, and highly usable.
- Product-first rather than campaign-first.
- Trustworthy on slow Iranian mobile networks.
- Suitable for broad family shopping.
- Dense enough for comparison, spacious enough to avoid fatigue.

All customer, content, account, and admin pages are required.

## 2. Audience and catalog

Primary navigation:

```text
زنانه / مردانه / بچگانه / اکسسوری / جدیدترین‌ها / پرفروش‌ها / تخفیف
```

Women, men, and children have equal information architecture: landing pages, subcategories, filters, product variants, campaign modules, and admin taxonomy. The interface displays toman, for example `۲٬۴۹۰٬۰۰۰ تومان`.

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
| `paper/0` | `#FFFFFF` | Surface |
| `paper/50` | `#FAF9F6` | Page canvas |
| `paper/100` | `#F2F0EA` | Secondary surface |
| `paper/200` | `#E8E5DD` | Selected or muted surface |
| `ink/950` | `#11110F` | Primary text |
| `ink/800` | `#2D2C28` | Strong secondary |
| `ink/600` | `#66635C` | Supporting text |
| `ink/450` | `#6D6A63` | Metadata and placeholder |
| `ink/300` | `#B8B3A8` | Disabled |
| `line/200` | `#D8D4CA` | Border |
| `line/100` | `#E8E5DD` | Divider |
| `forest/900` | `#14372C` | Pressed action |
| `forest/800` | `#1A4638` | Hover action |
| `forest/700` | `#215744` | Primary action |
| `forest/200` | `#BBD8C9` | Focus support |
| `forest/100` | `#E6F0EA` | Selected surface |
| `clay/700` | `#A4432D` | Sale emphasis |
| `clay/100` | `#F8E9E3` | Sale surface |
| `success/700` | `#176B4D` | Success |
| `success/100` | `#E4F3EB` | Success surface |
| `warning/700` | `#8A5200` | Warning |
| `warning/100` | `#FFF2D8` | Warning surface |
| `error/700` | `#B42318` | Error |
| `error/100` | `#FDE8E7` | Error surface |
| `info/700` | `#2458A6` | Information |
| `info/100` | `#E8F0FC` | Information surface |

Semantic aliases:

```text
color/bg/page              paper/50
color/bg/surface           paper/0
color/bg/subtle            paper/100
color/bg/selected          forest/100
color/text/primary         ink/950
color/text/secondary       ink/600
color/text/muted           ink/450
color/text/inverse         paper/0
color/border/default       line/200
color/border/subtle        line/100
color/action/primary       forest/700
color/action/primary-hover forest/800
color/action/primary-down  forest/900
color/action/focus         forest/200
color/promotion/strong     clay/700
color/promotion/soft       clay/100
```

Forest is the only global action color. Clay is limited to discounts and editorial accents. Interface status always combines color, text, and icon.

## 6. Typography

- Persian interface family: `Vazirmatn`.
- Latin and technical fallback: `Inter`.
- Use only `400`, `500`, `600`, and `700`.

| Style | Desktop | Mobile | Weight |
| --- | --- | --- | ---: |
| `display/xl` | 48/64 px | 34/48 px | 700 |
| `display/lg` | 40/56 px | 30/44 px | 700 |
| `heading/h1` | 36/52 px | 28/40 px | 700 |
| `heading/h2` | 30/44 px | 24/36 px | 700 |
| `heading/h3` | 24/36 px | 20/32 px | 600 |
| `heading/h4` | 20/32 px | 18/28 px | 600 |
| `body/lg` | 18/32 px | 17/30 px | 400 |
| `body/md` | 16/28 px | 16/28 px | 400 |
| `body/sm` | 14/24 px | 14/24 px | 400 |
| `label/md` | 14/24 px | 14/24 px | 600 |
| `caption` | 12/20 px | 12/20 px | 400 |
| `price/lg` | 24/36 px | 22/34 px | 700 |

Product-card titles use two lines maximum. Identifiers use Inter tabular numerals and isolated LTR direction.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120 px`.

Radius:

- `0 px`: tables and hard dividers.
- `4 px`: badges.
- `8 px`: buttons, inputs, product cards.
- `12 px`: panels and drawers.
- `16 px`: campaign and empty-state panels.
- `24 px`: rare large editorial surface.
- `999 px`: chips and avatars.

Effects:

- Standard product cards have no shadow.
- Hover card: `0 6 18 rgba(17,17,15,0.08)`.
- Dropdown: `0 8 24 rgba(17,17,15,0.10)`.
- Drawer: `0 16 48 rgba(17,17,15,0.16)`.
- Sticky: `0 -4 20 rgba(17,17,15,0.08)`.
- Focus: white `2 px` separation plus `2 px #6EA989`.

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

- Announcement bar: `32 px`.
- Header: `72 px`.
- Category navigation: `44 px`.
- Sticky header: `64 px`.
- Search overlay: `640–720 px`.
- Footer: four columns within `1200 px`.

Mobile:

- Announcement: `28 px`.
- Header: `56 px`.
- Search row: `52 px`.
- Bottom navigation: `64 px` plus safe area.
- Full-height RTL navigation drawer.

Women, men, and children remain direct destinations at desktop and mobile widths.

## 9. Component inventory

Primitive components: `Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Commerce components: `Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Product Card`, `Compact Product Card`, `Category Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, `Editorial Rail`, and `Recently Viewed`.

Admin components: `Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

Every component uses Auto Layout and variables. Standard input height is `48 px`, compact admin input `40 px`, button `44 px`, purchase CTA `52 px`, and minimum target `44 × 44 px`.

### 9.1 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `forest/700` | `forest/700` | `paper/0` | No shadow |
| Hover primary | `forest/800` | `forest/800` | `paper/0` | `120 ms` transition |
| Pressed primary | `forest/900` | `forest/900` | `paper/0` | No scale animation |
| Focus | Existing fill | White separation plus `forest/200` | Existing text | Two-ring focus outside bounds |
| Disabled | `paper/100` | `line/100` | `ink/450` | No pointer action; explicit unavailable state |
| Loading | Originating state | Originating state | Spinner plus preserved label | Prevent repeat action |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.2 Construction-level component contracts

| Component | Anatomy and measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; padding `12/16/24 px`; icon `16/20 px`; gap `8 px`; radius `8 px` | Primary, Secondary, Outline, Ghost, Destructive; sizes; icon slots; interaction states | Purchase CTA fills mobile width; ordinary buttons hug content |
| Icon Button | `36/44/52 px` square; icon `18/20/24 px`; radius `8 px` | Ghost, Surface, Outline; tooltip/accessibility label | Minimum `44 px` on customer mobile |
| Text/Phone Field | Height `48 px`; padding `14 px`; label gap `8 px`; icon `20 px`; helper gap `6 px` | Empty, filled, focus, disabled, error, success; prefix/suffix | Full mobile width; phone value LTR-isolated |
| Search Field | Height `48 px`; icon `20 px`; clear target `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | `640–720 px` overlay desktop; full-screen mobile |
| Select | Trigger `48 px`; item `44 px`; menu padding `8 px`; chevron `20 px` | Placeholder, selected, open, disabled, error; single/multiple | Filter selections use a bottom sheet on mobile |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed, focus, disabled, error | Clickable row minimum `44 px` |
| Tabs/Chip/Badge | Tab `44 px`; chip `36 px`; badge `24 px`; padding `12/10/8 px` | Active, inactive, focus, disabled; removable/status variants | Tabs scroll on mobile with continuation cue |
| Dialog | Width `480/640 px`; padding `24/32 px`; radius `16 px`; footer gap `12 px` | Info, form, confirmation, destructive; loading/error | Mobile `calc(100% - 32px)` or bottom sheet |
| Drawer/Bottom Sheet | Drawer `420 px`; sheet max `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide | Full width below `480 px`; bottom safe area |
| Toast/Inline Message | Toast `360 px`; padding `16 px`; icon `20 px`; inline padding `12 px` | Success, warning, error, info; optional actions | Mobile width `calc(100% - 32px)` |
| Breadcrumb/Pagination/Stepper | Breadcrumb `32 px`; pagination target `44 px`; step node `28 px` | Full/collapsed; first/middle/last; current/complete/error | Collapse deep paths; compact checkout labels |
| Product Card | Desktop `282 px`; mobile `173 px`; image `4:5`; content gap `10 px`; swatch `24 px`; radius `8 px` | Regular, sale, new, low/out stock, loading; swatches/second image | Four desktop, three filtered, two mobile; title two lines |
| Media Gallery | Main image `4:5`; thumbnail `72 × 90 px`; gap `10 px`; zoom target `44 px` | Image, video-ready, zoom, loading, failed | Thumbnail rail desktop; swipe gallery mobile |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wraps without page overflow; guide sheet on mobile |
| Cart Item | Image `112 × 140 px` desktop, `88 × 110 px` mobile; quantity `112 × 40 px`; padding `16 px` | Default, updating, removed, stock conflict, price change, error | Actions stack below metadata on mobile |
| Order Summary | Width `384 px`; padding `24 px`; row gap `12 px`; CTA `52 px` | Default, recalculating, coupon success/error, quote expired | Full width mobile; sticky CTA where specified |
| Address/Shipping/Payment | Minimum `88 px`; padding `16 px`; radio `20 px`; text gap `4 px` | Default, hover, selected, disabled, unavailable, error | Full-width stack; explicit radio and label selection |
| Data Table | Header `48 px`; rows `48/56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Converts to labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; two-column fields; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color | One-column below `768 px`; contained matrix scroll |

### 9.3 Realistic Persian UI content set

```text
Navigation: زنانه، مردانه، بچگانه، اکسسوری، جدیدترین‌ها، پرفروش‌ها، تخفیف
Campaign: لباس‌های روزمره، انتخاب دقیق — کالکشن تازه فصل
Women product: شومیز نخی زنانه سارا — سفید شیری — ۱٬۳۹۰٬۰۰۰ تومان
Men product: شلوار کتان راسته مردانه — خاکی — ۱٬۶۹۰٬۰۰۰ تومان
Children product: ژاکت بافت کودک — آبی روشن — ۱٬۱۹۰٬۰۰۰ تومان
Actions: افزودن به سبد خرید، انتخاب اندازه، مشاهده راهنمای اندازه، مشاهده همه
Search: جست‌وجوی محصول یا دسته… / نتیجه‌ای پیدا نشد؛ فیلترها را حذف کنید.
Stock: موجود / موجودی محدود / این اندازه ناموجود است
Delivery: تحویل در تهران بین ۲ تا ۴ روز کاری
Returns: مرجوعی تا ۷ روز طبق شرایط کالا
Checkout: نشانی تحویل، روش ارسال، پرداخت، بررسی و ثبت سفارش
Errors: لطفاً اندازه را انتخاب کنید. / پرداخت ناموفق بود. / موجودی سبد خرید تغییر کرده است.
Order: سفارش ثبت شد، پرداخت شد، در حال آماده‌سازی، ارسال شد، تحویل داده شد
Admin: محصولات، دسته‌بندی‌ها، موجودی، سفارش‌ها، پرداخت‌ها، تخفیف‌ها، مشتریان، محتوا
```

## 10. Storefront pages

| Page | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Home | `1200 × 600 px` hero; four `282 × 376 px` category cards; four-card new arrivals; `588 + 588 px` editorial split; best sellers; trust; guide; footer | `358 × 448 px` hero; two `173 × 230 px` category cards; two `173 px` products; `64 px` section spacing | Campaign, no campaign, loading, slow image, error |
| Category landing | Intro, subcategories, four-card products, guide, delivery/returns trust, concise and expanded SEO copy | Portrait hero, two-column subcategories, products, expandable copy | Women, men, children, empty campaign |
| Product listing | Breadcrumb; heading/count; `282 px` filter rail; `894 px` three-card grid; sort; applied chips; pagination | Two-column grid; `52 px` sticky filter/sort; `90%` bottom sheet | Default, filtered, sale, no results, loading, error |
| Search | `640–720 px` overlay with recent/popular/category/product results; full page | Full-screen overlay with sticky `48 px` field | Closed, focused, typing, typo, no result, loading, error |
| Product detail | `588 + 24 + 588 px`; thumbnail rail `72 px`; sticky info; price, swatches, size, fit, stock, delivery, CTA, returns | `390 px` gallery; `16 px` padding; size sheet; `72 px` sticky purchase bar | Variant empty/selected, size error, low/out stock, sale, zoom, added, price change |
| Cart drawer | `420 px`; scrollable items; fixed subtotal and CTA | Full-width sheet | Empty, quantity update, remove, stock conflict, price change, loading, error |
| Cart page | `792 px` items plus `384 px` summary, `24 px` gap | One column; summary below items; sticky CTA | Empty, coupon states, unavailable item |
| Authentication | Centered `440 px` panel with optional quiet brand panel | Full-height one-column form | Guest, login, invalid, expired, rate limit, network error |
| Checkout address | `792 px` forms/cards plus `384 px` sticky summary | One column and sticky CTA | Saved/new, validation, unsupported region, save error |
| Checkout shipping | Selectable carrier/ETA/price cards | Stacked cards | Quote loading, selected, unavailable, expired |
| Checkout payment | Gateway cards and final total | Stacked methods and sticky CTA | Processing, redirect, success, failed, cancelled, timeout, pending |
| Confirmation | Quiet receipt, paid status, references, ETA, actions | Stacked receipt | Paid, pending, guest invitation |
| Tracking | Horizontal-to-vertical labeled timeline | Vertical timeline | Preparing, shipped, delayed, delivered, cancelled |

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

Admin uses `240 px` sidebar, `64 px` topbar, `32 px` padding, `48 px` dense rows, and `56 px` comfortable rows.

Required pages:

- Login and MFA-ready verification.
- Dashboard.
- Products list and product create/edit.
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

The clothing editor includes audience, type, season, material, care, fit, size system, colors, model measurements, media, stock, shipping values, Persian SEO metadata, draft, preview, publish, and archive.

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

This appendix instantiates the shared deterministic Figma contract in the root [README](../../../README.md). Every frame uses the `QG` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

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

Each row below represents an individual frame even where IDs are grouped. Every row inherits the complete baseline from the root [shared page and state matrix](../../../README.md#shared-page-and-state-matrix); the state cell lists direction-specific or visually emphasized states and is additive, never a replacement. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Direction-specific / emphasized states (plus full root baseline) |
| --- | --- | --- | --- |
| `HOME` | 1200 px hero, four 282 px category cards, four-card new-arrival rail, 588 px editorial split, best sellers, trust, guide, footer | 358 px hero, two 173 px category cards, two-column products, 64 px section spacing, horizontal guide rail | Campaign, no campaign, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Intro, subcategories, four-card product rail, guide, delivery/returns trust, concise/expanded SEO copy | Portrait header, two-column subcategories/products, expandable copy | Default, campaign off, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 282 px filter rail, three 282 px cards, result count, applied chips, sort, pagination | Two-column grid, sticky filter/sort, 90% height sheet | Default, filtered, sale, no results, loading, error, offline |
| `SEARCH` | 640–720 px overlay, recent/popular/category/product groups, full results page | Full-screen surface with sticky 48 px field and grouped results | Closed, focused, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 588+24+588 composition, 72 px thumbnails, sticky information, price/swatch/size/fit/stock/delivery/returns/details/reviews | Swipe gallery, 16 px information padding, size-guide sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 420 px drawer; full cart uses 792 px items plus 384 px summary | Full-width sheet; one-column cart with summary below items and sticky CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 440 px centered panel with quiet brand panel; guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | `792+384` two-column flow; clear 3-step indicator; restrained surfaces | One-column step panels; sticky next/pay CTA; selectable methods stack | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | Quiet receipt with paid status, references, ETA, and horizontal labeled timeline | Stacked receipt and vertical timeline | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
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
| `HOME` | `Hero(120,148,1200,600)` → `CategoryCards(120,780,1200,376)` → `NewArrivals(120,1204,1200,510)` → `EditorialSplit(120,1762,1200,420)` → `BestSellers(120,2230,1200,510)` → `TrustGuide(120,2788,1200,320)` → `Footer(120,3156,1200,280)` | `Hero(16,84,358,448)` → `CategoryCards(16,564,358,230)` → `Products(16,826,358,420)` → `EditorialRail(16,1278,358,300)` → `TrustGuide(16,1610,358,260)` → `Footer(16,1902,358,320)` |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | `Intro(120,148,1200,180)` → `Subcategories(120,352,1200,224)` → `Products(120,600,1200,510)` → `GuideTrust(120,1158,1200,320)` → `SEOCopy(120,1526,1200,360)` | `PortraitHeader(16,84,358,360)` → `Subcategories(16,476,358,220)` → `Products(16,728,358,420)` → `GuideSEO(16,1180,358,360)` |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | `Toolbar(120,148,1200,96)` → `FilterRail(120,268,282,620)` + `ProductGrid(426,268,894,620)`; card rows are `282×510`, row gap `24` | `FilterSortBar(16,84,358,52)` → `ProductGrid(16,160,358,900)`; cards are `173×420`; filter sheet `16,84,358,756` |
| `SEARCH` | `SearchOverlay(360,148,720,600)` → `SearchResults(120,792,1200,620)` | `SearchSurface(0,84,390,760)` with field `16,84,358,48` and results `16,148,358,696` |
| `PDP` | `Gallery(120,148,588,900)` + `PurchaseInfo(732,148,588,760)` → `DetailsReviews(120,1072,1200,420)` → `RelatedProducts(120,1516,1200,510)` | `Gallery(16,84,358,448)` → `PurchaseInfo(16,564,358,650)` → `DetailsReviews(16,1238,358,420)` → `RelatedProducts(16,1682,358,420)`; purchase bar `0,772,390,72` |
| `CART_DRAWER`, `CART` | Drawer `1020,0,420,900`; cart page `Items(120,148,792,720)` + `Summary(936,148,384,640)` | Sheet `0,84,390,760`; cart page `Items(16,84,358,620)` → `Summary(16,736,358,360)`; sticky CTA `16,740,358,52` |
| `AUTH`, `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Auth `Panel(500,188,440,560)`; checkout `Form(120,148,792,680)` + `Summary(936,148,384,640)` and stepper `120,108,792,32` | Auth `Form(16,84,358,650)`; checkout `Step(16,84,358,620)` → `Summary(16,728,358,300)`; sticky CTA `16,772,358,52` |
| `CONFIRMATION`, `TRACKING` | `Receipt(120,148,792,560)` + `NextSteps(936,148,384,320)`; timeline `120,732,1200,220` | `Receipt(16,84,358,420)` → `NextSteps(16,536,358,240)` → `Timeline(16,804,358,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountNav(120,148,282,620)` + `AccountContent(426,148,894,720)`; 24 px section gaps | `AccountSummary(16,84,358,120)` → `DestinationList(16,228,358,360)` → `AccountContent(16,612,358,620)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `AccountNav(120,148,282,620)` + `SupportContent(426,148,894,720)`; first control row `h=96` | `Summary(16,84,358,120)` → `SearchOrControls(16,228,358,104)` → `AccordionContent(16,356,358,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHeader(120,148,1200,420)` → `ReadingMeasure(360,592,720,920)` → `ProductReferences(120,1536,1200,510)` | `StoryHeader(16,84,358,320)` → `ReadingMeasure(16,436,358,980)` → `ProductRail(16,1440,358,420)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(120,148,1200,180)` → `ReadingMeasure(360,364,720,920)` → `RelatedOrContact(120,1316,1200,300)` | `DocumentHeader(16,84,358,160)` → `ReadingMeasure(16,268,358,980)` → `RelatedOrContact(16,1280,358,320)` |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | `Message(480,288,480,300)` with action `520,504,400,52` | `Message(16,208,358,300)` with action `16,536,358,52` |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | `AdminSidebar(0,0,240,900)` + `AdminTopbar(240,0,1200,64)` + `Dashboard(272,96,1136,720)` | `AdminTopbar(0,0,390,56)` + `DashboardCards(16,80,358,720)` |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | `AdminSidebar(0,0,240,900)` + `FilterBar(272,96,1136,56)` + `DataTable(272,176,1136,620)` | `AdminTopbar(0,0,390,56)` + `FilterBar(16,80,358,52)` + `PriorityCards(16,156,358,760)` |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | `AdminSidebar(0,0,240,900)` + `FormHeader(272,96,1136,64)` + `FormSections(272,184,760,640)` + `Preview(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `FormSections(16,80,358,980)` + sticky save bar `16,772,358,52` |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | `AdminSidebar(0,0,240,900)` + `QueueOrDetail(272,96,760,720)` + `EventsOrSummary(1056,96,352,720)` | `AdminTopbar(0,0,390,56)` + `QueueOrDetail(16,80,358,840)` |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | `AdminSidebar(0,0,240,900)` + `SectionHeader(272,96,1136,64)` + `PrimaryPanel(272,184,760,640)` + `SecondaryPanel(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `SectionNav(16,80,358,52)` + `PrimaryPanel(16,156,358,820)` |

### 16.3 Direction-specific component property values

The property names come from the root contract; these are the QUIET GRID defaults and overrides:

| Component | QUIET GRID value |
| --- | --- |
| `Button` | `primary=forest/700`, `hover=forest/800`, `pressed=forest/900`, radius `8`, purchase height `52`; no elevation on default |
| `ProductCard` | `imageRatio=4:5`, desktop `w=282`, mobile `w=173`, title `maxLines=2`, `showSwatches=true`, `showSecondImage=false` by default |
| `EditorialRail` | `layout=equalSplit`, `columns=2`, desktop `588+24+588`, mobile `horizontalScroll=true`, editorial accents use `clay/700` only |
| `MediaGallery` | `thumbnail=72×90`, `gap=10`, `zoom=true`, `state=ready\|loading\|failed`; no shadow on product media |
| `PriceBlock` | `Vazirmatn 700`, primary text `ink/950`, sale `clay/700` plus label/icon, currency suffix `تومان` |
| `FilterBar` | `railWidth=282`, `sectionGap=16`, `appliedChipHeight=36`, `mobilePresentation=sheet`, reset action always visible when filters exist |
| `Drawer/Sheet` | Drawer `w=420`; sheet max `90vh`; paper surface; forest CTA; focus return to trigger |
| `Admin` | Paper surfaces, forest actions, clay only for sale/editorial emphasis; no shadow used to communicate status |

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

- Hero source: minimum `2400×1200` desktop and `1080×1350` mobile; use a declared crop/focal point and preserve the quiet grid around copy.
- Product master: minimum `1600×2000`, `4:5`, neutral background, center crop only when the asset record does not define a focal point.
- Category image: minimum `1200×1600`; preserve garment silhouette and audience context.
- Every asset record includes `assetId`, license/owner, source dimensions, crop/focal point, desktop/mobile variant, and Persian alt text.
- Every fixture records audience, product/category/content ID, title, price in toman, sale/regular price, color, size set, fit, material, care, inventory, delivery, returns, and alt text.
- Use the Section 9.3 fixture strings and test long titles, filter labels, prices, and empty-state copy at `360 px`.

### 16.6 Responsive and interaction rules

- At `1024 px`, collapse the admin sidebar to a 72 px rail and preserve the 12-column hierarchy until content no longer fits.
- At `768 px`, the PDP changes from `588+588` to stacked gallery/information; PLP filters move to a sheet; data tables expose priority columns/cards.
- At `390 px`, maintain two product columns, one-column forms, a sticky purchase/checkout action, and bottom navigation.
- At `360 px`, reduce gaps from `24` to `16` before reducing body text; no price, title, filter chip, or CTA may clip.
- Filter/sort changes update query parameters, reset pagination, and keep the selected audience. Cart and payment conflicts use a recoverable sheet.
- Comparison-friendly card geometry is invariant across campaigns; editorial content may add context but may not change card anatomy.

### 16.7 Handoff and approval checklist

For every `QG/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds, grid values, and tokens match this appendix;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- contrast is checked for forest, clay, paper, and every status alias;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of the handoff table.
