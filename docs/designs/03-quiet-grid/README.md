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
