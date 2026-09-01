# 01 / ATELIER EDITORIAL

> Complete Figma design specification for a premium, image-led Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of five equal, complete design candidates for NOVA Store.

## 1. Direction

ATELIER EDITORIAL treats the store like a restrained fashion journal. Large portrait photography, confident typography, generous white space, and carefully paced product stories create a premium experience without hiding price, availability, sizing, delivery, or returns.

The direction must feel:

- Editorial rather than decorative.
- Premium but still usable for everyday family shopping.
- Image-led without making product comparison difficult.
- Calm enough for checkout and account tasks.
- Deliberately Persian RTL, not a mirrored Western template.

All pages and components in this specification are required. A home-page concept alone is not considered complete.

## 2. Audience and catalog

Primary customer navigation:

```text
زنانه / مردانه / بچگانه / اکسسوری / جدیدترین‌ها / کالکشن‌ها / تخفیف
```

Each of `زنانه`, `مردانه`, and `بچگانه` must have:

- A category landing page.
- Subcategory navigation.
- New-arrival and best-seller modules.
- Product listing with size, color, fit, material, price, availability, and discount filters.
- Product detail pages with garment-specific sizing and care information.
- Campaign and editorial entry points.

Customer-facing money is displayed in toman, for example `۲٬۴۹۰٬۰۰۰ تومان`. SKU, coupon, payment, and tracking references remain isolated LTR strings.

## 3. Figma organization

Use the shared NOVA Store Figma file and place this direction under a top-level page named `01 — ATELIER EDITORIAL`.

Required page sections:

```text
00 Cover and direction index
01 Foundations
02 Primitive components
03 Commerce components
04 Storefront desktop
05 Storefront mobile
06 Cart and checkout
07 Account and support
08 Editorial and utility pages
09 Admin desktop
10 Admin responsive
11 States and edge cases
12 Prototype flows
```

Frame naming:

```text
AE/Home/Desktop/Default
AE/Home/Mobile/Default
AE/PLP/Desktop/Filtered
AE/PDP/Mobile/Size-Selected
AE/Checkout/Desktop/Payment
AE/Order/Mobile/Shipped
AE/Admin/Product-Edit/Desktop/Variants
```

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide editorial desktop | 1728 px | 1440 px | 12 | 144 px | 32 px |
| Primary desktop | 1440 px | 1248 px | 12 | 96 px | 24 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 24 px |
| Tablet | 768 px | 704 px | 8 | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Layout rules:

- Editorial pages may break the `1248 px` content grid only for intentional full-bleed photography.
- Transactional pages remain inside a maximum `1200 px` content area.
- Product cards always align to a predictable comparison grid even when editorial blocks span multiple columns.
- Mobile product listings use two columns; checkout, account forms, and order details use one.
- No customer flow may depend on hover.

## 5. Color system

### 5.1 Primitive palette

| Token | Hex | Use |
| --- | --- | --- |
| `ivory/0` | `#FFFFFF` | Raised surface |
| `ivory/50` | `#FBF8F2` | Main canvas |
| `ivory/100` | `#F3EDE2` | Secondary surface |
| `ivory/200` | `#E7DDCE` | Selected or muted surface |
| `charcoal/950` | `#171512` | Primary text and dark action |
| `charcoal/800` | `#332F2A` | Strong supporting text |
| `charcoal/600` | `#696158` | Secondary text |
| `charcoal/450` | `#6F675F` | Metadata and placeholder |
| `line/200` | `#D8CCBC` | Default border |
| `line/100` | `#E9E0D4` | Subtle divider |
| `oxblood/800` | `#642D32` | Hover and premium emphasis |
| `oxblood/700` | `#7A3940` | Primary brand action |
| `oxblood/100` | `#F2E4E5` | Selected background |
| `brass/700` | `#8A6A2F` | Limited editorial accent |
| `brass/100` | `#F3EBD8` | Accent background |
| `success/700` | `#176B4D` | Success |
| `success/100` | `#E4F3EB` | Success surface |
| `warning/700` | `#8A5200` | Warning |
| `warning/100` | `#FFF2D8` | Warning surface |
| `error/700` | `#B42318` | Error |
| `error/100` | `#FDE8E7` | Error surface |
| `info/700` | `#2458A6` | Information |
| `info/100` | `#E8F0FC` | Information surface |

### 5.2 Semantic aliases

```text
color/bg/page              ivory/50
color/bg/surface           ivory/0
color/bg/subtle            ivory/100
color/text/primary         charcoal/950
color/text/secondary       charcoal/600
color/text/muted           charcoal/450
color/text/inverse         ivory/0
color/border/default       line/200
color/border/subtle        line/100
color/action/primary       oxblood/700
color/action/primary-hover oxblood/800
color/action/selected      oxblood/100
color/accent/editorial     brass/700
```

Oxblood is reserved for primary actions, selection, and high-value editorial emphasis. Brass is decorative and must not be used for small low-contrast text. Error, stock, order, and payment statuses always include an icon and label.

## 6. Typography

- Persian display family: `Estedad`.
- Persian body and interface family: `Vazirmatn`.
- Latin/SKU fallback: `Inter`.
- Weights: `400`, `500`, `600`, `700` only.

| Style | Desktop | Mobile | Family/weight |
| --- | --- | --- | --- |
| `display/hero` | 64/80 px | 40/56 px | Estedad 700 |
| `display/section` | 44/60 px | 32/44 px | Estedad 700 |
| `heading/h1` | 40/56 px | 30/44 px | Estedad 700 |
| `heading/h2` | 32/48 px | 25/38 px | Estedad 600 |
| `heading/h3` | 24/38 px | 21/34 px | Estedad 600 |
| `body/lg` | 18/34 px | 17/32 px | Vazirmatn 400 |
| `body/md` | 16/29 px | 16/29 px | Vazirmatn 400 |
| `body/sm` | 14/25 px | 14/25 px | Vazirmatn 400 |
| `label/md` | 14/24 px | 14/24 px | Vazirmatn 600 |
| `caption` | 12/21 px | 12/21 px | Vazirmatn 400 |
| `price/lg` | 24/36 px | 22/34 px | Vazirmatn 700 |

Hero headings may use a maximum of two lines. Product titles use Vazirmatn, never the display font, so browsing remains efficient.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 px`.

Radius variables:

- `0 px`: editorial imagery and tables.
- `4 px`: badges and swatches.
- `8 px`: buttons and inputs.
- `12 px`: transactional panels.
- `16 px`: dialogs and drawers.
- `999 px`: chips and avatars only.

Effects:

- Product cards normally have no shadow.
- Dropdown: `0 10 30 rgba(23,21,18,0.12)`.
- Drawer: `0 20 60 rgba(23,21,18,0.18)`.
- Sticky purchase bar: `0 -6 24 rgba(23,21,18,0.10)`.
- Focus: white `2 px` inner separation plus `2 px #7A3940` outer ring.

Motion:

- Control feedback: `140 ms` ease-out.
- Image crossfade: `220 ms` ease-out.
- Drawer/sheet: `260 ms cubic-bezier(0.2,0.8,0.2,1)`.
- Reduced-motion mode removes translations and image zoom.

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

## 8. Shared shell and category experience

Desktop shell:

- Announcement bar: `32 px`.
- Main header: `80 px`.
- Category navigation: `48 px`.
- Sticky header: `64 px` after scroll.
- Search overlay width: `720 px`.
- Footer: five columns within `1248 px`.

Mobile shell:

- Announcement bar: `28 px`.
- Header: `60 px`.
- Search row: `52 px` when exposed.
- Bottom navigation: `64 px` plus safe area.
- Navigation uses a full-height RTL drawer.

The global navigation must expose `زنانه`, `مردانه`, and `بچگانه` at the same hierarchy. None may be hidden only inside a generic “categories” page.

## 9. Component inventory

### 9.1 Primitive components

`Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Every interactive primitive requires default, hover, focus, pressed/selected, disabled, loading, error, and success states where applicable. Default field height is `48 px`; primary purchase buttons are `52 px`; minimum pointer target is `44 × 44 px`.

### 9.2 Commerce components

`Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Category Card`, `Editorial Feature`, `Product Card`, `Compact Product Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, and `Recently Viewed`.

Product-card image ratio is `4:5`. Desktop listing cards are `288–300 px` wide depending on grid context. Mobile cards are `173 px` wide in a `390 px` frame. Titles may occupy two lines; price, stock, and sale information may not be hover-only.

### 9.3 Admin components

`Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

### 9.4 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `oxblood/700` | `oxblood/700` | `ivory/0` | No shadow |
| Hover primary | `oxblood/800` | `oxblood/800` | `ivory/0` | `140 ms` transition |
| Pressed primary | `charcoal/950` | `charcoal/950` | `ivory/0` | No scale animation |
| Focus | Existing state fill | White separation plus `oxblood/700` | Existing state text | Two-ring focus remains outside component bounds |
| Disabled | `ivory/100` | `line/100` | `charcoal/450` | No pointer action; opacity is not the sole indicator |
| Loading | Same as originating state | Same as originating state | Spinner plus preserved label width | Prevent repeat submission |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, and error-summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.5 Construction-level component contracts

| Component | Anatomy and exact measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; inline padding `12/16/24 px`; icon `16/20 px`; label gap `8 px`; radius `8 px` | Primary, Secondary, Outline, Ghost, Destructive; Small, Medium, Large; leading/trailing icon; default through loading states | Mobile purchase buttons fill available width; ordinary buttons hug content until below `360 px` |
| Icon Button | `36/44/52 px` square; icon `18/20/24 px`; radius `8 px` | Ghost, Surface, Outline; tooltip and accessible-label properties | Remains at least `44 px` on customer mobile surfaces |
| Text/Phone Field | Height `48 px`; label gap `8 px`; inline padding `14 px`; icon `20 px`; helper gap `6 px`; error text `12/21 px` | Empty, filled, focus, disabled, error, success; prefix/suffix; LTR phone value | Full width on mobile; phone value is isolated LTR while label stays RTL |
| Search Field | Height `48 px`; search icon `20 px`; clear action `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | Desktop overlay `720 px`; mobile becomes a full-screen search surface |
| Select | Trigger `48 px`; menu item `44 px`; chevron `20 px`; menu padding `8 px` | Placeholder, selected, open, disabled, error; single/multiple | Mobile filter selections may render inside a bottom sheet |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed where relevant, focus, disabled, error | Entire label row is clickable with `44 px` minimum height |
| Tabs/Chip/Badge | Tab height `44 px`; chip `36 px`; badge `24 px`; horizontal padding `12/10/8 px` | Active, inactive, hover, focus, disabled; removable/selected chip; status badge | Tabs scroll horizontally on mobile with visible edge affordance |
| Dialog | Width `480/640 px`; padding `24/32 px`; header gap `12 px`; footer gap `12 px`; radius `16 px` | Information, form, confirmation, destructive; loading/error | Mobile uses `calc(100% - 32px)` or bottom sheet for long forms |
| Drawer/Bottom Sheet | Drawer `440 px`; sheet max height `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide; open/closing/loading | Drawer becomes full width below `480 px`; sheet respects bottom safe area |
| Toast/Inline Message | Toast width `360 px`, padding `16 px`, icon `20 px`; inline message padding `12 px` | Success, warning, error, info; optional one or two actions | Toast width becomes `calc(100% - 32px)` on mobile |
| Breadcrumb/Pagination/Stepper | Breadcrumb row `32 px`; pagination target `44 px`; stepper node `28 px` | Full/collapsed breadcrumb; first/middle/last pagination; current/complete/error step | Breadcrumb collapses after first ancestor; checkout stepper uses labels only where space permits |
| Product Card | Desktop width `288–300 px`; mobile `173 px`; image `4:5`; content gap `10 px`; swatch `24 px`; wishlist target `44 px` | Regular, sale, new, low stock, out of stock, loading; optional swatches and secondary image | Four desktop, three filtered, two mobile; title stays two lines and price remains visible |
| Media Gallery | Main image `4:5`; thumbnail `72 × 90 px`; thumbnail gap `10 px`; zoom target `44 px` | Image, video-ready, zoom, loading, failed asset | Desktop thumbnail rail; mobile swipe gallery with pagination and full-screen zoom |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; group gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wraps without horizontal page overflow; size guide opens in a sheet on mobile |
| Cart Item | Image `112 × 140 px` desktop and `88 × 110 px` mobile; quantity control `112 × 40 px`; row padding `16 px` | Default, updating, removed, stock conflict, price change, error | Mobile stacks price/quantity actions below garment metadata |
| Order Summary | Width `408 px`; padding `24 px`; row gap `12 px`; total divider and `52 px` CTA | Default, recalculating, coupon success/error, quote expired | Full width after items on mobile; CTA becomes sticky where specified |
| Address/Shipping/Payment Card | Minimum height `88 px`; padding `16 px`; radio `20 px`; title/detail gap `4 px` | Default, hover, selected, disabled, unavailable, error | Stacks full width; selection never relies only on border color |
| Data Table | Header `48 px`; dense row `48 px`; comfortable row `56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Converts priority columns to labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; field grid `2 × minmax(240px,1fr)`; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color variants | One-column fields below `768 px`; matrix scrolls inside its own labeled region |

### 9.6 Realistic Persian UI content set

Use these strings in final frames instead of generic English placeholders:

```text
Navigation: زنانه، مردانه، بچگانه، اکسسوری، جدیدترین‌ها، کالکشن‌ها، تخفیف
Campaign: کالکشن پاییز — فرم‌های آرام برای روزهای بلند
Women product: مانتوی لینن کمربندی آوا — کرم روشن — ۲٬۴۹۰٬۰۰۰ تومان
Men product: پیراهن آکسفورد مردانه — آبی مه‌آلود — ۱٬۸۹۰٬۰۰۰ تومان
Children product: ست دورس و شلوار کودک — سبز زیتونی — ۱٬۲۹۰٬۰۰۰ تومان
Actions: افزودن به سبد خرید، انتخاب اندازه، راهنمای اندازه، مشاهده جزئیات، ادامه خرید
Search: جست‌وجوی لباس، دسته یا رنگ… / نتیجه‌ای برای «کت جینن» پیدا نشد؛ «کت جین» را امتحان کنید.
Stock: موجود و آماده ارسال / تنها ۲ عدد باقی مانده / این اندازه ناموجود است
Delivery: ارسال به تهران، بین دوشنبه تا چهارشنبه
Returns: امکان مرجوعی تا ۷ روز مطابق شرایط کالا
Cart: سبد خرید شما / جمع کالاها / هزینه ارسال / مبلغ قابل پرداخت
Checkout: نشانی تحویل / روش ارسال / پرداخت / ثبت و پرداخت سفارش
Errors: اندازه را انتخاب کنید. / پرداخت ناموفق بود؛ مبلغی از حساب شما کسر نشده است. / ارتباط برقرار نشد؛ دوباره تلاش کنید.
Order: سفارش ثبت شد / در حال آماده‌سازی / تحویل به شرکت حمل / تحویل داده شد
Admin: محصولات، سفارش‌ها، موجودی، پرداخت‌ها، تخفیف‌ها، مشتریان، محتوا، گزارش تغییرات
```

## 10. Storefront page specifications

| Page | Desktop specification | Mobile specification | Required states |
| --- | --- | --- | --- |
| Home | `1248 × 680 px` editorial hero; asymmetric category story; four-card new arrivals; men/women/children feature panels; collection story; best sellers; trust; journal; footer | `358 × 480 px` hero; two-column categories; two-column products; horizontal editorial rail; sticky bottom nav | Campaign, no campaign, loading, slow images, error |
| Category landing | Category portrait, editorial intro, subcategory grid, featured looks, popular products, size/fit guide, SEO copy | Portrait hero, two-column subcategories, compact editorial cards, expandable copy | Women, men, children, empty campaign |
| Product listing | `300 px` filter rail plus three-card grid; heading, result count, sort, applied chips, pagination | Two-column cards; `52 px` sticky filter/sort bar; filter bottom sheet | Default, filtered, no results, loading, request error |
| Search | `720 px` overlay with recent, popular, category and product results; full results page | Full-screen overlay with sticky search field | Empty, typing, autocomplete, typo correction, no result, error |
| Product detail | `720 px` gallery plus `480 px` sticky information; portrait images; title, price, color, size, fit, stock, delivery, CTA, returns, details, reviews | Full-width `4:5` gallery; `16 px` content padding; size guide sheet; sticky `72 px` purchase bar | No variant, selected, size error, low stock, out of stock, sale, zoom, added, changed price |
| Cart drawer | `440 px` overlay with fixed summary/CTA | Full-width sheet | Empty, default, stock conflict, price change, loading, error |
| Cart page | `816 px` items plus `408 px` sticky summary, `24 px` gap | One column; sticky checkout CTA | Empty, coupon accepted/rejected, unavailable item |
| Authentication | Centered `456 px` panel with editorial side image on wide desktop | One-column full-height form | Login, guest continuation, invalid phone, expired code, rate limit, error |
| Checkout address | `816 px` form/cards plus `408 px` summary | One column with bottom CTA | Saved, new, validation error, unsupported region, save error |
| Checkout shipping | Method cards with carrier, ETA, price and limitations | Stacked selectable cards | Loading quote, selected, unavailable, expired quote |
| Checkout payment | Gateway cards, final total, terms, payment CTA | Stacked methods and sticky CTA | Processing, redirect, failed, cancelled, timeout, pending verification |
| Confirmation | Receipt-like `792 px` main card plus order summary | Single success stack | Paid, pending, guest account invitation |
| Tracking | Editorial order timeline and shipment card | Vertical timeline | Preparing, shipped, delayed, delivered, cancelled |

Home imagery:

- Desktop hero source: minimum `2400 × 1360 px`.
- Mobile hero source: minimum `1080 × 1440 px`.
- Product master: minimum `1600 × 2000 px`.
- Category portrait: minimum `1200 × 1600 px`.
- Preserve garment silhouette and leave intentional copy-safe space.

## 11. Account, support, and content pages

Account desktop uses a `280 px` navigation column and `920 px` content area. Mobile converts navigation into a summary and stacked destination list.

Required pages:

- Account dashboard.
- Profile and communication preferences.
- Address list, create, edit, and delete confirmation.
- Orders list and empty state.
- Order detail with immutable product snapshots, payment, address, shipment, and timeline.
- Support entry and order-related help.
- Security/session page.
- Notification preferences.
- Campaign landing.
- Buying guide.
- Editorial article.
- Lookbook with shoppable product references.
- About and brand story.
- Authenticity and trust.
- Shipping policy.
- Returns policy.
- Size guide.
- Garment-care guide.
- FAQ and contact.
- Privacy and terms.
- `404`, offline, and maintenance pages.

P1 frames belong in a separate section but use the same design system: wishlist, back-in-stock, returns, store credit, referrals, reviews-to-write, comparison, and product questions.

## 12. Admin page specifications

Admin uses a `240 px` sidebar, `64 px` topbar, `32 px` content padding, `48 px` dense rows, and `56 px` comfortable rows.

| Page | Required content |
| --- | --- |
| Admin login | Authentication, MFA-ready step, invalid, locked, rate-limited |
| Dashboard | Orders needing action, payment failures, low stock, sales indicators, activity |
| Products | Search, category, audience, status, stock filters; variant and publication columns |
| Product create/edit | Identity, Persian descriptions, audience, category, media, pricing, size/color variants, inventory, care, fit, shipping, SEO, publish |
| Variant matrix | Size × color matrix, SKU, price override, stock, media association |
| Media | Upload, crop preview, reorder, alt text, color association, failure |
| Categories | Women/men/children trees, ordering, images, metadata, status |
| Inventory | Available, reserved, threshold, movements, discrepancy |
| Orders | Queue, status tabs, date, payment, shipping, bulk-ready actions |
| Order detail | Customer, snapshots, total, payment, shipment, timeline, internal notes |
| Payments | Attempts, provider, reference, status, webhook history, mismatch warnings |
| Promotions | Codes, rules, audience/category scope, schedule, limits, stacking |
| Customers | Restricted lookup, order summary, support indicator |
| Customer detail | Permission-controlled PII, addresses, orders, activity |
| Content | Home/editorial blocks, campaigns, SEO pages, schedule, preview, publish |
| Audit log | Actor, action, entity, time, before/after detail |
| Operations | Notification retries and payment/shipping/media health summaries |

At `1024 px`, the sidebar collapses to `72 px`. At `768 px` and `390 px`, order queues and order details use cards. Complex catalog editing remains functional but may show a “desktop recommended” note.

## 13. RTL, accessibility, and edge cases

- Document language and direction are `fa-IR` and RTL.
- Use logical start/end spacing.
- Persian labels remain RTL; SKU, phone, coupon, payment, and tracking references are isolated LTR.
- Breadcrumb and carousel direction is validated visually and interactively.
- Minimum target is `44 × 44 px`.
- Customer form text remains at least `16 px` on mobile.
- Focus is visible on every interactive element.
- Product swatches expose Persian color names.
- Unavailable sizes use label, line treatment, and accessible state—not opacity alone.
- Errors use summary plus field-level descriptions.
- Modal and drawer focus trapping, Escape behavior, and return focus are annotated.
- All pages include loading, empty, error, disabled, success, slow-network, offline, stock-conflict, and payment-conflict states where relevant.
- Stock, discount, delivery, payment, and order statuses never depend on color alone.

## 14. Prototype flows

Customer prototypes:

1. Home → `زنانه` → dresses → filtered PLP → PDP.
2. Home → `مردانه` → shirts → PDP → size guide → cart.
3. Home → `بچگانه` → age/size filter → PDP → cart.
4. Cart → guest checkout → address → shipping → payment → confirmation.
5. Payment failure → retry → pending verification → success.
6. Confirmation → tracking → shipping exception → support.
7. Search typo → corrected results → product.
8. Account → orders → order detail.

Admin prototypes:

1. Create garment → add photography → configure size/color variants → publish.
2. Low-stock variant → inventory adjustment → audit event.
3. New order → paid → preparing → shipped.
4. Payment mismatch → attempt detail → status verification.
5. Edit seasonal campaign → preview → publish.

## 15. Completion criteria

- Every required customer and admin page exists at `1440 px` and `390 px`.
- PLP, PDP, cart, checkout, account order detail, admin product editor, and admin order detail also exist at `768 px`.
- Narrow-mobile QA passes at `360 px`.
- Women, men, and children are present in navigation, home modules, category templates, filters, mock products, and admin taxonomy.
- All visible prices use toman.
- Components use Auto Layout, variables, styles, and documented properties.
- No recurring color, spacing, radius, or type value is hardcoded in page compositions.
- Core browse-to-purchase and payment-recovery prototypes work.
- RTL, mixed-content, keyboard, focus, contrast, and reduced-motion reviews pass.
- Screenshot comparison finds no clipping, overlap, wrong crop, missing state, or detached-component drift.
- Approved frames expose direct node links for development handoff.
