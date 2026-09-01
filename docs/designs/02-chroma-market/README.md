# 02 / CHROMA MARKET

> Complete Figma design specification for an energetic, campaign-driven Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of five equal, complete design candidates for NOVA Store.

## 1. Direction

CHROMA MARKET makes fashion discovery feel active, current, and social. Strong color blocking, compact promotional modules, bold type, and quick category switching support new drops, seasonal collections, and family shopping without turning checkout or operations into visual noise.

The direction must feel:

- Expressive, youthful, and high-energy.
- Organized by a strict grid beneath the color.
- Friendly to men’s, women’s, and children’s products equally.
- Promotional without making every product look discounted.
- Clear and restrained in checkout, account, payment, and admin surfaces.

All documented pages are required; this direction is not complete if it exists only as a colorful home page.

## 2. Audience and catalog

Primary navigation:

```text
زنانه / مردانه / بچگانه / اکسسوری / تازه‌ها / استایل‌ها / تخفیف
```

The home page must visibly expose all three audiences. Each audience receives its own landing page, subcategories, campaigns, listing filters, product detail examples, and admin taxonomy.

Customer-facing prices use toman, such as `۱٬۸۹۰٬۰۰۰ تومان`. Technical identifiers remain isolated LTR strings.

## 3. Figma organization

Create the top-level page `02 — CHROMA MARKET` in the shared NOVA Store Figma file.

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
08 Campaign, editorial, and utility
09 Admin desktop
10 Admin responsive
11 States and edge cases
12 Prototype flows
```

Frame naming uses the `CM` prefix:

```text
CM/Home/Desktop/Default
CM/PLP/Mobile/Filtered
CM/PDP/Desktop/Color-Selected
CM/Checkout/Mobile/Payment-Failure
CM/Admin/Orders/Desktop/New
```

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide desktop | 1728 px | 1440 px | 12 | 144 px | 24 px |
| Primary desktop | 1440 px | 1248 px | 12 | 96 px | 24 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 20 px |
| Tablet | 768 px | 704 px | 8 | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Rules:

- Color blocks may span multiple columns but all product-card edges must align to the base grid.
- Storefront desktop product rails use four cards; filtered listings use three cards plus a filter rail.
- Mobile product grids use two columns.
- Transactional pages reduce decorative color to the header, active step, CTA, and status surfaces.
- Content must remain readable when campaign imagery fails to load.

## 5. Color system

### 5.1 Primitive palette

| Token | Hex | Use |
| --- | --- | --- |
| `white` | `#FFFFFF` | Surface |
| `canvas` | `#FFFDF8` | Main canvas |
| `ink/950` | `#131316` | Primary text |
| `ink/700` | `#37363D` | Supporting text |
| `ink/500` | `#6F6D77` | Secondary text |
| `ink/300` | `#8C8993` | Disabled decoration only |
| `line/200` | `#DCD9E2` | Border |
| `line/100` | `#ECEAF0` | Divider |
| `cobalt/800` | `#1439B8` | Hover |
| `cobalt/700` | `#214AD9` | Primary action |
| `cobalt/100` | `#E7ECFF` | Selected background |
| `coral/600` | `#F05A47` | Campaign accent |
| `coral/100` | `#FFE8E3` | Campaign surface |
| `lime/500` | `#B7E33D` | New/drop accent |
| `lime/100` | `#F0F9D5` | Soft accent |
| `violet/600` | `#7A45DB` | Secondary campaign accent |
| `violet/100` | `#F0E8FF` | Soft violet |
| `yellow/500` | `#F4C84B` | Children/campaign accent |
| `yellow/100` | `#FFF4CF` | Soft yellow |
| `success/700` | `#137052` | Success |
| `success/100` | `#E4F3EB` | Success surface |
| `warning/700` | `#8A5200` | Warning |
| `warning/100` | `#FFF2D8` | Warning surface |
| `error/700` | `#B42318` | Error |
| `error/100` | `#FDE8E7` | Error surface |
| `info/700` | `#2458A6` | Information |
| `info/100` | `#E8F0FC` | Information surface |

### 5.2 Semantic use

```text
color/bg/page              canvas
color/bg/surface           white
color/text/primary         ink/950
color/text/secondary       ink/500
color/text/placeholder     ink/500
color/border/default       line/200
color/action/primary       cobalt/700
color/action/primary-hover cobalt/800
color/action/selected      cobalt/100
color/campaign/coral       coral/600
color/campaign/lime        lime/500
color/campaign/violet      violet/600
color/campaign/yellow      yellow/500
```

Color discipline:

- Cobalt is the only global primary-action color.
- Coral, lime, violet, and yellow identify campaign modules, not permanent navigation semantics.
- Men, women, and children may use different campaign accents, but category meaning must remain readable without color.
- Product information surfaces use white or canvas backgrounds.
- Checkout never uses more than one campaign accent at a time.

## 6. Typography

- Primary Persian family: `Estedad`.
- Body alternative/fallback: `Vazirmatn`.
- Latin and technical identifiers: `Inter`.
- Display headings may use tight tracking; body Persian text must retain comfortable spacing.

| Style | Desktop | Mobile | Weight |
| --- | --- | --- | ---: |
| `display/mega` | 72/78 px | 42/48 px | 800 if available, otherwise 700 |
| `display/hero` | 52/62 px | 36/44 px | 700 |
| `heading/h1` | 38/50 px | 29/40 px | 700 |
| `heading/h2` | 30/42 px | 24/34 px | 700 |
| `heading/h3` | 23/34 px | 20/30 px | 600 |
| `body/lg` | 18/30 px | 17/29 px | 400 |
| `body/md` | 16/28 px | 16/28 px | 400 |
| `body/sm` | 14/23 px | 14/23 px | 400 |
| `label/md` | 14/22 px | 14/22 px | 700 |
| `caption` | 12/20 px | 12/20 px | 500 |
| `price/lg` | 24/34 px | 22/32 px | 700 |

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px`.

Radius:

- `4 px`: tiny labels.
- `8 px`: swatches and compact inputs.
- `12 px`: standard buttons and inputs.
- `16 px`: product and category cards.
- `20 px`: campaign blocks.
- `24 px`: drawers and major promotional panels.
- `999 px`: chips and avatars.

Effects:

- Card hover: `0 8 24 rgba(19,19,22,0.10)`.
- Dropdown: `0 12 32 rgba(19,19,22,0.14)`.
- Drawer: `0 20 64 rgba(19,19,22,0.20)`.
- Focus ring: white `2 px` separation plus `2 px #214AD9`.

Motion:

- Control state: `120 ms`.
- Product-image swap: `180 ms`.
- Campaign-card hover: `180 ms` with no more than `4 px` translation.
- Drawer/sheet: `240 ms`.
- Toast: `200 ms`.
- Reduced motion removes translations and scale.

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

- Campaign bar: `36 px`.
- Main header: `72 px`.
- Category navigation: `48 px`.
- Sticky header: `64 px`.
- Mega-menu content width: `1248 px`.
- Search overlay: `680 px`.

Mobile:

- Campaign bar: `28 px`.
- Header: `56 px`.
- Search field row: `52 px`.
- Bottom navigation: `64 px` plus safe area.

Navigation must show women, men, and children as direct destinations. The mega menu can give each category a campaign tile, but the text hierarchy remains consistent.

## 9. Component inventory

Primitive components: `Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Commerce components: `Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Campaign Banner`, `Drop Badge`, `Category Card`, `Product Card`, `Compact Product Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, and `Recently Viewed`.

Admin components: `Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

Controls require all relevant default, hover, focus, pressed/selected, disabled, loading, error, and success states. Minimum target is `44 × 44 px`; default input is `48 px`; primary purchase CTA is `52 px`.

### 9.1 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `cobalt/700` | `cobalt/700` | `white` | No shadow |
| Hover primary | `cobalt/800` | `cobalt/800` | `white` | `120 ms` transition |
| Pressed primary | `ink/950` | `ink/950` | `white` | No scale animation |
| Focus | Existing fill | White separation plus `cobalt/700` | Existing text | Two-ring focus outside bounds |
| Disabled | `line/100` | `line/200` | `ink/500` | No pointer action; disabled meaning is explicit |
| Loading | Originating state | Originating state | Spinner plus preserved label | Prevent repeat action |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.2 Construction-level component contracts

| Component | Anatomy and measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/44/52 px`; inline padding `12/16/24 px`; icon `16/20 px`; gap `8 px`; radius `12 px` | Primary, Secondary, Outline, Ghost, Destructive; sizes; icon slots; all interaction states | Purchase CTA fills mobile width; ordinary buttons hug content |
| Icon Button | `36/44/52 px` square; icon `18/20/24 px`; radius `12 px` | Ghost, Surface, Outline; tooltip and accessible label | At least `44 px` on customer mobile |
| Text/Phone Field | Height `48 px`; padding `14 px`; label gap `8 px`; icon `20 px`; helper gap `6 px` | Empty, filled, focus, disabled, error, success; prefix/suffix | Full mobile width; phone value isolated LTR |
| Search Field | Height `48 px`; icon `20 px`; clear action `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | `680 px` desktop overlay; full-screen mobile |
| Select | Trigger `48 px`; item `44 px`; chevron `20 px`; menu padding `8 px` | Placeholder, selected, open, disabled, error; single/multiple | Filter selections move into bottom sheet on mobile |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed, focus, disabled, error | Clickable row minimum `44 px` |
| Tabs/Chip/Badge | Tab `44 px`; chip `36 px`; badge `24 px`; padding `12/10/8 px` | Active, inactive, focus, disabled; removable and status variants | Tabs scroll on mobile with visible continuation |
| Dialog | Width `480/640 px`; padding `24/32 px`; radius `24 px`; footer gap `12 px` | Info, form, confirmation, destructive; loading/error | Mobile width `calc(100% - 32px)` or bottom sheet |
| Drawer/Bottom Sheet | Drawer `420 px`; sheet max `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide | Full width below `480 px`; safe-area padding |
| Toast/Inline Message | Toast `360 px`; padding `16 px`; icon `20 px`; message padding `12 px` | Success, warning, error, info; optional actions | Mobile width `calc(100% - 32px)` |
| Breadcrumb/Pagination/Stepper | Breadcrumb `32 px`; pagination target `44 px`; step node `28 px` | Full/collapsed; first/middle/last; current/complete/error | Collapse deep breadcrumbs and shorten checkout labels |
| Product Card | Desktop `288–300 px`; mobile `173 px`; image `4:5`; content gap `10 px`; radius `16 px`; swatch `24 px` | Regular, sale, new, low/out stock, loading; optional swatches/second image | Four desktop, three filtered, two mobile; price always visible |
| Media Gallery | Main `4:5`; thumbnail `72 × 90 px`; gap `10 px`; zoom target `44 px` | Image, video-ready, zoom, loading, failed | Thumbnail rail desktop; swipe gallery mobile |
| Color/Size Selector | Swatch `28 px`; size cell minimum `44 × 44 px`; gap `8 px` | Available, selected, low stock, unavailable, focus, error | Wrap without page overflow; guide opens in sheet |
| Cart Item | Image `112 × 140 px` desktop, `88 × 110 px` mobile; quantity `112 × 40 px`; padding `16 px` | Default, updating, removed, stock conflict, price change, error | Stack actions below metadata on mobile |
| Order Summary | Width `408 px`; padding `24 px`; row gap `12 px`; CTA `52 px` | Default, recalculating, coupon success/error, quote expired | Full width on mobile; sticky CTA where specified |
| Address/Shipping/Payment | Minimum `88 px`; padding `16 px`; radio `20 px`; text gap `4 px` | Default, hover, selected, disabled, unavailable, error | Full-width stack; selection includes radio and label |
| Data Table | Header `48 px`; row `48/56 px`; cell padding `12 × 16 px` | Sort, select, hover, focus, expanded, loading, empty, error | Becomes labeled cards at `768 px` and below |
| Product Form/Variant Matrix | Section padding `24 px`; two-column fields; matrix cell minimum `120 × 44 px` | Draft, invalid, saving, saved, publish-blocked; size × color | One-column below `768 px`; matrix scrolls inside labeled region |

### 9.3 Realistic Persian UI content set

```text
Navigation: زنانه، مردانه، بچگانه، اکسسوری، تازه‌ها، استایل‌ها، تخفیف
Campaign: رنگ تازه، حال تازه — تا ۳۰٪ تخفیف منتخب فصل
Women product: کت کراپ زنانه رها — سرخابی — ۲٬۱۹۰٬۰۰۰ تومان
Men product: هودی اورسایز مردانه — آبی کبالت — ۱٬۷۹۰٬۰۰۰ تومان
Children product: پیراهن نخی کودک رنگین — زرد آفتابی — ۹۸۰٬۰۰۰ تومان
Actions: همین حالا خرید کنید، افزودن به سبد، انتخاب اندازه، دیدن رنگ‌ها، مشاهده همه
Search: دنبال چه استایلی هستید؟ / برای «شلوار بگگ» نتیجه‌ای نبود؛ «شلوار بگ» را ببینید.
Stock: موجود / فقط ۳ عدد باقی مانده / این رنگ در اندازه انتخابی ناموجود است
Checkout: اطلاعات ارسال، روش تحویل، پرداخت، ثبت سفارش
Errors: یک اندازه انتخاب کنید. / پرداخت انجام نشد؛ دوباره تلاش کنید. / موجودی کالا تغییر کرده است.
Order: سفارش ثبت شد، در حال آماده‌سازی، ارسال شد، تحویل داده شد
Admin: محصولات، سفارش‌ها، موجودی، پرداخت‌ها، کمپین‌ها، مشتریان، محتوا، گزارش تغییرات
```

## 10. Storefront pages

| Page | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Home | `1248 × 620 px` color-block hero; three audience gates; new-drop mosaic; four-card product rails; trend tiles; sale module; trust; editorial/social proof; footer | `358 × 430 px` hero; three horizontal audience tabs; two-column products; swipeable campaign blocks | Campaign, no campaign, loading, slow image, error |
| Category landing | Bold title band, subcategory chips, featured campaign, trending products, shop-by-fit, editorial guide, SEO copy | Compact color band, scrollable chips, two-column categories and products | Women, men, children, campaign off |
| Product listing | `288 px` filter rail plus three-card grid; strong applied filters and drop/sale badges | Two-column grid; sticky filter and sort; `90%`-height filter sheet | Default, filtered, no results, loading, error |
| Search | `680 px` overlay with colorful category markers and compact products; full result page | Full-screen search with sticky field | Recent, popular, typing, typo, no result, error |
| Product detail | `672 px` gallery plus `504 px` sticky information; color-block variant area kept subordinate to images | `4:5` swipe gallery; `16 px` padding; sticky purchase bar | Variant empty/selected, size error, low/out stock, sale, zoom, added, changed price |
| Cart drawer | `420 px` drawer with bold summary CTA | Full-width sheet | Empty, stock conflict, price change, loading, error |
| Cart page | `816 px` items plus `408 px` summary | One column and sticky CTA | Coupon states, unavailable item, empty |
| Authentication | `480 px` form paired with campaign art | Full-height one-column form | Guest, login, invalid, expired, rate limit |
| Checkout address | Neutral `816 + 408 px` layout with cobalt CTA | One column | Saved/new, validation, unsupported region, save error |
| Checkout shipping | Neutral selectable method cards | Stacked method cards | Loading, selected, unavailable, expired |
| Checkout payment | Neutral gateway cards, one cobalt action | Stacked cards, sticky CTA | Processing, redirect, failed, cancelled, timeout, pending |
| Confirmation | Strong cobalt success header over neutral receipt | Stacked success/receipt | Paid, pending, guest account offer |
| Tracking | Color-coded but labeled order timeline | Vertical timeline | Preparing, shipped, delayed, delivered, cancelled |

Product photography:

- Product master: `1600 × 2000 px`, `4:5`.
- Hero desktop: `2400 × 1200 px`.
- Hero mobile: `1080 × 1350 px`.
- Category: `1200 × 1500 px`.
- Campaign assets must reserve safe space for Persian type and still make sense without overlaid copy.

## 11. Account, support, content, and utility

Desktop account uses a `280 px` sidebar and `920 px` content area. Required pages:

- Dashboard.
- Profile and consent preferences.
- Addresses: list, add, edit, delete.
- Orders and order detail.
- Support entry and FAQ search.
- Security/session page.
- Notification preferences.
- Campaign landing.
- Buying guide.
- Lookbook and shoppable outfit page.
- Editorial article.
- About, trust, shipping, returns, size, care, FAQ, contact, privacy, and terms.
- `404`, offline, and maintenance.

P1 uses the same system for wishlist, back-in-stock, returns, store credit, referrals, reviews, product comparison, and product questions.

## 12. Admin pages

Admin is intentionally calmer than the storefront: white/canvas surfaces, cobalt actions, limited campaign color in previews only. Use a `240 px` sidebar, `64 px` topbar, `32 px` padding, and `48/56 px` table rows.

Required pages:

- Admin login and MFA-ready verification.
- Dashboard.
- Products list.
- Product create/edit.
- Size × color variant matrix.
- Product media and color associations.
- Women/men/children category management.
- Inventory and movements.
- Order queue and order detail.
- Payment attempts and webhook detail.
- Promotions and coupons.
- Customer lookup and restricted detail.
- Campaign/content list and editor.
- Audit log.
- Notification retry and operational status.

The product editor includes audience, garment type, season, material, care, fit, size system, color, model measurements, variant imagery, stock, shipping values, Persian SEO metadata, draft, preview, publish, and archive.

At `1024 px`, collapse the sidebar. At `768/390 px`, order and customer workflows become cards; complex product editing remains available with a desktop-recommended note.

## 13. RTL and accessibility

- Use `fa-IR` and RTL at document level.
- Use logical inline/block spacing.
- Isolate SKU, phone, coupon, payment, and tracking strings as LTR.
- Validate slider, carousel, breadcrumb, drawer, and stepper behavior manually in RTL.
- Maintain WCAG AA text contrast even on campaign colors.
- Never place white text on lime or yellow without a dark supporting surface.
- Visible focus is required on every control.
- Swatches expose Persian names; unavailable sizes include explicit state text.
- Forms retain labels and show an error summary.
- Dialogs and drawers document focus trap, Escape, close, and focus return.
- Loading, empty, error, slow-network, offline, disabled, and success states are mandatory.

## 14. Prototype flows

Customer:

1. Home → women campaign → filtered listing → product.
2. Home → men new drop → product → size guide → cart.
3. Home → children → age/size filter → product → cart.
4. Cart → guest checkout → address → shipping → payment → confirmation.
5. Payment failure → retry → pending → success.
6. Search typo → correction → product.
7. Confirmation → tracking → delay → support.
8. Account → orders → detail.

Admin:

1. Create product → media → variants → publish.
2. Schedule audience-specific campaign → preview → publish.
3. Low stock → adjustment → audit.
4. Order → preparing → shipped.
5. Payment mismatch → verification.

## 15. Completion criteria

- Every customer and admin page has `1440 px` and `390 px` frames.
- PLP, PDP, cart, checkout, account order detail, admin product edit, and admin order detail also have `768 px` frames.
- `360 px` QA shows no clipping or horizontal scroll.
- Women, men, and children appear in navigation, home, category, filtering, product mock data, and admin taxonomy.
- All visible prices use toman.
- All recurring values use Figma variables/styles.
- Components use Auto Layout and documented properties.
- Browse-to-purchase, payment recovery, tracking, product publishing, and order fulfillment prototypes work.
- Color does not replace labels, structure, focus, or status icons.
- Slow-network, stock-conflict, and payment-conflict states are documented and prototyped where relevant.
- Screenshot comparison confirms correct crops, spacing, states, and responsive behavior.

## 16. Construction appendix

This appendix instantiates the shared deterministic Figma contract in the root [README](<C:/Users/Asus/Documents/ChatGPT/online store/README.md>). Every frame uses the `CM` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

### 16.1 Frame matrix and coordinate anchors

| Frame family | Desktop | Tablet | Mobile | Narrow QA |
| --- | --- | --- | --- | --- |
| Storefront shell | `1440 × auto`, content `x=96,w=1248`, 12 columns, 24 px gutter | `768 × auto`, content `x=32,w=704`, 8 columns, 16 px gutter | `390 × auto`, content `x=16,w=358`, 4 columns, 12 px gutter | `360 × auto`, content `x=16,w=328` |
| Account shell | `1440 × auto`, nav `x=96,w=280`, gap `32`, content `w=920` | `768 × auto`, nav becomes a summary row, content `w=704` | `390 × auto`, stacked destination list and one-column content | `360 × auto`, same stack with 16 px side padding |
| Admin shell | `1440 × auto`, sidebar `240`, topbar `64`, content padding `32` | `768 × auto`, sidebar hidden, card queues | `390 × auto`, card queues and sticky save/action bar | `360 × auto`, no table overflow |

Use these top-level coordinates in every primary frame:

| Screen | Desktop coordinate anchors | Mobile coordinate anchors |
| --- | --- | --- |
| Shell | Campaign bar `y=0,h=36`; header `y=36,h=72`; category nav `y=108,h=48`; content starts `y=156` | Campaign bar `h=28`; header `h=56`; content starts `y=84`; bottom nav fixed `h=64` plus safe area |
| `HOME` | Color-block hero `x=96,y=156,w=1248,h=620`; mosaic gap `24`; product rails use four cards; section gaps `48` | Hero `x=16,y=84,w=358,h=430`; audience tabs `h=44`; two-column product cards `w=173` |
| `PLP_*` | Filter rail `x=96,w=288`; gap `24`; product grid `x=408,w=936`, three columns; campaign/drop badges sit within card media | Sticky filter/sort bar `x=16,y=84,w=358,h=52`; two cards `w=173` with 12 px gap; filters use a 90% height sheet |
| `PDP` | Gallery `x=96,w=672`; gap `24`; info `x=792,w=504`; color-block variant area stays below title/price | Gallery `x=16,y=84,w=358,aspect=4:5`; info padding `16`; purchase bar fixed `h=72` |
| `CART`/checkout | Items `x=96,w=816`; gap `24`; summary `x=936,w=408`; only cobalt is used for the primary action | One-column content `x=16,w=358`; sticky CTA above bottom navigation |
| Account | Nav `x=96,w=280`; gap `32`; content `x=408,w=920` | Summary header `x=16,w=358`; destination cards and content stack |
| Admin | Sidebar `x=0,w=240`; topbar `y=0,h=64`; content `x=272,w=1136` | Topbar `h=56`; content padding `16`; campaign colors appear only in previews |

Frame names follow `CM/<Screen>/<Viewport>/<State>`, for example `CM/Home/Desktop/Campaign`, `CM/PLP/Mobile/Filter-Sheet`, and `CM/Admin/Content/Desktop/Preview`. Record the actual node URL beside each name after the Figma frame is created.

### 16.2 Screen-sheet map

Each row below represents an individual frame even where IDs are grouped. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Mandatory state frames |
| --- | --- | --- | --- |
| `HOME` | Color-block hero, three audience gates, new-drop mosaic, four-card product rails, trend tiles, sale module, trust, social proof, footer | 358 px hero, three horizontal audience tabs, two-column products, swipeable campaign blocks | Campaign, no campaign, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Bold title band, subcategory chips, featured campaign, trending rail, shop-by-fit, editorial guide, SEO block | Compact color band, horizontal chips, two-column category/product cards, expandable SEO copy | Default, campaign off, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 288 px filter rail, three-card grid, result count, applied chips, sort, sale/drop badges, pagination | Two-column grid, sticky filter/sort, 90% height filter sheet | Default, filtered, sale/drop, no results, loading, error, offline |
| `SEARCH` | 680 px overlay with colored category markers, compact product results, recent/popular groups, full result page | Full-screen surface with sticky input and grouped result cards | Empty, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 672 px gallery, 504 px sticky info, image-led variant choice, price/stock/delivery/returns/details/reviews | Swipe gallery, 16 px information padding, size-guide sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 420 px drawer; full cart uses 816 px items plus 408 px summary | Full-width sheet; cart page stacks items and summary with sticky checkout CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 480 px form paired with campaign art; guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | `816+408` two-column flow; neutral surfaces; cobalt is the only primary CTA | One-column step panels; sticky next/pay CTA; methods stack | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | Cobalt success header over neutral receipt; labeled timeline and carrier card | Stacked success/receipt and vertical timeline | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | 280 px account navigation plus 920 px content; cards use white/canvas surfaces and 24 px section gaps | Summary header, stacked destination cards, one-column forms/order details | Loading, empty orders/addresses, validation error, save success/error, permission error, offline |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | FAQ search, support entry, session controls, and preference groups in the 920 px column | Accordion groups and full-width controls | Empty search, ticket submitted, session revoke success/error, preference save error |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | Color-block campaign modules, 720 px reading measure, shoppable product references, preview-safe copy areas | Single-column story, swipeable media, related products after each major section | Published, scheduled, missing media, loading, unavailable, offline |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | Neutral reading surface, 720 px measure, one campaign accent maximum on supporting callouts | 358 px reading column, collapsible contents and stacked accordions | Default, loading, error, offline, contact validation/success |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | Centered 480 px message with return/search/support action; no campaign color is required | Full-width 358 px message and one primary action | 404, offline cached shell, maintenance window |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | 240 px sidebar, 64 px topbar, stat cards, action queues; campaign color appears in preview tiles only | Sidebar hidden; cards and priority queue | Invalid, locked, rate-limited, MFA step, loading, permission error |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | Filter bar, 48/56 px rows, audience/category/status filters, bulk actions, pagination | Priority columns become labeled cards; filters become a sheet | Loading, empty, request error, stock discrepancy, bulk-action success/error |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | Sectioned form, 2-column fields, 120 × 44 px variant cells, media crop/reorder panel, preview strip | One-column sections; contained matrix scroll; sticky save bar | Draft, invalid, saving, saved, publish blocked, upload/crop failure |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | Queue tabs, immutable order snapshots, payment attempt/webhook timeline, internal notes | Queue/detail cards with labeled event rows | New/paid/preparing/shipped, payment mismatch, retry, webhook error, permission error |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | Campaign rule editor, restricted customer lookup/detail, block editor/preview, audit before/after, notification/media/payment health | Card sections with explicit section navigation and unsaved-change guard; PII stays permission-gated | Draft, scheduled, publish blocked, success, failure, no activity, service degraded, permission error |

### 16.3 Direction-specific component property values

The property names come from the root contract; these are the CHROMA defaults and overrides:

| Component | CHROMA value |
| --- | --- |
| `Button` | `primary=cobalt/700`, `hover=cobalt/800`, `pressed=ink/950`, radius `12`, purchase height `52`; no campaign accent for primary actions |
| `CampaignBanner` | `accent=coral\|lime\|violet\|yellow`, `textSafe=true`, `campaignOnly=true`, `maxAccentCount=1` per checkout frame |
| `DropBadge` | `status=new\|drop\|sale`, `fill=lime/500\|coral/600\|yellow/500`, explicit label and icon; never color-only |
| `ProductCard` | `imageRatio=4:5`, desktop `w=288–300`, mobile `w=173`, title `maxLines=2`, `showDropBadge=true`, `showSwatches=true` |
| `MediaGallery` | `thumbnail=72×90`, `gap=10`, `zoom=true`, `state=ready\|loading\|failed`; campaign overlay never hides the garment |
| `PriceBlock` | Customer amount `Vazirmatn 700`; cobalt for action only; sale uses `coral/600` plus text/icon; currency suffix is `تومان` |
| `Drawer/Sheet` | Drawer `w=420`; sheet max `90vh`; white/canvas surface; cobalt CTA; focus return to trigger |
| `Admin` | White/canvas surfaces and cobalt actions; coral/lime/violet/yellow allowed only in campaign preview tiles |

### 16.4 State and Persian copy fixtures

Use these state fixtures consistently in frames and prototypes:

| State | Required visible copy/action |
| --- | --- |
| Loading | Skeletons preserve the final card height; campaign tiles show a neutral placeholder, not a false promotion |
| Empty PLP | `محصولی مطابق این فیلتر پیدا نشد` / `حذف فیلترها` |
| Offline | `ارتباط برقرار نشد؛ اطلاعات ذخیره‌شده را می‌بینید.` / `تلاش دوباره` |
| PDP size error | `یک اندازه انتخاب کنید.`; focus moves to the size group |
| Stock conflict | `موجودی کالا تغییر کرده است.` / `به‌روزرسانی سبد` |
| Price change | `قیمت این کالا تغییر کرده است.` / `مشاهده قیمت جدید` |
| Payment failure | `پرداخت انجام نشد؛ دوباره تلاش کنید.` / `پشتیبانی` |
| Campaign success | `به سبد اضافه شد` or `کمپین منتشر شد`; include label, icon, and next action |

### 16.5 Asset, campaign, and content rules

- Hero source: minimum `2400×1200` desktop and `1080×1350` mobile; reserve a declared Persian text-safe rectangle in every campaign asset.
- Product master: `1600×2000`, `4:5`; preserve garment silhouette and use the asset record's focal point rather than a generic center crop.
- Category image: `1200×1500`; keep the audience and garment context visible when color bands are overlaid.
- Every campaign asset records `assetId`, license/owner, source dimensions, crop/focal point, accent assignment, overlay opacity, desktop/mobile variant, and Persian alt text.
- Every campaign records `campaignId`, audience scope, category scope, start/end time, accent, promotion label, maximum copy length, and fallback when unpublished.
- Use the Section 9.3 fixture strings for women, men, and children. Test long titles, discount labels, and CTA copy at `360 px`; no campaign accent may reduce text contrast.
- Product cards always expose title, price, stock, and primary action without hover.

### 16.6 Responsive and interaction rules

- At `1024 px`, collapse the admin sidebar to a 72 px rail and reduce campaign tile span before reducing type.
- At `768 px`, the PDP changes from `672+504` to stacked gallery/information; PLP filters move to a sheet; mosaic tiles become a single ordered list.
- At `390 px`, audience tabs remain text-labelled, products stay two columns, and checkout/payment actions remain sticky above bottom navigation.
- At `360 px`, reduce tile gaps and label padding before reducing body text; all campaign labels must wrap without clipping.
- Color never determines audience meaning, sale state, or navigation. Every campaign color has a text label/icon and a tested contrast pair.
- Filter/sort changes update query parameters, reset pagination, and preserve the selected audience. Cart and payment conflicts use explicit recovery sheets.

### 16.7 Handoff and approval checklist

For every `CM/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds and tokens match this appendix;
- campaign accents pass contrast checks in every text/control combination;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of the handoff table.
