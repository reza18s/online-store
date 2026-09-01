# 05 / FIELD NOTES

> Complete Figma design specification for a practical, content-led Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of five equal, complete design candidates for NOVA Store.

## 1. Direction

FIELD NOTES treats the store like a well-kept wardrobe journal: useful annotations, material and care knowledge, fit advice, understated imagery, and direct product recommendations. It helps customers make informed clothing decisions rather than chasing visual novelty.

The direction must feel:

- Practical, human, and trustworthy.
- Editorial but not luxurious or remote.
- Rich in useful clothing knowledge.
- Comfortable for family and repeat shopping.
- Structured like a field guide, without becoming visually rustic or nostalgic.

All storefront, checkout, account, content, and admin pages are required.

## 2. Audience and catalog

Primary navigation:

```text
زنانه / مردانه / بچگانه / اکسسوری / راهنمای انتخاب / تازه‌ها / تخفیف
```

Women, men, and children receive equal direct navigation and complete page templates. Field Notes gives each audience context-specific fit, fabric, care, and seasonal guidance.

Customer prices use toman, for example `۱٬۴۹۰٬۰۰۰ تومان`. SKU, coupon, payment, and tracking references remain isolated LTR strings.

## 3. Figma organization

Create top-level page `05 — FIELD NOTES` in the shared Figma file.

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
08 Guides, editorial, and utility
09 Admin desktop
10 Admin responsive
11 States and edge cases
12 Prototype flows
```

Use prefix `FN`, for example `FN/Guide/Desktop/Size` and `FN/Admin/Product/Desktop/Care`.

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide desktop | 1728 px | 1408 px | 12 | 160 px | 24 px |
| Primary desktop | 1440 px | 1200 px | 12 | 120 px | 24 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 24 px |
| Tablet | 768 px | 704 px | 8 | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Rules:

- Use visible column and rule alignment to create the field-guide character.
- Product cards stay consistent and comparison-friendly.
- Notes, guides, and callouts attach to the grid rather than floating randomly.
- Desktop product rails use four cards; filtered listing uses a `282 px` rail and three cards.
- Mobile listings use two cards; long-form guide and transactional pages use one column.

## 5. Color system

### 5.1 Primitive palette

| Token | Hex | Use |
| --- | --- | --- |
| `paper/0` | `#FFFFFF` | Raised surface |
| `paper/50` | `#F8F5EC` | Main paper canvas |
| `paper/100` | `#EFE9DB` | Secondary paper |
| `paper/200` | `#E2D8C5` | Selected surface |
| `graphite/950` | `#1B1C19` | Primary text |
| `graphite/800` | `#35362F` | Strong secondary |
| `graphite/600` | `#68685E` | Supporting text |
| `graphite/450` | `#67675E` | Metadata and placeholder |
| `rule/300` | `#C9C0AE` | Strong rule |
| `rule/200` | `#D9D0BF` | Default border |
| `rule/100` | `#E8E1D4` | Subtle rule |
| `olive/900` | `#35412E` | Pressed action |
| `olive/800` | `#44543B` | Hover action |
| `olive/700` | `#566A49` | Primary action |
| `olive/100` | `#E7ECDF` | Selected background |
| `rust/700` | `#9A4B31` | Sale/editorial emphasis |
| `rust/100` | `#F4E3DA` | Soft rust surface |
| `navy/700` | `#38516A` | Informational annotation |
| `navy/100` | `#E3EAF0` | Note surface |
| `success/700` | `#176B4D` | Success |
| `success/100` | `#E4F3EB` | Success surface |
| `warning/700` | `#8A5200` | Warning |
| `warning/100` | `#FFF2D8` | Warning surface |
| `error/700` | `#B42318` | Error |
| `error/100` | `#FDE8E7` | Error surface |
| `info/700` | `#385F8A` | Information |
| `info/100` | `#E3EAF0` | Information surface |

### 5.2 Semantic aliases

```text
color/bg/page              paper/50
color/bg/surface           paper/0
color/bg/subtle            paper/100
color/bg/selected          olive/100
color/text/primary         graphite/950
color/text/secondary       graphite/600
color/text/muted           graphite/450
color/border/default       rule/200
color/border/strong        rule/300
color/border/subtle        rule/100
color/action/primary       olive/700
color/action/primary-hover olive/800
color/action/primary-down  olive/900
color/promotion/rust       rust/700
color/note/navy            navy/700
```

Olive is the global action color. Rust marks sale or editorial emphasis. Navy is reserved for helpful notes and informational callouts. No color replaces a label or status icon.

## 6. Typography

- Persian heading and body family: `Vazirmatn`.
- Optional Persian section-marker family: `Estedad` at limited weights.
- Latin and technical annotation family: `IBM Plex Mono`.
- Weights: `400`, `500`, `600`, `700`.

| Style | Desktop | Mobile | Family/weight |
| --- | --- | --- | --- |
| `display/hero` | 50/66 px | 35/48 px | Vazirmatn 700 |
| `display/section` | 38/52 px | 28/40 px | Estedad 700 |
| `heading/h1` | 36/50 px | 28/40 px | Vazirmatn 700 |
| `heading/h2` | 29/43 px | 24/36 px | Vazirmatn 700 |
| `heading/h3` | 23/35 px | 20/32 px | Vazirmatn 600 |
| `body/lg` | 18/34 px | 17/32 px | Vazirmatn 400 |
| `body/md` | 16/30 px | 16/30 px | Vazirmatn 400 |
| `body/sm` | 14/25 px | 14/25 px | Vazirmatn 400 |
| `label/md` | 14/23 px | 14/23 px | Vazirmatn 600 |
| `caption` | 12/21 px | 12/21 px | Vazirmatn 400 |
| `annotation` | 12/20 px | 12/20 px | IBM Plex Mono 500 |
| `price/lg` | 23/35 px | 21/33 px | Vazirmatn 700 |

Annotations are supporting content only. Critical actions, errors, prices, and garment titles remain in the main Persian family.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120 px`.

Radius:

- `0 px`: image frames, tables, guide rules.
- `4 px`: badges and small controls.
- `6 px`: product cards.
- `8 px`: buttons and inputs.
- `12 px`: panels and drawers.
- `16 px`: dialogs and empty states.
- `999 px`: chips and avatars.

Effects:

- Default cards use borders, not shadows.
- Hover card: `0 5 16 rgba(27,28,25,0.08)`.
- Dropdown: `0 10 28 rgba(27,28,25,0.12)`.
- Drawer: `0 18 52 rgba(27,28,25,0.18)`.
- Focus: paper `2 px` separation plus `2 px #566A49`.

Motion:

- Controls: `140 ms`.
- Accordion: `180 ms`.
- Media crossfade: `200 ms`.
- Drawer: `240 ms`.
- Reduced motion removes all positional animation.

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
- Header: `72 px`.
- Category navigation: `46 px`.
- Optional guide/navigation strip: `36 px` on editorial routes only.
- Sticky header: `64 px`.
- Search overlay: `680 px`.
- Footer: four columns plus a guide/newsletter area.

Mobile:

- Announcement: `28 px`.
- Header: `56 px`.
- Search row: `52 px`.
- Bottom navigation: `64 px` plus safe area.
- Full-height navigation drawer with direct women, men, and children destinations.

## 9. Component inventory

Primitive components: `Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Commerce/content components: `Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Category Card`, `Field Note`, `Guide Card`, `Material Tag`, `Care Symbol Row`, `Fit Note`, `Product Card`, `Compact Product Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, and `Recently Viewed`.

Admin components: `Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

Every component uses Auto Layout, variables, text/effect styles, and documented properties. Default field height is `48 px`, admin compact field `40 px`, standard button `44 px`, purchase CTA `52 px`, and minimum target `44 × 44 px`.

### 9.1 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `olive/700` | `olive/700` | `paper/0` | No shadow |
| Hover primary | `olive/800` | `olive/800` | `paper/0` | `140 ms` transition |
| Pressed primary | `olive/900` | `olive/900` | `paper/0` | No scale animation |
| Focus | Existing fill | Paper separation plus `olive/700` | Existing text | Two-ring focus outside bounds |
| Disabled | `paper/100` | `rule/100` | `graphite/450` | Explicit unavailable state |
| Loading | Originating state | Originating state | Spinner plus preserved label | Prevent repeat action |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.2 Construction-level component contracts

| Component | Anatomy and measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; padding `12/16/24 px`; icon `16/20 px`; gap `8 px`; radius `8 px` | Primary, Secondary, Outline, Ghost, Destructive; sizes; icon slots; all states | Purchase CTA fills mobile width; ordinary buttons hug content |
| Icon Button | `36/44/52 px` square; icon `18/20/24 px`; radius `8 px` | Ghost, Surface, Outline; tooltip/accessibility label | Minimum `44 px` on customer mobile |
| Text/Phone Field | Height `48 px`; padding `14 px`; label gap `8 px`; icon `20 px`; helper gap `6 px` | Empty, filled, focus, disabled, error, success; prefix/suffix | Full mobile width; phone value isolated LTR |
| Search Field | Height `48 px`; icon `20 px`; clear target `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | `680 px` desktop overlay; full-screen mobile |
| Select | Trigger `48 px`; item `44 px`; menu padding `8 px`; chevron `20 px` | Placeholder, selected, open, disabled, error; single/multiple | Filter selections use bottom sheet on mobile |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed, focus, disabled, error | Clickable row minimum `44 px` |
| Tabs/Chip/Badge | Tab `44 px`; chip `36 px`; badge `24 px`; padding `12/10/8 px` | Active, inactive, focus, disabled; removable/status variants | Tabs scroll with visible continuation cue |
| Dialog | Width `480/640 px`; padding `24/32 px`; radius `16 px`; footer gap `12 px` | Info, form, confirmation, destructive; loading/error | Mobile `calc(100% - 32px)` or bottom sheet |
| Drawer/Bottom Sheet | Drawer `420 px`; sheet max `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide | Full width below `480 px`; safe-area padding |
| Toast/Inline Message | Toast `360 px`; padding `16 px`; icon `20 px`; inline padding `12 px` | Success, warning, error, info; optional actions | Mobile width `calc(100% - 32px)` |
| Breadcrumb/Pagination/Stepper | Breadcrumb `32 px`; pagination target `44 px`; step node `28 px` | Full/collapsed; first/middle/last; current/complete/error | Collapse deep paths; compact checkout labels |
| Product Card | Desktop `282–300 px`; mobile `173 px`; image `4:5`; content gap `10 px`; radius `6 px`; annotation gap `8 px` | Regular, sale, new, low/out stock, loading; swatches/notes | Four desktop, three filtered, two mobile; notes never hide price |
| Field Note/Guide Card | Note padding `16 px`; rule `1 px`; icon `20 px`; guide image `3:2`; text measure max `520 px` | Material, fit, care, delivery, editorial; compact/expanded | Collapses to accordion or stacked card on mobile |
| Media Gallery | Main `4:5`; thumbnail `72 × 90 px`; detail image minimum `240 px`; zoom target `44 px` | Image, detail, video-ready, zoom, loading, failed | Thumbnail rail desktop; swipe gallery mobile |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wraps without page overflow; guide sheet mobile |
| Cart Item | Image `112 × 140 px` desktop, `88 × 110 px` mobile; quantity `112 × 40 px`; padding `16 px` | Default, updating, removed, stock conflict, price change, error | Stack actions below metadata on mobile |
| Order Summary | Width `384 px`; padding `24 px`; row gap `12 px`; CTA `52 px` | Default, recalculating, coupon success/error, quote expired | Full width mobile; sticky CTA where specified |
| Address/Shipping/Payment | Minimum `88 px`; padding `16 px`; radio `20 px`; text gap `4 px` | Default, hover, selected, disabled, unavailable, error | Full-width stack; explicit radio/label selection |
| Data Table | Header `48 px`; rows `48/56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Becomes labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; two-column fields; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color | One-column below `768 px`; contained matrix scroll |

### 9.3 Realistic Persian UI content set

```text
Navigation: زنانه، مردانه، بچگانه، اکسسوری، راهنمای انتخاب، تازه‌ها، تخفیف
Campaign: راهنمای پوشش فصل — پارچه‌هایی برای هوای متغیر
Women product: پیراهن کتان زنانه مهتاب — آجری — ۱٬۹۹۰٬۰۰۰ تومان
Men product: کت کار مردانه دماوند — زیتونی — ۲٬۷۹۰٬۰۰۰ تومان
Children product: تی‌شرت پنبه‌ای کودک — سفید و سرمه‌ای — ۷۹۰٬۰۰۰ تومان
Actions: افزودن به سبد، انتخاب اندازه، درباره پارچه، روش نگهداری، مشاهده راهنما
Search: محصول، پارچه یا راهنما را جست‌وجو کنید… / نتیجه‌ای نبود؛ راهنمای انتخاب را ببینید.
Stock: موجود و آماده ارسال / موجودی محدود / این اندازه فعلاً موجود نیست
Notes: پارچه تنفس‌پذیر / مناسب استفاده روزمره / شست‌وشو با آب سرد
Checkout: نشانی تحویل، روش ارسال، پرداخت، مرور سفارش
Errors: اندازه را انتخاب کنید. / پرداخت کامل نشد. / اتصال برقرار نشد؛ اطلاعات شما حفظ شده است.
Order: سفارش ثبت شد، در حال آماده‌سازی، ارسال شد، تحویل داده شد
Admin: محصولات، راهنماها، موجودی، سفارش‌ها، پرداخت‌ها، مشتریان، محتوا، گزارش تغییرات
```

## 10. Storefront pages

| Page | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Home | `1200 × 620 px` hero with annotated garment/story; three audience panels; new arrivals; material guide; four-card product rails; care/style article; trust; footer | `358 × 450 px` hero; three audience cards; two-column products; swipeable guide notes | Campaign, no campaign, loading, slow image, error |
| Category landing | Category intro, subcategories, product grid, season note, fit/material guide, editorial links, SEO copy | Portrait header, two-column category/products, expandable notes | Women, men, children, campaign off |
| Product listing | `282 px` filter rail plus three-card grid; material, fit, size, color, price, stock filters | Two-column grid; sticky filter/sort; bottom sheet | Default, filtered, sale, no result, loading, error |
| Search | `680 px` overlay with recent, categories, products, and guides | Full-screen search | Recent, popular, typing, typo, no result, loading, error |
| Product detail | `672 px` gallery plus `504 px` sticky information; material/fit/care notes integrated after purchasing essentials | `4:5` gallery; `16 px` info; size sheet; sticky purchase bar | Variant empty/selected, size error, low/out stock, sale, zoom, added, price change |
| Cart drawer | `420 px` drawer with practical stock/delivery notes | Full-width sheet | Empty, conflict, price change, loading, error |
| Cart page | `792 px` items plus `384 px` summary, `24 px` gap | One column; sticky CTA | Empty, coupon states, unavailable item |
| Authentication | `440 px` form with concise trust note | Full-height form | Guest, login, invalid, expired, rate limit, error |
| Checkout address | `792 + 384 px` structured field layout | One column | Saved/new, validation, unsupported region, save error |
| Checkout shipping | Carrier cards with cost/ETA and plain-language notes | Stacked cards | Loading, selected, unavailable, expired |
| Checkout payment | Gateway cards, final total, clear retry information | Stacked methods and sticky CTA | Processing, redirect, failed, cancelled, timeout, pending |
| Confirmation | Receipt plus “what happens next” field note | Stacked receipt | Paid, pending, guest invitation |
| Tracking | Clear order timeline plus exception guidance | Vertical timeline | Preparing, shipped, delayed, delivered, cancelled |

Imagery:

- Product master: at least `1600 × 2000 px`.
- Desktop hero: `2400 × 1240 px`.
- Mobile hero: `1080 × 1350 px`.
- Category: `1200 × 1600 px`.
- Detail photography must show texture, weave, stitching, closure, and care-relevant construction where useful.
- Notes may annotate imagery only when they do not obscure the garment.

## 11. Account, support, content, and utility

Desktop account uses `282 px` navigation and `894 px` content. Required pages:

- Account dashboard.
- Profile and consent preferences.
- Addresses.
- Orders and order detail.
- Support and searchable FAQ.
- Security/session page.
- Notification preferences.
- Campaign landing.
- Buying guide.
- Lookbook.
- Editorial article.
- Material library.
- Fit and size guide.
- Garment-care guide.
- About, trust, shipping, returns, FAQ, contact, privacy, and terms.
- `404`, offline, and maintenance.

Long-form content uses a reading measure of `640–720 px`, line height of at least `1.7`, visible table-of-contents navigation on desktop, and related-product modules that do not interrupt every paragraph.

P1 covers wishlist, back-in-stock, returns, store credit, referrals, reviews, product comparison, and product questions.

## 12. Admin pages

Admin uses `240 px` sidebar, `64 px` topbar, `32 px` padding, `48 px` dense rows, and `56 px` comfortable rows.

Required pages:

- Login and MFA-ready verification.
- Dashboard.
- Products list and product create/edit.
- Size × color variants.
- Media and detail-image management.
- Women/men/children categories.
- Materials and care vocabulary where the data model permits.
- Inventory and movements.
- Orders and order detail.
- Payment attempts and webhook inspection.
- Promotions and coupons.
- Customer lookup and protected detail.
- Guide, campaign, and SEO content management.
- Audit log.
- Notification retry and operational status.

Product editing includes audience, garment type, season, material composition, care instructions, fit, size system, colors, model measurements, detail photography, stock, shipping, Persian SEO, draft, preview, publish, and archive.

At `1024 px`, collapse the sidebar. At `768/390 px`, order and content workflows become cards. Long forms retain section navigation and unsaved-change protection.

## 13. RTL, accessibility, and states

- Set `fa-IR` and RTL at document level.
- Use logical start/end properties.
- Isolate Latin and numeric references as LTR.
- Validate breadcrumbs, sliders, carousels, pagination, steppers, and timelines.
- Minimum target is `44 × 44 px`; mobile form text is at least `16 px`.
- Swatches expose Persian names; unavailable sizes expose state text.
- Care symbols include text alternatives.
- Notes and annotations meet body-text contrast requirements.
- Errors include summary and field detail.
- Dialog focus trap, Escape, close, and focus return are documented.
- Loading, empty, error, slow-network, offline, disabled, success, stock-conflict, and payment-conflict states are required.

## 14. Prototype flows

Customer:

1. Home → women → fit guide → PLP → PDP.
2. Home → men → material guide → product → cart.
3. Home → children → age/size guide → filtered listing → product.
4. Cart → guest checkout → address → shipping → payment → confirmation.
5. Payment failure → retry → pending → success.
6. Search question → guide → recommended product.
7. Confirmation → tracking → delay → support.
8. Account → orders → detail.

Admin:

1. Create garment → material/care data → media → variants → publish.
2. Publish size guide → associate products → preview.
3. Low stock → adjustment → audit.
4. New order → paid → preparing → shipped.
5. Payment mismatch → verification.

## 15. Completion criteria

- Every required customer and admin page exists at `1440 px` and `390 px`.
- PLP, PDP, cart, checkout, account order detail, admin product edit, and admin order detail exist at `768 px`.
- `360 px` QA passes without clipping or horizontal scroll.
- Women, men, and children appear throughout navigation, pages, guides, mock data, and admin taxonomy.
- All customer prices use toman.
- Components use Auto Layout, variables, styles, and documented properties.
- Material, care, fit, and sizing content supports rather than obscures conversion.
- Core customer and admin prototypes work.
- RTL, keyboard, focus, contrast, reduced motion, and state coverage pass.
- Screenshot comparison finds no annotation overlap, weak hierarchy, crop errors, or responsive drift.

## 16. Construction appendix

This appendix instantiates the shared deterministic Figma contract in the root [README](../../../README.md). Every frame uses the `FN` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

### 16.1 Frame matrix and coordinate anchors

| Frame family | Desktop | Tablet | Mobile | Narrow QA |
| --- | --- | --- | --- | --- |
| Storefront shell | `1440 × 900`, content `x=120,w=1200`, 12 columns, 24 px gutter | `768 × 1024`, content `x=32,w=704`, 8 columns, 16 px gutter | `390 × 844`, content `x=16,w=358`, 4 columns, 12 px gutter | `360 × 800`, content `x=16,w=328` |
| Account shell | `1440 × 900`, nav `x=120,w=282`, gap `24`, content `w=894` | `768 × 1024`, nav becomes a summary row, content `w=704` | `390 × 844`, stacked destination list and one-column content | `360 × 800`, same stack with 16 px side padding |
| Admin shell | `1440 × 900`, sidebar `240`, topbar `64`, content padding `32` | `768 × 1024`, sidebar hidden, card workflows | `390 × 844`, cards and sticky save/action bar | `360 × 800`, no table overflow |

Use these top-level coordinates in every primary frame:

| Screen | Desktop coordinate anchors | Mobile coordinate anchors |
| --- | --- | --- |
| Shell | Announcement `y=0,h=32`; header `y=32,h=72`; category nav `y=104,h=46`; optional guide strip `h=36` on editorial routes; content starts `y=150` or `186` | Announcement `h=28`; header `h=56`; content starts `y=84`; bottom nav fixed `h=64` plus safe area |
| `HOME` | Hero `x=120,y=150,w=1200,h=620`; three audience panels; four-card product rails; guide note block; section gaps `48` | Hero `x=16,y=84,w=358,h=450`; three audience cards; two-column products; swipeable guide notes |
| `PLP_*` | Filter rail `x=120,w=282`; gap `24`; product grid `x=426,w=894`, three columns of `282` with 24 px gutters | Sticky filter/sort bar `x=16,y=84,w=358,h=52`; two cards `w=173`; filters use a bottom sheet |
| `PDP` | Gallery `x=120,w=672`; gap `24`; info `x=816,w=504`; notes begin after purchase essentials | Gallery `x=16,y=84,w=358,aspect=4:5`; info padding `16`; fixed purchase bar `h=72` |
| `CART`/checkout | Items `x=120,w=792`; gap `24`; summary `x=936,w=384` | One-column content `x=16,w=358`; summary below items; sticky CTA above bottom navigation |
| Account | Nav `x=120,w=282`; gap `24`; content `x=426,w=894`; long-form reading measure `640–720` | Summary header `x=16,w=358`; stacked destinations and content |
| Admin | Sidebar `x=0,w=240`; topbar `y=0,h=64`; content `x=272,w=1136` | Topbar `h=56`; content padding `16`; order/content workflows become cards |

Frame names follow `FN/<Screen>/<Viewport>/<State>`, for example `FN/Guide/Desktop/Material`, `FN/PDP/Mobile/Care-Expanded`, and `FN/Admin/Content/Desktop/Preview`. Record the actual node URL beside each name after the Figma frame is created.

### 16.2 Screen-sheet map

Each row below represents an individual frame even where IDs are grouped. Every row inherits the complete baseline from the root [shared page and state matrix](../../../README.md#shared-page-and-state-matrix); the state cell lists direction-specific or visually emphasized states and is additive, never a replacement. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Direction-specific / emphasized states (plus full root baseline) |
| --- | --- | --- | --- |
| `HOME` | 1200 px annotated hero/story, three audience panels, new arrivals, material guide, four-card product rails, care/style article, trust, footer | 358 px hero, three audience cards, two-column products, swipeable guide notes | Campaign, no campaign, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Intro, subcategories, product grid, season note, fit/material guide, editorial links, SEO block | Portrait header, two-column subcategories/products, expandable notes | Default, campaign off, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 282 px filter rail, three-card grid, material/fit/size/color/price/stock filters, sort, pagination | Two-column grid, sticky filter/sort, bottom-sheet filters | Default, filtered, sale, no results, loading, error, offline |
| `SEARCH` | 680 px overlay with recent/category/product/guide groups and full results page | Full-screen search with sticky field and grouped results | Empty, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 672 px gallery, 504 px sticky info, purchase essentials first, material/fit/care notes afterward, reviews | Swipe gallery, 16 px info, size-guide sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 420 px practical drawer; full cart uses 792 px items plus 384 px summary | Full-width sheet; one-column cart with notes and sticky CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 440 px form with concise trust note; guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | `792+384` structured flow; plain-language carrier notes; clear retry information | One-column step panels; sticky next/pay CTA; method cards stack | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | Receipt plus “what happens next” field note, clear timeline, exception guidance | Stacked receipt and vertical timeline with support action | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | 282 px account navigation plus 894 px content; cards use 24 px gaps; order snapshots immutable | Summary header, stacked destinations, one-column forms/order details | Loading, empty orders/addresses, validation error, save success/error, permission error, offline |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | Searchable FAQ, support entry, session controls, preference groups | Accordion groups and full-width controls | Empty search, ticket submitted, session revoke success/error, preference save error |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | 640–720 px reading measure, 1200 px media/story modules, TOC, notes, related products | Single-column reading flow, collapsible TOC, swipe media, related rail after major sections | Published, scheduled, missing media, loading, unavailable, offline |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | Long-form reading surface with guide rules, callouts, tables where needed, 640–720 px measure | 358 px reading column, stacked accordions and tables converted to cards | Default, loading, error, offline, contact validation/success |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | Centered 480 px message with return/search/support action | Full-width 358 px message and one primary action | 404, offline cached shell, maintenance window |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | 240 px sidebar, 64 px topbar, stat cards, action queues, guide/content health | Sidebar hidden; cards and priority queue | Invalid, locked, rate-limited, MFA step, loading, permission error |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | Filter bar, 48/56 px rows, audience/category/status filters, bulk actions, material/care vocabulary | Priority columns become labeled cards; filters become a sheet | Loading, empty, request error, stock discrepancy, bulk-action success/error |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | Sectioned form, 2-column fields, 120 × 44 px matrix cells, crop/reorder panel, material/care fields | One-column sections; contained matrix scroll; sticky save bar | Draft, invalid, saving, saved, publish blocked, upload/crop failure |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | Queue tabs, immutable snapshots, payment/webhook timeline, internal notes, exception guidance | Queue/detail cards with labeled event rows | New/paid/preparing/shipped, payment mismatch, retry, webhook error, permission error |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | Guide/article/campaign block editor, restricted customer lookup/detail, preview, audit before/after, notification/media/payment health | Card sections with explicit section navigation and unsaved-change guard; PII stays permission-gated | Draft, scheduled, publish blocked, success, failure, no activity, service degraded, permission error |

### 16.2.1 Exact section-bound stacks

The values below use `x,y,width,height` in pixels in one full-page coordinate system. The `1440 × 900` and `390 × 844` viewports show the portion intersecting their recorded scroll offset; `Scroll-0` starts at `y=0`, and `Scroll-1` and later frames retain these coordinates while recording the new offset. Slash-separated IDs share this geometry but still receive separate Figma frames and node URLs.

| Screen IDs | Desktop section stack (`1440 × 900`) | Mobile section stack (`390 × 844`) |
| --- | --- | --- |
| `HOME` | `Hero(120,150,1200,620)` → `AudiencePanels(120,794,1200,260)` → `NewArrivals(120,1102,1200,510)` → `MaterialGuide(120,1660,1200,360)` → `CareArticle(120,2068,1200,420)` → `Trust(120,2532,1200,300)` → `Footer(120,2860,1200,280)` | `Hero(16,84,358,450)` → `AudienceCards(16,566,358,220)` → `Products(16,818,358,420)` → `GuideNotes(16,1270,358,360)` → `Trust(16,1662,358,260)` → `Footer(16,1954,358,320)` |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | `Intro(120,150,1200,180)` → `Subcategories(120,354,1200,224)` → `Products(120,602,1200,510)` → `FitMaterialGuide(120,1160,1200,360)` → `EditorialLinks(120,1564,1200,300)` → `SEOCopy(120,1888,1200,360)` | `PortraitHeader(16,84,358,360)` → `Subcategories(16,476,358,220)` → `Products(16,728,358,420)` → `GuideNotes(16,1180,358,420)` |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | `Toolbar(120,150,1200,96)` → `FilterRail(120,270,282,620)` + `ProductGrid(426,270,894,620)`; card rows are `282×510`, row gap `24` | `FilterSortBar(16,84,358,52)` → `ProductGrid(16,160,358,900)`; cards are `173×420`; filter sheet `16,84,358,756` |
| `SEARCH` | `SearchOverlay(380,150,680,600)` → `SearchResults(120,790,1200,620)` | `SearchSurface(0,84,390,760)` with field `16,84,358,48` and results `16,148,358,696` |
| `PDP` | `Gallery(120,150,672,900)` + `PurchaseInfo(816,150,504,760)` → `MaterialFitCare(120,1074,1200,420)` → `RelatedProducts(120,1518,1200,510)` | `Gallery(16,84,358,448)` → `PurchaseInfo(16,564,358,650)` → `MaterialFitCare(16,1238,358,520)` → `RelatedProducts(16,1782,358,420)`; purchase bar `0,772,390,72` |
| `CART_DRAWER`, `CART` | Drawer `1020,0,420,900`; cart page `Items(120,150,792,720)` + `Summary(936,150,384,640)` | Sheet `0,84,390,760`; cart page `Items(16,84,358,620)` → `Summary(16,736,358,360)`; sticky CTA `16,740,358,52` |
| `AUTH`, `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Auth `Panel(500,190,440,560)`; checkout `Form(120,150,792,680)` + `Summary(936,150,384,640)` and stepper `120,110,792,32` | Auth `Form(16,84,358,650)`; checkout `Step(16,84,358,620)` → `Summary(16,728,358,300)`; sticky CTA `16,772,358,52` |
| `CONFIRMATION`, `TRACKING` | `Receipt(120,150,792,560)` + `NextSteps(936,150,384,320)`; timeline `120,734,1200,220` | `Receipt(16,84,358,420)` → `NextSteps(16,536,358,240)` → `Timeline(16,804,358,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountNav(120,150,282,620)` + `AccountContent(426,150,894,720)`; guide notes and order snapshots use 24 px gaps | `AccountSummary(16,84,358,120)` → `DestinationList(16,228,358,360)` → `AccountContent(16,612,358,620)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `AccountNav(120,150,282,620)` + `SupportContent(426,150,894,720)`; FAQ/search controls first `96 px` | `Summary(16,84,358,120)` → `SearchOrControls(16,228,358,104)` → `AccordionContent(16,356,358,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHeader(120,150,1200,420)` → `TOC(120,594,282,520)` + `ReadingMeasure(426,594,720,920)` → `ProductReferences(120,1538,1200,510)` | `StoryHeader(16,84,358,320)` → `TOC(16,436,358,160)` → `ReadingMeasure(16,620,358,980)` → `ProductRail(16,1640,358,420)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(120,150,1200,180)` → `ReadingMeasure(360,366,720,920)` → `RelatedOrContact(120,1310,1200,300)` | `DocumentHeader(16,84,358,160)` → `ReadingMeasure(16,268,358,980)` → `RelatedOrContact(16,1280,358,320)` |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | `Message(480,290,480,300)` with action `520,506,400,52` | `Message(16,210,358,300)` with action `16,538,358,52` |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | `AdminSidebar(0,0,240,900)` + `AdminTopbar(240,0,1200,64)` + `Dashboard(272,96,1136,720)` | `AdminTopbar(0,0,390,56)` + `DashboardCards(16,80,358,720)` |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | `AdminSidebar(0,0,240,900)` + `FilterBar(272,96,1136,56)` + `DataTable(272,176,1136,620)` | `AdminTopbar(0,0,390,56)` + `FilterBar(16,80,358,52)` + `PriorityCards(16,156,358,760)` |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | `AdminSidebar(0,0,240,900)` + `FormHeader(272,96,1136,64)` + `FormSections(272,184,760,640)` + `Preview(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `FormSections(16,80,358,980)` + sticky save bar `16,772,358,52` |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | `AdminSidebar(0,0,240,900)` + `QueueOrDetail(272,96,760,720)` + `EventsOrSummary(1056,96,352,720)` | `AdminTopbar(0,0,390,56)` + `QueueOrDetail(16,80,358,840)` |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | `AdminSidebar(0,0,240,900)` + `SectionHeader(272,96,1136,64)` + `PrimaryPanel(272,184,760,640)` + `SecondaryPanel(1056,184,352,640)` | `AdminTopbar(0,0,390,56)` + `SectionNav(16,80,358,52)` + `PrimaryPanel(16,156,358,820)` |

### 16.3 Direction-specific component property values

The property names come from the root contract; these are the FIELD NOTES defaults and overrides:

| Component | FIELD NOTES value |
| --- | --- |
| `Button` | `primary=olive/700`, `hover=olive/800`, `pressed=olive/900`, radius `8`, purchase height `52` |
| `FieldNote` | `type=material\|fit\|care\|delivery\|editorial`, `mode=compact\|expanded`, padding `16`, rule `1 px`, icon `20` |
| `GuideCard` | `imageRatio=3:2`, `textMeasure=520`, `mode=compact\|expanded`, `relatedProducts=0\|1\|many` |
| `ProductCard` | `imageRatio=4:5`, desktop `w=282–300`, mobile `w=173`, title `maxLines=2`, `showNotes=true`, `showSwatches=true` |
| `MediaGallery` | `thumbnail=72×90`, detail image minimum `240`, `zoom=true`, `state=ready\|loading\|failed`, annotations never cover the garment |
| `PriceBlock` | `Vazirmatn 700`, primary text `graphite/950`, sale `rust/700` plus label/icon, currency suffix `تومان` |
| `CareSymbolRow` | `symbolCount=1..6`, `textAlternative=true`, `direction=rtl`, unavailable symbol uses label rather than opacity only |
| `Drawer/Sheet` | Drawer `w=420`; sheet max `90vh`; paper surface; olive CTA; focus return to trigger |
| `Admin` | Paper surfaces, olive actions, rust sale/editorial emphasis, navy informational notes; no color-only status |

### 16.4 State and Persian copy fixtures

Use these state fixtures consistently in frames and prototypes:

| State | Required visible copy/action |
| --- | --- |
| Loading | Skeletons preserve final card and guide heights; annotations are not shown as broken placeholders |
| Empty PLP | `محصولی مطابق این فیلتر پیدا نشد` / `حذف فیلترها` |
| Offline | `ارتباط برقرار نشد؛ اطلاعات ذخیره‌شده را می‌بینید.` / `تلاش دوباره` |
| PDP size error | `لطفاً اندازه را انتخاب کنید.`; focus moves to the size group |
| Stock conflict | `موجودی این کالا تغییر کرده است.` / `به‌روزرسانی سبد` |
| Price change | `قیمت این کالا تغییر کرده است.` / `مشاهده قیمت جدید` |
| Payment failure | `پرداخت کامل نشد.` / `تلاش دوباره` / `پشتیبانی` |
| Guide missing | `این راهنما موقتاً در دسترس نیست.` / `مشاهده محصولات` |
| Success | `به سبد خرید اضافه شد` or `راهنما منتشر شد`; include icon, label, and next action |

### 16.5 Content, annotation, and asset rules

- Every guide/article/campaign uses a typed block list: `intro`, `heading`, `paragraph`, `image`, `fieldNote`, `measurementTable`, `careSymbols`, `productRail`, `callout`, `faq`, and `cta`.
- Each block records `blockId`, order, visibility, audience/category scope, Persian copy, maximum length, asset IDs, and SEO heading level. Draft, scheduled, published, archived, and missing-block states are separate.
- An annotation has an anchor point, leader-line direction, collision fallback, short label, long description, and accessible text alternative. Desktop annotations may sit beside media; mobile annotations collapse into ordered notes below the image.
- A maximum of three annotations may overlay one image. Notes never cover the garment, size selector, price, or primary action.
- Product master: minimum `1600×2000`; hero desktop `2400×1240`; mobile hero `1080×1350`; category `1200×1600`.
- Every asset record includes `assetId`, license/owner, source dimensions, crop/focal point, desktop/mobile variant, and Persian alt text. Detail photography should show texture, weave, stitching, closure, and care-relevant construction where useful.
- Every product/content fixture records audience, ID, title, price in toman, color, size, fit, material, care, inventory, delivery, returns, related content, and alt text.
- Use the Section 9.3 fixture strings and test long guide titles, notes, tables, and CTA labels at `360 px`.

### 16.6 Responsive and interaction rules

- At `1024 px`, collapse the admin sidebar to a 72 px rail and move guide navigation into a compact section bar.
- At `768 px`, the PDP changes from `672+504` to stacked gallery/information; PLP filters move to a sheet; guide tables become scroll-contained or labeled cards.
- At `390 px`, keep two product columns, one-column forms, sticky purchase/checkout actions, and bottom navigation; long-form content uses one reading column.
- At `360 px`, reduce note padding and section gaps from `24` to `16` before reducing body text; annotations, tables, prices, and actions may not clip.
- Guide navigation updates the URL fragment and preserves scroll position; related-product rails appear after major blocks rather than between every paragraph.
- Filter/sort changes update query parameters and reset pagination. Cart and payment conflicts use recoverable sheets; content publish has preview, unsaved-change, and rollback messaging.

### 16.7 Handoff and approval checklist

For every `FN/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds, grid values, and tokens match this appendix;
- reading measure, annotation anchors, care-symbol alternatives, and content-block order are checked;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions/notes;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of the handoff table.
