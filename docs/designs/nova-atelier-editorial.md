# 02 / NOVA ATELIER EDITORIAL

> Current implementation-aligned design specification for NOVA: the **calm modern boutique** direction, using pale mint, dark forest green, white surfaces, restrained gold, clear product information, and a practical Persian RTL shopping experience.

This design document is the current baseline for the local implementation in [`apps/web`](../../apps/web). It supersedes the previous high-energy, campaign-first CHROMA MARKET direction. The visual source of truth is the current NOVA shell, content model, routes, and CSS tokens in [`apps/web/index.html`](../../apps/web/index.html), [`apps/web/src/main.js`](../../apps/web/src/main.js), and [`apps/web/src/styles.css`](../../apps/web/src/styles.css).

The design goal is not to make the store visually loud. It is to make a smaller set of clothing choices feel considered, trustworthy, and easy to compare.

This direction exclusively owns NOVA's **pale-mint / forest-green / soft-rounded boutique** territory. Design 1 must not reuse this palette, pill-heavy action language, or three-part commerce hero, and Design 3 must not reuse its mint canvas. This keeps the three candidates visibly distinct while preserving the same shared commerce behavior. All recommendations below are implementation-ready; values described as current are observed in the local design, while values described as QA or handoff rules are the constraints to preserve when the interface evolves.

## Layout Structure

Current observed structure:

- The document is Persian-first: `<html lang="fa" dir="rtl">`.
- The customer shell uses a pale mint page canvas and a centered container with `width: min(calc(100% - 32px), 1248px)` on desktop.
- The page rhythm is a full-width announcement bar, an `84 px` header, a `14 px` top content offset, route content, a shared footer, and a fixed mobile navigation bar below `720 px`.
- The home hero is a three-part composition: one dominant image-and-copy panel, two stacked editorial story cards, and one featured product card. The desktop grid is `1.35fr / 0.75fr / 0.72fr` with a `10 px` gap and `12 px` outer padding.
- Discovery sections use wide horizontal frames. Category cards sit on a seven-track desktop grid, the product rail uses four cards, and catalog pages use a `190 px` filter rail beside the listing.
- Product detail uses a two-column `4:5` media gallery plus sticky information panel. Cart and checkout use a wider content column plus a narrower sticky order summary. Account pages use a sticky account navigation column plus content.
- Admin has its own dark-green sidebar, pale mint work area, top bar, white data surfaces, and dense operational cards. It is deliberately more functional than editorial.

Inferred intent:

- The composition should feel like a small atelier or curated edit: one clear focal point, a limited number of supporting choices, and enough negative space for fabric and copy to breathe.
- Alignment should come from reusable container and gap rules, not absolute positioning. Images may be art-directed, but card edges, headings, tabs, and CTAs share stable anchors.

Responsive rules:

- Above `1050 px`, keep the full navigation and three-column hero proportions.
- At `1050 px`, tighten navigation and reduce hero column ratios without reducing the page container below its minimum gutter.
- At `820 px`, move the hero to two columns, reduce the product grid to three columns, reduce the category grid to four columns, and narrow the catalog/account side rails.
- At `720 px`, switch to the mobile header, fixed bottom navigation, two-column product grids, horizontal category scrolling, stacked gallery/details, stacked cart/checkout, and horizontally scrollable account/admin navigation.
- At `360 px`, preserve the two-column product structure and readable prices; reduce gaps and padding before reducing body text again.

## Section Order

Every customer route shares this shell order:

1. Announcement bar: `ارسال رایگان برای سفارش‌های بالای ۳ میلیون تومان` with a link to the new collection.
2. Global header: menu trigger when narrow, centered NOVA wordmark, navigation, search, account, and bag actions.
3. Route content inside the `1248 px` customer container.
4. Footer with brand statement, store links, guide/support links, newsletter field, and legal/copyright line.
5. On mobile only, the floating bottom navigation for خانه, جست‌وجو, سبد, and فهرست.

Home order:

1. Commerce hero: primary `NOVA / DROP ۰۱` story, women/children story cards, and the featured product quick-add card.
2. “از کجا شروع کنیم؟” category route: زنانه, مردانه, بچگانه, اکسسوری, تازه‌ها, تخفیف.
3. “چیزهایی که بیشتر می‌پوشید.” product rail with همه, زنانه, مردانه, and بچگانه tabs.
4. Fabric-study editorial block: image-led story on the left and the `NOVA / FABRIC STUDY` copy block on the right.
5. Trust block: trackable shipping, simple exchange, pre-purchase support, and a linked fit guide/journal card.
6. Footer.

Route-level order:

| Route family | Section order and purpose |
| --- | --- |
| Category landing | Breadcrumb → split category hero → four subcategory cards → four selected products → fit-guide banner |
| Catalog / PLP | Breadcrumb → heading and result count → audience tabs and sort → filter rail plus product grid |
| Product / PDP | Breadcrumb → gallery plus sticky purchase information → details block → related products |
| Cart | Breadcrumb → heading and item count → cart items → sticky summary card |
| Checkout | Breadcrumb → three-step address/shipping/payment stepper and form → summary card → confirmation route |
| Account | Breadcrumb → account navigation → dashboard/profile/address/order/support/security/notification content |
| Tracking | Breadcrumb → order heading/status → ordered products → labeled delivery timeline |
| Story pages | Breadcrumb → story hero → reading column → related products when relevant |
| Admin | Dark-green operations shell → admin sidebar/top bar → route heading → stats, table, form, or order detail |

## Navigation

Desktop header:

- The header is an `84 px`-high three-column grid: flexible action area, centered brand, and flexible navigation/action area. The NOVA wordmark is LTR inside the RTL document and is paired with `ATELIER EDITORIAL`.
- The current direct desktop navigation is `زنانه / مردانه / بچگانه / تازه‌ها / تخفیف`. `اکسسوری` remains a visible destination in the home category grid and catalog filters, but is not a direct desktop-header item in the current implementation.
- Navigation links use the green accent and a thin underline that grows from the right on hover or active state. The active route is identified by text and underline, never by color alone.
- Header actions are search, account, and bag. The bag count is a small green circular badge and remains visible without opening the drawer.
- The announcement bar is `32 px` minimum height on desktop. It carries one operational promise and one collection link so it does not compete with the main navigation.

Mobile navigation:

- At `720 px` and below, the desktop nav and text labels for account/search actions are hidden. A menu icon appears at the physical left, the NOVA brand remains centered, and compact search/bag actions stay at the opposite side.
- The menu opens a full-width side-drawer treatment with all primary destinations plus حساب کاربری. The drawer has a close button, numbered links, and a short brand note.
- The cart opens the same overlay family as a cart drawer; the drawer contains cart lines and the order summary rather than a second visual language.
- The search action opens a modal search panel with an input, result count, product result rows, and an empty state. The overlay darkens the page and locks body scrolling while open.
- The bottom navigation is fixed `12 px` from the left and right and `10 px` from the bottom, with a `60 px` minimum surface, a `17 px` radius, and four equal destinations. The content area reserves bottom space so the bar never covers the final action.

Interaction and keyboard rules:

- Focus order follows DOM order: announcement link → header controls/navigation → route content → footer → mobile navigation when it is rendered.
- Every icon-only action has a Persian accessible label. Escape, overlay click, and the visible close button should dismiss open search/menu/cart panels and return focus to the originating trigger.
- Touch targets are `44 × 44 px` for customer controls in the design contract. The current compact mobile CSS uses `44 px` icon controls; this is an explicit accessibility QA item before production sign-off.

## Typography

Current font system:

- Display family: `Estedad`, with `Vazirmatn` and `Tahoma` fallbacks.
- Body/UI family: `Vazirmatn`, with `Tahoma` fallback.
- The current implementation imports weights `400, 500, 600, 700` from Google Fonts. Keep the font loading non-blocking and preserve the fallback metrics to avoid layout shift.
- Latin labels, SKU values, order IDs, and other technical strings stay `direction: ltr` inside the RTL interface. No separate Latin display font is required by the current design.

| Role | Current desktop | Current mobile | Weight / rule |
| --- | --- | --- | --- |
| Body | `14 px`, line-height `1.8` | `13 px`, line-height `1.8` | `400`; comfortable Persian measure |
| Hero heading | `clamp(30px, 3.4vw, 48px)`, line-height `1.16` | `30 px`, line-height `1.16` | `600`; short editorial phrase with italic/emphasis color |
| Page heading | `clamp(30px, 4vw, 52px)` | `26 px` | `600`; compact catalog heading caps at `42 px` desktop |
| Section heading | `clamp(24px, 3vw, 38px)` | `26 px` | `600`; `letter-spacing: -0.035em` |
| Category/story heading | `clamp(31px, 4vw, 53px)` | `28 px` | `600`; max measure `420 px` |
| Product title | `13 px`, line-height `1.65` | `13 px`, line-height `1.6` | `600`; reserve two lines |
| Product/card metadata | `10–11 px` | `10–11 px` | `400–600`; muted and secondary |
| Button label | `12 px` | `12 px` in compact mobile variants | `600`; do not use all caps for Persian copy |
| Price | `12 px` on cards, `18 px` on PDP | `12 px` on compact cards | `700`; always include `تومان` |
| Eyebrow | `10 px` | `10 px` | `700`; small uppercase Latin route label plus Persian context |

Typography rules:

- Persian headings are right-aligned in content blocks and may use `<em>` for the green editorial phrase. Emphasis changes color and rhythm, not meaning.
- Keep product names to two lines in cards, use ellipsis only where the card height must remain fixed, and never truncate price or stock messaging.
- Use `fa-IR` numerals for customer-facing price/count content. Keep SKU, phone, order, payment, and tracking values isolated LTR with stable punctuation.
- The reading column for story pages is approximately `700 px` wide on desktop and should remain readable rather than stretching to the full container.

## Color System

The current design uses a restrained mint, green, cream-gold, and white palette. Green carries action and navigation meaning; gold is a quiet editorial label accent; there is no competing campaign rainbow.

| Token | Hex | Semantic use |
| --- | --- | --- |
| `page` | `#EDF7F5` | Customer canvas and calm background |
| `surface` | `#FFFFFF` | Cards, panels, forms, and primary reading surfaces |
| `surface-soft` | `#E3F0ED` | Hover/selected surfaces, image placeholders, mobile navigation hover |
| `surface-deep` | `#D2E5DF` | Category/image backgrounds and editorial blocks |
| `ink` | `#1F302C` | Primary text and dark content |
| `ink-soft` | `#29423A` | Supporting headings and navigation text |
| `muted` | `#71827C` | Secondary copy, metadata, helper text |
| `muted-light` | `#91A19B` | Low-emphasis metadata and inactive timeline states |
| `line` | `#C9DCD6` | Control borders and strong dividers |
| `line-soft` | `#DCEAE6` | Card borders and quiet dividers |
| `green` | `#2F6D5E` | Primary action, active state, links, available stock |
| `green-dark` | `#204C40` | Hero overlay, announcement, admin sidebar, primary hover |
| `gold` | `#AD8052` | Eyebrows, editorial labels, rating stars |
| `danger` | `#A64B40` | Error/destructive state |
| `admin-canvas` | `#EAF4F1` | Operations background |
| `admin-table-head` | `#F4FAF8` | Table header surface |

Semantic rules:

- `green` is the only global primary action color. Use `green-dark` for hover/pressed emphasis, not a new accent.
- Gold identifies editorial metadata and rating—not warnings, validation, or primary actions.
- Success can reuse green with a light `surface-soft` surface. Warning uses gold with a readable dark text pair. Errors use `danger` with a pale surface derived from the same hue when a filled message is needed.
- Preserve a readable contrast pair for every text/control state. Contrast must be measured for hero text over each image, not assumed from the palette alone.
- Never make audience, stock, sale, or selected state understandable by color alone; pair color with text, icon, border, or shape.

## Spacing and Layout Rhythm

The current visual rhythm is compact and deliberate rather than spacious by default.

- Page gutters: `16 px` on desktop through the `32 px` total reduction; `12 px` total reduction on mobile, producing a `24 px` outer gutter.
- Main max width: `1248 px` for customer content and footer; mobile customer/footer width is `min(calc(100% - 24px), 600px)`.
- Common rhythm steps: `4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 26, 28, 30, 34, 36, 45, 46, 55, 58, 62, 64 px`. Use the nearest existing step instead of adding one-off values.
- Home section separation is generally `46–62 px` desktop and `40–45 px` mobile. Product section headings use a tighter `16 px` relationship to their grids.
- Desktop product grid gap is `14 px`; mobile product grid gap is `8 px` horizontal and `10 px` vertical. Category desktop gap is `12 px`; mobile horizontal category gap is `9 px`.
- Standard card padding is `17–23 px`; compact mobile panels use `12–17 px`. Form and summary panels should align their internal left/right edges.

Shape and elevation:

- Radius tokens: `24 px` major section frame, `20 px` large panel, `16 px` card, `12 px` compact card/control, and `999 px` pill/chip.
- Product cards use a `17 px` outer radius and a `13 px` media radius; mobile reduces these to `14 px` and `10 px`.
- The shared shadow is `0 18px 54px rgba(31, 48, 44, 0.12)`. Product hover uses a lighter `0 13px 30px rgba(31, 48, 44, 0.10)` treatment.
- Borders do most of the separation work. Do not add shadows to every card or make the pale canvas feel like a dashboard of floating boxes.

Motion:

- Controls and color/border transitions: `160 ms`, ease.
- Product and category image movement: `260 ms`, with product scale around `1.025` and category scale around `1.04`.
- Hover translation stays subtle: `1–3 px` upward. Pressed controls return to their resting position or scale to approximately `0.95` for icon actions.
- Overlay surfaces use the shared shadow and should not animate in a way that delays access to search, menu, or cart.
- `prefers-reduced-motion: reduce` disables meaningful translation/scale and reduces transition/animation duration to near-zero while preserving state changes.

## Image Treatment

Current asset roles:

| Asset | Role | Treatment |
| --- | --- | --- |
| `hero-menswear.png` | Home hero, menswear story, studio overshirt product | Full-bleed cover crop; primary hero focal point is approximately `38% center`; high-priority load on the home hero |
| `linen-overshirt.png` | Women category, linen product, campaign/guide story | Cover crop for cards and story media; neutral fabric tones support the mint canvas |
| `olive-kids-set.png` | Children category and lookbook story | Cover crop; keep the child/garment context visible rather than over-zooming |
| `fabric-study.png` | Fabric-study editorial block, product gallery, article, neutral accessory products | Cover crop with a centered texture/detail focus |

Image rules:

- Product cards use `4:5` media. Product detail media uses the same `4:5` ratio with a maximum desktop height of `680 px`; related product cards may use a compact `1:1` media variant.
- Category cards use square `1:1` image frames. Category/story hero media uses a minimum `420 px` desktop height and becomes a `260 px` mobile media block.
- Use `object-fit: cover`; define `object-position` when a model or garment focal point would otherwise be cropped. The hero is the only current image with an explicit non-center focal point.
- Hero imagery receives a dark green gradient overlay for copy legibility. Supporting story cards use a restrained dark gradient; product cards do not place text over the garment.
- The hero image uses `fetchpriority="high"`; product/category/story images are lazy-loaded where they are below the fold. Preserve intrinsic ratio to avoid layout shift.
- Every product/category/story image needs meaningful Persian alt text. Decorative thumbnails and repeated gallery images may use empty alt text when the adjacent selected image already supplies the description.
- Image failure must leave the card geometry and text/action usable. Keep the pale placeholder surface and expose the product name, price, and action even when imagery is unavailable.

## Cards and Content Blocks

Product card:

- Anatomy: `product-media` → badge when applicable → wishlist icon → linked image → quick-add control, followed by category/SKU kicker, two-line title, color, and price.
- Outer surface is white with a quiet border and `17 px` radius. Media is inset by `7 px`, uses `4:5`, and has a `13 px` radius.
- Hover raises the card `3 px`, strengthens the border, adds the light product shadow, and scales the image by about `2.5%`. Quick add may reveal on desktop hover but is always visible on mobile.
- Badges are explicit text such as `تازه رسیده`, `انتخاب هفته`, `مناسب هدیه`, or a discount percentage. Never communicate sale/new status by color alone.
- Wishlist is an icon-only action with `aria-pressed`; its liked state changes the icon/fill treatment without changing card height.

Category card:

- Six cards use a square framed image, an indexed `01–06` marker, a Persian title, and a short note. On mobile the row becomes horizontally scrollable with an `88 px` minimum card width.
- Hover lifts the card `3 px` and scales the image `4%`; the label remains outside the image so it is readable in all states.

Hero and editorial blocks:

- `hero-primary` is a dark green-backed image canvas with bottom-aligned RTL copy, one primary light CTA, and one text link.
- `hero-story-card` is a small image-led link with a bottom gradient, English route eyebrow, Persian headline, and directional arrow.
- `hero-product-card` is an editorial featured-product panel with a product badge, image, product meta, and quick-add CTA. On mobile it becomes a compact horizontal row with a `104 px` image column.
- `collection-story` is a two-column fabric-study panel with a `1.12fr / 0.88fr` split, image caption, numbered index, copy, and one primary CTA. It stacks vertically on mobile.
- `trust-section` is a bordered pale surface with an intro, three icon-and-copy promises, and a dark journal card. It becomes a single vertical stack below `720 px`.

Transactional and operational blocks:

- Cart/checkout/account cards use white or translucent white surfaces, `16 px` radius, `1 px` soft borders, and no campaign decoration.
- Order rows expose code, status, date, amount, and arrow as one linked unit. Timelines pair a green filled dot with a labeled state and timestamp.
- Admin stat cards are `137 px` minimum height with compact labels, large numeric value, and supporting trend text. Data tables remain horizontally scrollable at their `690 px` minimum width rather than collapsing content into unreadable cells.

## Buttons and CTAs

Action hierarchy:

- Primary: green fill, white text, pill shape, and a single clear purchase/navigation verb such as `افزودن به سبد`, `دیدن تازه‌ها`, or `ادامه تا ثبت سفارش`.
- Secondary: transparent/white surface, `line` border, green-dark text. Use for alternate routes such as `راهنمای سایز` or `بازگشت`.
- Light hero action: white fill with green-dark text so it remains legible over the dark hero.
- Text link: no container, green text, directional arrow; use for low-emphasis navigation, not the only action required to complete a purchase.
- Icon-only: transparent or surface button, meaningful `aria-label`, and at least `44 × 44 px` target in the final production contract.

Current measurements:

- Standard button: `40 px` minimum height, `16 px` horizontal padding, `8 px` icon gap, `12 px` label, `600` weight, `999 px` radius.
- Large/purchase button: `48 px` minimum height and `22 px` horizontal padding; PDP and summary purchase actions use full width where the panel is narrow.
- Icon and text-link icons are `16 × 16 px`; action icons should remain optically centered in the RTL flow.
- Mobile hero buttons use a `44 px` minimum interactive wrapper; the visible inner fill may remain visually compact, but the physical target must never fall below the production accessibility contract.

States:

- Hover darkens primary green to `green-dark`, lifts ordinary buttons by `1 px`, and strengthens secondary borders.
- Pressed returns the button to its resting y-position. Icon actions may use the current `0.95` scale feedback.
- Focus-visible uses a `2 px` green outline with `3 px` offset; do not remove it for mouse styling.
- Disabled reduces contrast, removes pointer action, and retains the label explaining what is unavailable.
- Loading preserves the original label width, prevents duplicate submission, and exposes a status message.
- Error and success messages include text plus an icon/status treatment; color is supplemental.

CTA priority:

- One primary action per content block is preferred. On the home hero, the primary action is “دیدن تازه‌ها”; the editorial link is secondary.
- On PDP, selecting a size precedes the full-width add-to-cart action. The size guide is adjacent to the size label, not competing with purchase.
- On cart/checkout, the summary card owns the primary conversion CTA; item-level actions remain secondary and quiet.

## Overall Design Feel

The current design feels calm, tactile, and editorial because hierarchy comes from image scale, Persian type, restrained green contrast, and short copy—not from large promotional graphics. Mint surfaces create a soft store environment, dark green establishes confidence and legibility, and gold marks the small moments that feel curated: eyebrows, fabric notes, and ratings.

The interaction language is similarly quiet: borders, short lifts, gentle image scale, and clear arrows communicate affordance without making the store feel like a game. The visual quality depends on consistent ratios, careful RTL alignment, and enough room around the product name and price. If a future campaign needs stronger color, it should be contained to an editorial/story block and should not alter the global action semantics, checkout calm, or operational readability.

## Implementation handoff

### Component inventory and boundaries

Shared shell components:

- `AnnouncementBar`: shipping promise and collection link.
- `GlobalHeader`: brand, desktop nav, search/account/bag actions, route-active state.
- `MobileBottomNav`: four fixed quick actions with safe-area-aware page padding.
- `Footer`: brand statement, store/help links, newsletter, social/legal row.
- `OverlayLayer`: search panel, menu drawer, cart drawer, body scroll lock, close behavior, focus return.

Shared commerce components:

- `Breadcrumbs`, `SectionHeading`, `Button`, `IconButton`, `TextLink`, `Tab`, `StatusPill`.
- `CategoryCard`, `ProductCard`, `FeaturedProductCard`, `ProductRail`, `FilterRail`, `SortControl`.
- `MediaGallery`, `SizeSelector`, `InventoryMessage`, `DeliveryPromises`, `OrderSummary`.
- `CartItem`, `QuantityControl`, `CheckoutStepper`, `OrderTimeline`, `EmptyState`.

Page-specific compositions:

- `HomePage`: hero commerce composition, category route grid, fresh-products rail, fabric story, trust block.
- `CategoryPage`: category hero, subcategory grid, selected products, fit guide.
- `CatalogPage`: filters, audience tabs, result count, listing state.
- `ProductPage`: gallery, purchase information, details, related rail.
- `CartPage` and `CheckoutPage`: transaction panels and summary.
- `AccountPage` and `OrderPage`: account shell, destination content, order tracking.
- `StoryPage`: campaign/guide/article/lookbook hero and reading column.
- `AdminShell`: operations sidebar/top bar, stats, tables, product form, preview panel, order detail.

### Responsive behavior matrix

| Breakpoint | Header/navigation | Discovery/content | Commerce/account/admin |
| --- | --- | --- | --- |
| `>1050 px` | Full five-item desktop nav, `84 px` header | Three-column hero, four product columns, seven-track category grid | Two-column PDP/cart/account/admin compositions |
| `≤1050 px` | Smaller nav gaps and `11 px` nav labels | Hero proportions tighten; trust stays three columns | Preserve desktop composition until the next breakpoint |
| `≤820 px` | Last two desktop nav links hide; drawer remains complete | Two-column hero, three product columns, four category columns | `160 px` catalog rail, `180 px` account rail, two-column PDP, two-column admin stats |
| `≤720 px` | Mobile header, menu/search/bag icons, fixed four-item bottom nav | Stacked hero; two story cards side by side; horizontal categories; two product columns | Stack PDP/cart/checkout; filters become compact inline content; account/admin nav scrolls horizontally |
| `360–390 px` | `64 px` header; `44 px` production action controls | `24 px` total page gutter; `8 × 10 px` product gaps; no horizontal overflow | Form fields stack, prices stay untruncated, final actions clear the bottom nav |

### Design-token proposal

Use these names as the shared design-system contract and map them to the current CSS custom properties:

```text
color.page           #EDF7F5
color.surface        #FFFFFF
color.surface-soft   #E3F0ED
color.surface-deep   #D2E5DF
color.ink            #1F302C
color.ink-soft       #29423A
color.muted          #71827C
color.muted-light    #91A19B
color.line           #C9DCD6
color.line-soft      #DCEAE6
color.action         #2F6D5E
color.action-hover   #204C40
color.editorial      #AD8052
color.danger         #A64B40

font.display         Estedad, Vazirmatn, Tahoma, sans-serif
font.body            Vazirmatn, Tahoma, sans-serif
space.base           4px
radius.section       24px
radius.panel         20px
radius.card          16px
radius.control       12px
radius.pill          999px
elevation.overlay    0 18px 54px rgba(31, 48, 44, 0.12)
motion.control       160ms ease
motion.image         260ms ease
```

### Interaction and state model

| Surface | Required states and behavior |
| --- | --- |
| Header/search/menu/cart | Default, hover, focus-visible, open, closing, empty results, result list, error; overlay locks body scroll and exposes a close action |
| Product card | Default, hover, liked, unliked, badge, sale, low stock, image failure, quick-add success, quick-add failure |
| PDP | Gallery selected thumbnail, size unselected/selected/unavailable, size validation error, low/out stock, add loading, add success, price change |
| Catalog | Active audience, sort selection, filter selection, empty results, loading, request error; filter changes preserve the selected route |
| Cart/checkout | Empty, quantity update, remove, stock conflict, price change, address validation, shipping selection, payment processing/failure/pending, success |
| Account/order | Empty orders/addresses, saved form, validation, save success/error, status timeline, support link, session/security state |
| Admin | Loading, empty, table error, permission denied, draft, saving, saved, publish blocked, upload failure, order status transition, audit event |
| Global | Toast success/error, broken image fallback, offline or network error, reduced motion, keyboard focus |

### Accessibility and content rules

- Keep `lang="fa" dir="rtl"` at document level and use logical CSS properties for future layout work.
- Use semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `aside`, and `footer`. Keep one meaningful `h1` per route and a descending heading order.
- Preserve visible focus. The current focus style is a `2 px` green outline with `3 px` offset.
- Use `role="dialog"` and `aria-modal="true"` for search; label the dialog and return focus to the trigger after close. The menu/cart drawers need the same focus containment contract.
- Give every product image Persian alt text that identifies garment/color/context. Use empty alt text only for decorative or repeated images.
- Pair icon-only controls with accessible labels and `aria-pressed` for wishlist state. Use `aria-live` or `role="status"` for toasts and async completion messages.
- Isolate SKU, phone, coupon, order, payment, and tracking strings as LTR. Keep Persian labels and the `تومان` suffix in the surrounding RTL flow.
- Keep customer-facing prices in `fa-IR` formatting. Do not allow discount prices, product names, or form errors to clip at `360 px`.
- Measure WCAG AA contrast for body text, buttons, focus indicators, muted text, and every image overlay. Never rely on mint/green or gold alone to convey a state.
- Honor `prefers-reduced-motion`. Any future drawer or toast animation must preserve the same state and focus behavior when motion is reduced.
- Preserve labels on forms, describe validation beside the relevant field, and provide an error summary for multi-field checkout/admin forms.

### Acceptance checklist

- [ ] The current NOVA visual language is visible and unique: mint canvas, white surfaces, dark green action/hero, restrained gold editorial accent, soft 16–24 px geometry, Estedad/Vazirmatn typography, and the three-part commerce hero. Atelier must not visually converge on these signals.
- [ ] The home page follows the six-section order and exposes all six current category destinations.
- [ ] Desktop uses a `1248 px` customer container, three-part hero, four product columns, and shared alignment anchors.
- [ ] `820 px`, `720 px`, and `360 px` behavior matches the responsive matrix without horizontal overflow or clipped prices.
- [ ] Product cards retain `4:5` media, two-line title space, visible price, explicit badge text, wishlist state, and quick-add behavior.
- [ ] PDP, cart, checkout, account, story, and admin surfaces remain visually quieter than the home hero and preserve clear primary actions.
- [ ] Search/menu/cart overlays have labeled close controls, scroll locking, visible focus, and focus return.
- [ ] Persian copy, numerals, punctuation, mixed LTR identifiers, image alt text, and route breadcrumbs are checked.
- [ ] Loading, empty, error, offline, stock-conflict, payment-conflict, success, and reduced-motion states are represented in the design review.
- [ ] Contrast and touch-target QA is complete; the production `44 px` mobile icon-control implementation is either raised to the contract or explicitly accepted with a documented exception.

## Shared feature and API contract

Design 2 is intentionally visually distinct from Design 1, but it is not a
separate product. Both directions are adapters over the same customer,
commerce, identity, content, and admin interface defined in [`arch.md`](../../arch.md).
The difference is visual hierarchy, density, tone, typography, color, imagery,
and composition. Neither direction may remove a capability, invent a
direction-specific API, or change the meaning of a shared state.

### Feature parity with Design 1

The following capability groups are required in both directions. A route may
look different or use a different route label, but it must expose the same
customer-visible behavior and consume the same domain data.

| Capability group | Shared features | Design 2 visual adapter |
| --- | --- | --- |
| Discovery | Home merchandising, women/men/children category landing, catalog filters and sorting, search/autocomplete, pagination or incremental loading, product detail, recently viewed, and wishlist entry points | Mint/green editorial shell, category rail, product grid, quiet filter rail, and image-led PDP |
| Product truth | Product identity, audience/category, media and alt text, price and compare-at price, toman formatting, color, size, fit, care, stock, low-stock, unavailable, and sale states | White product cards, green status treatment, 4:5 media, size grid, material and fit detail blocks |
| Cart and checkout | Cart drawer and page, quantity updates, removal, coupon, stock/price conflict, address, shipping quote, payment method, payment recovery, confirmation, and order tracking | Calm white summary cards, three-step checkout, green primary action, and vertical tracking timeline |
| Identity and access | Customer phone/OTP authentication, guest continuation, session expiry/revocation, admin password plus MFA-ready flow, roles, permission denied, locked/rate-limited/error states, and security settings | Quiet centered customer/auth surfaces and dark-green operations shell; access policy stays outside the visual adapter |
| Account and support | Profile, communication preferences, addresses and destructive confirmation, orders and empty state, immutable order snapshot, support entry, security/session, notifications, and order-related help | Sticky account navigation, linked order rows, support cards, and readable status timeline |
| Editorial and utility | Campaign, guide, article, lookbook, about/brand story, trust/authenticity, shipping, returns, size, garment care, FAQ/contact, privacy/terms, 404, offline, and maintenance states | Reading-column content, fabric/story blocks, trust section, and low-decoration policy surfaces |
| Admin operations | Login, dashboard, products, product create/edit, variants, media, categories, inventory, orders, order detail, payments, promotions, customers, customer detail, content, audit log, and operations health | Dark-green sidebar/top bar with restrained tables, forms, status badges, and responsive priority cards |

### Shared API seam

Both directions must call the same typed interface from `packages/api-client`.
Page modules may choose different visual adapters, but they must not call
direction-specific endpoints or send direction-specific payloads.

| Shared module | Interface responsibilities | Typical consumers |
| --- | --- | --- |
| Catalog | List/search products, categories, facets, sort, pagination, product detail, media, availability, and related products | Home, category, catalog, search, PDP, wishlist |
| Cart | Read cart, add/update/remove lines, merge guest cart, apply coupon, reconcile price/stock conflicts | Product cards, PDP, cart drawer/page, checkout |
| Checkout | Validate address, quote shipping, select method, create/reuse payment intent, recover payment, create order, and read confirmation | Checkout, confirmation, tracking, support |
| Identity and access | Start/verify customer OTP, read/revoke sessions, authenticate admin, check role/permission, and record sensitive access events | Auth, account, admin shell, customer detail |
| Account | Read/update profile and preferences, manage addresses, list orders, read order snapshots/timeline, create support entry, and manage notifications | Account, orders, tracking, support |
| Content | Read published campaign, guide, article, lookbook, policy, FAQ, and SEO content; preview/publish content in admin | Editorial routes, footer links, admin content |
| Operations | Manage products, variants, media, categories, inventory, orders, payments, promotions, customers, audit events, and service health | Every admin route |

The implementation keeps the interface deep: pages depend on customer-visible
transitions and typed result/error states, while HTTP paths, cache keys,
retry rules, optimistic updates, and provider details remain inside the API
client and flow adapters. TanStack Query owns server state; Zustand owns the
cart draft, drawer/session preferences, and other intentionally local UI state.

### Shared data and state invariants

- Money is an integer toman value in the API and is formatted for Persian UI
  as `۲٬۴۹۰٬۰۰۰ تومان`; SKU, phone, coupon, payment, tracking, and order IDs
  remain isolated LTR strings.
- Product, variant, media, order, and customer identifiers are stable across
  directions. Design 2 may change labels and composition, not identifier
  semantics or response shape.
- Every core flow supports the shared baseline states: loading, populated,
  empty, validation error, request error, offline/slow network, disabled,
  success, stock conflict, price conflict, and payment conflict where
  applicable.
- Permission and privacy rules are enforced by the identity/access and use-case
  interfaces. A visual direction may show a locked or denied state but cannot
  decide authorization in the browser.
- Shared feature events use the same meaning: add-to-cart is blocked until
  required variants are selected, payment recovery reuses the same order
  intent, destructive actions are recoverable, and admin mutations create
  audit events.

### Direction-specific boundary

Design 2 owns the mint/green token set, editorial spacing, hero composition,
card geometry, imagery, Persian copy hierarchy, and responsive arrangements
documented above. Design 1 keeps its own Atelier palette, density, motion, and
editorial composition. Shared behavior, state names, data contracts,
accessibility requirements, and API interfaces belong to the common contract;
they must not be duplicated or forked per design direction.

### Parity acceptance checklist

- [ ] The Design 2 route/screen map covers every capability group listed above,
  including authentication, wishlist/recovery, utility policy content, and
  the complete admin surface.
- [ ] Design 1 and Design 2 use the same API-client interfaces, identifiers,
  money unit, state names, error envelope, and permission semantics.
- [ ] A feature can be added to the shared API/client seam once and consumed by
  both visual adapters without changing its request or response contract.
- [ ] A visual difference is expressed through tokens, layout, copy, and
  composition only; it is not implemented as a second cart, checkout, auth,
  account, or admin behavior module.

## Route and screen inventory

Customer routes currently represented by the design:

| Screen | Route pattern | Current visual responsibility |
| --- | --- | --- |
| Home | `#home` | Hero, category entry, fresh products, fabric story, trust, footer |
| Category | `#category/women`, `#category/men`, `#category/children` | Audience-specific hero, four subcategories, selected products, guide banner |
| Catalog | `#products`, `#products/women`, `#products/men`, `#products/children`, `#products/new`, `#products/sale`, `#products/accessories` | Result count, tabs, sort, filter rail, responsive product grid |
| Product detail | `#product/<id>` | Gallery, rating, price, material/color/SKU, size, stock, delivery, related products |
| Cart | `#cart` plus cart drawer | Item quantities, removal, subtotal/shipping/total, checkout CTA |
| Checkout | `#checkout/address`, `#checkout/shipping`, `#checkout/payment`, `#checkout/confirmation` | Three-step form flow, order summary, success state |
| Account | `#account`, `#account/profile`, `#account/addresses`, `#account/orders`, `#account/support`, `#account/security`, `#account/notifications` | Account navigation and destination-specific cards/forms |
| Tracking | `#order/<code>` | Order products, current status, vertical timeline, delivery expectation |
| Story/content | `#campaign`, `#guide`, `#article`, `#lookbook` | Story hero, reading measure, guide/article copy, optional related products |
| Not found | fallback route | Calm return-to-home message and one primary action |

Admin routes currently represented:

`#admin/login`, `#admin`, `#admin/products`, `#admin/products/new`, `#admin/products/<id>/edit`, `#admin/categories`, `#admin/inventory`, `#admin/orders`, `#admin/orders/<code>`, `#admin/payments`, `#admin/promotions`, `#admin/customers`, `#admin/content`, `#admin/audit`, and `#admin/operations`.

The admin navigation is intentionally complete: نمای کلی, محصولات, دسته‌ها, موجودی, سفارش‌ها, پرداخت‌ها, تخفیف‌ها, مشتریان, محتوا, گزارش تغییرات, and عملیات. Customer-facing campaign color should not leak into data tables, forms, or permission/error states.

## Figma organization

The design library may retain the existing top-level page location for continuity, but its visible title and frames should use the current NOVA direction:

```text
02 — NOVA ATELIER EDITORIAL
00 Cover and direction
01 Foundations and tokens
02 Primitive components
03 Commerce components
04 Storefront desktop
05 Storefront mobile
06 Cart and checkout
07 Account, tracking, and support
08 Editorial and guide pages
09 Admin desktop
10 Admin responsive
11 States and accessibility
12 Prototype flows
```

Use frame names that map directly to the current route inventory:

```text
NOVA/Home/Desktop/Default
NOVA/Home/Mobile/Default
NOVA/PLP/Desktop/Filtered
NOVA/PDP/Mobile/Size-Selected
NOVA/Cart/Desktop/With-Items
NOVA/Checkout/Mobile/Payment-Error
NOVA/Account/Desktop/Orders
NOVA/Story/Mobile/Fit-Guide
NOVA/Admin/Desktop/Orders
NOVA/Admin/Mobile/Product-Edit
```

For the shared behavioral baseline, use the [shared page and state matrix](../../arch.md#shared-page-and-state-matrix). This direction owns the visual tokens, page compositions, Persian content hierarchy, and responsive transformations documented here.

## Content and asset fixture

The current local fixture uses a small, balanced catalog so all three audiences are visible without turning the home page into an inventory dump:

```text
Navigation: زنانه، مردانه، بچگانه، تازه‌ها، تخفیف
Category destinations: اکسسوری، تازه‌ها، تخفیف
Home promise: ارسال رایگان برای سفارش‌های بالای ۳ میلیون تومان
Women: اورشرت لینن کمربندی — کرم جو دوسر — ۲٬۴۹۰٬۰۰۰ تومان
Men: پیراهن آکسفورد چهارخانه — سرمه‌ای / کرم — ۲٬۱۹۰٬۰۰۰ تومان
Children: ست دورس و شلوار زیتونی — زیتونی / شیری — ۱٬۷۹۰٬۰۰۰ تومان
Editorial: جزئیات کوچک، تفاوت بزرگ.
Trust: ارسال قابل پیگیری، تعویض ساده، پشتیبانی قبل از خرید
```

Use the real local assets under `apps/web/assets/` and keep their source/focal-point/alt-text record with the design handoff. Do not introduce decorative sneaker imagery or a dark neon palette into this direction; it is a clothing system with a separate NOVA identity.

## Prototype flows

Customer flows:

1. Home → زنانه → subcategory/product rail → product detail → size → cart.
2. Home → تازه‌ها → product → quick add → cart drawer → checkout.
3. Home → بچگانه → product → size → cart → shipping and payment.
4. Search → matching product result → PDP → size validation → add to cart.
5. Cart → address → shipping → payment → confirmation → tracking.
6. Account → orders → order detail → support/guide when a question remains.

Admin flows:

1. Admin login → dashboard → low-inventory alert → inventory table.
2. Dashboard → products → new/edit → sizes and publish state → save confirmation.
3. Orders → order detail → preparation state → event timeline.
4. Content/promotions → draft or publish state → operational feedback.

Each flow needs a default path and at least one recovery state. The prototype should demonstrate the same primary green action and quiet transactional surfaces across every step.

## QA and completion criteria

- This design document, the Figma page, and the local implementation use the same NOVA palette, font families, radius scale, section order, and route names.
- Desktop, tablet, primary mobile, and narrow mobile frames are checked at `1440`, `1024`, `820`, `720`, `390`, and `360 px` widths where the breakpoint changes are material.
- The home hero remains legible with slow or failed imagery; product/card geometry does not jump while images load.
- All user actions have visible hover/focus/pressed/disabled/loading/success/error states and the same state is understandable without color.
- RTL alignment is verified for headings, breadcrumbs, arrows, tab order, drawers, size controls, quantities, and order timelines. Directional arrows are mirrored only when their meaning is directional rather than decorative.
- Customer and admin views preserve clear heading order, Persian alt text, LTR technical identifiers, `تومان` formatting, focus visibility, and reduced-motion behavior.
- No old CHROMA color-block, cobalt-primary, campaign-rainbow, or sneaker-specific rule remains in the current design baseline.
