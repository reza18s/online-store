# 01 / ATELIER EDITORIAL

> Complete Figma design specification for a premium, image-led Persian clothing store serving `مردانه`, `زنانه`, and `بچگانه`. This is one of three equal, complete design candidates for NOVA Store.

## 1. Direction

ATELIER EDITORIAL is NOVA's **luxury fashion-magazine direction**: warm ivory paper, oxblood actions, charcoal typography, champagne/brass editorial accents, expressive Persian display type, portrait-led fashion photography, restrained geometry, and asymmetric magazine composition.

This direction must remain unmistakably different from Design 2. It must **not** use a ivory/oxblood storefront identity, oxblood primary actions, soft-boutique card language, or the same compact three-part commerce hero used by NOVA Atelier Editorial. Shared commerce behavior remains identical, but the visual system, image rhythm, typography, geometry, and composition are independent.

The direction must feel:

- Editorial before decorative: every composition should resemble a considered fashion journal spread while remaining easy to shop.
- Premium through typography, crop, material tone, controlled negative space, and precise alignment rather than excessive shadows or ornamental UI.
- Clearly Persian RTL, with an owned wordmark and intentional mixed-direction handling rather than a mirrored Western template.
- Product-aware: title, price, variant, stock, and primary action remain clear even when the page uses dramatic editorial composition.
- Timeless rather than trend-heavy; the system should still feel credible when campaign photography changes.
- Suitable for women, men, and children without becoming generic or family-marketplace-like.

All pages and components in this specification remain required. Design exploration may change composition and visual hierarchy, but it does not remove route, state, accessibility, admin, or API parity requirements.

## 1.1 Attached reference analysis and redesign contract

The following review separates what is visible in the supplied image from what
is inferred and what should be implemented. Measurements marked
`Recommended` are normalized design targets, not claims about literal pixels
inside the perspective mockup.

### Layout Structure

**Observed:** The foreground screen is a wide desktop storefront on a very
light ivory canvas. Its first viewport is dense but not crowded: a compact header,
an asymmetric three-part hero, a row of visual category shortcuts, and the
beginning of a four-column product grid. The hero uses one dominant lifestyle
card, two smaller supporting garment cards, and one narrow featured/quick-add
card. Content is centered with a small, even outer gutter.

**Inferred:** The design is optimized for immediate product discovery rather
than a full-bleed campaign hero. The supporting cards explain the category
story while the featured card supplies a direct commercial action. The rounded
geometry and pale background make the photographs carry most of the contrast.

**Recommended:** Build the primary desktop frame at `1440 × 1024 px` with a
`1280 px` maximum content width, `80 px` outer gutters, a 12-column grid, and
`16 px` column gaps. Use an asymmetric `8 / 4` editorial hero split with a `500–620 px` composition
height and `16 px` gaps. The dominant card may internally split image and copy
at approximately `55 / 45`; the supporting column stacks two cards; the
featured card stays one uninterrupted compact card. At `1280 px`, use `64 px`
gutters. At `768 px`, reduce to an 8-column grid and stack the dominant story
above the supporting cards. At `390 px`, use `16 px` gutters, a 4-column grid,
and `12 px` gaps; the narrow editorial rail moves below the hero image as two full-width editorial blocks.

### Section Order

The reference-calibrated home order is:

1. Compact global header with centered wordmark and utility actions.
2. `EditorialHeroSpread`: one dominant portrait-led fashion story plus one narrow editorial/product rail.
3. `CategoryRail`: seven visual category shortcuts with Persian labels.
4. `NewArrivals`: the first comparison-oriented product grid.
5. `CollectionStory` or material note, using a quieter editorial image block.
6. `BestSellers` or audience stories, below the first purchase-oriented scan.
7. Trust/delivery/returns strip, journal/newsletter, and footer.

The screenshot visibly prioritizes sections 1–4; sections 5–7 remain required
but must not compete with the first product grid. On mobile, use header → hero
story → supporting-card rail → category rail → two-column products → editorial
story → trust/footer, with fixed bottom navigation reserved below the content.

### Navigation

**Observed:** The wordmark may be optically centered or intentionally offset within the editorial grid; it must not reproduce Design 2's centered three-column commerce header. Small Persian navigation links sit
near the physical right side, while the physical left utility cluster contains
an outlined sign-in pill, a oxblood cart control, and search/account icons.
The header is quiet and does not consume the first viewport with a tall promo
bar.

**Recommended:** Use a `72 px` desktop editorial header and `60 px` mobile header inside
the `1280 px` shell. Preserve the centered mark independently of both side
clusters. In RTL, primary navigation reads from the inline end and utility
actions remain at the opposite side; do not rely on DOM order alone to center
the logo. Expose `زنانه`, `مردانه`, `بچگانه`, `اکسسوری`, `جدیدترین‌ها`,
`کالکشن‌ها`, and `تخفیف` in the desktop navigation, with `12–13 px` labels and
`44 px` minimum targets. Use a `36–40 px` cart button and a `36 px` outlined
compact login control. On mobile, collapse links into an RTL sheet, keep search and cart
visible, and add a fixed `64 px` bottom navigation with safe-area padding.

The active category uses a oxblood label or a `2 px` underline; do not add a
large filled navigation tab that competes with the hero. Search opens a modal
surface with focus trapping; Escape closes it and returns focus to the trigger.

### Typography

**Observed:** The image uses a compact Persian sans-serif UI. Headings are
medium-sized and short; product names and prices are noticeably smaller than
the hero copy. The logo is a custom wordmark/mark, not ordinary body text.

**Inferred:** Legibility and product scanning matter more than a dramatic
editorial display face. The type scale should leave room for imagery and four
product columns.

**Recommended:** The exact font cannot be proven from the raster reference.
Use an expressive licensed Persian display family such as `Peyda Variable` or an owned editorial face for campaign/H1 typography, with `Vazirmatn` for body/UI and as the fallback, then `Tahoma` and a
system sans-serif. Use `Inter` for isolated Latin/SKU/payment strings. Keep the
wordmark as an SVG or owned image asset rather than rendering it with a font.

| Role | Desktop | Mobile | Family / weight | Rule |
| --- | ---: | ---: | --- | --- |
| Hero title | `30/40 px` | `24/32 px` | Peyda 700 | Maximum two lines; short, high-contrast copy |
| Section title | `24/32 px` | `20/28 px` | Peyda 700 | Align to the product-grid anchor |
| Card title | `14/22 px` | `13/20 px` | Vazirmatn/Peyda 600 | Maximum two lines |
| Body | `14/23 px` | `14/23 px` | Vazirmatn 400 | Maximum measure `32–42 ch` |
| Navigation / label | `12/20 px` | `12/20 px` | Vazirmatn 500 | No all-caps Persian; use Latin caps only for small eyebrow labels |
| Price | `14/22 px` | `13/21 px` | Vazirmatn 700 | Persian digits plus `تومان`; never hide on hover |
| Caption / stock | `11/18 px` | `11/18 px` | Vazirmatn 400 | Must remain at least `11 px` and pass contrast |

Use `0` letter-spacing for Persian text. Use `0.02em` only for Latin labels.
Keep mixed strings isolated with `dir="ltr"` for SKU, phone, payment, and
tracking references; numerals in customer prices remain Persian.

### Color System

**Direction lock:** Atelier uses warm ivory, charcoal, oxblood, and champagne/brass. Mint and forest green are reserved for Design 2 and must not appear as Atelier's global canvas, primary CTA, selected state, or navigation identity.

**Observed:** The page canvas is a very light blue-green/mint. Cards are white
or soft warm-gray, text is charcoal, and the primary CTA is a deep muted
green. A small warm gold accent appears in the centered wordmark and minor
editorial details; it is not a dominant action color.

**Recommended Atelier palette:**

| Semantic token | Value | Use |
| --- | --- | --- |
| `ivory/50` | `#F6F1E8` | Main storefront paper canvas |
| `surface/0` | `#FFFCF7` | Product, form, drawer, and reading surfaces |
| `surface/soft` | `#EEE6DA` | Secondary editorial blocks and quiet controls |
| `surface/warm` | `#E7DED2` | Garment/image backing and tactile campaign fields |
| `ink/950` | `#272220` | Headings, prices, primary icons |
| `ink/700` | `#5E534D` | Navigation and supporting text |
| `ink/500` | `#8A7D75` | Metadata only |
| `oxblood/700` | `#6D2838` | Primary CTA, active state, cart, focus accent |
| `oxblood/800` | `#54202D` | Hover/pressed and deep editorial surfaces |
| `oxblood/100` | `#F0DEE3` | Selected/soft state |
| `line/200` | `#D8CEC2` | Borders and dividers |
| `champagne/600` | `#B79A6B` | Folio numbers, editorial rules, wordmark detail |
| `success/700` | `#39705A` | Success state with text/icon |
| `warning/700` | `#87643A` | Low-stock/delivery warning |
| `error/700` | `#A83D38` | Validation/payment error |


Do not introduce Design 2's mint/forest-green identity into Atelier customer-facing surfaces. Text must meet WCAG AA contrast; muted
green is metadata only and never carries price, stock, error, or primary-action
meaning. Statuses always include text or an icon in addition to color.

### Spacing and Layout Rhythm

Use a compact 4-point base scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px`.
The visible reference is intentionally tighter than the previous editorial
specification: the hero-to-category gap is `24 px`, category-to-products is
`32 px`, hero internal gaps are `12–16 px`, and product-card content starts
`10–12 px` below the image. Desktop shell gutters are `80 px` at `1440 px` and
`64 px` at `1280 px`; mobile gutter is `16 px`.

Use `16 px` for the primary grid gap, `12 px` for mobile product/category
gaps, `24 px` for card padding on large panels, and `12–16 px` for compact
cards. Recurring radii are `4 px` for fields and editorial surfaces, `6 px` for product cards and hero media, `8 px` only for drawers/sheets, and `999 px` only for tiny status chips or circular icon targets. Primary storefront CTAs are rectangular with `4–6 px` radius.
Avoid large `96–128 px` whitespace blocks above the first product rail.

Use only a soft elevation: `0 8px 24px rgba(39, 34, 32, 0.08)` for floating
surfaces and `0 2px 8px rgba(39, 34, 32, 0.06)` for selected cards. Most
product cards use a border or surface contrast instead of a shadow.

### Image Treatment

**Observed:** The dominant hero image is a warm, real-person fashion portrait
inside a rounded card. Supporting cards use contained shirt/garment imagery on
warm-gray fields. Product imagery is mostly square, centered, isolated, and
easy to compare. Images are not covered by a heavy gradient.

**Recommended:** Use `cover` for the lifestyle hero with `4–6 px` radius and
an explicit focal point. Keep a copy-safe area in the right-hand copy panel
for RTL text; do not place copy on top of a face or garment detail. Supporting
story cards use `4:3` media. Home and listing product cards use a portrait `4:5` image frame with a white
or warm-soft surface and `6 px` radius; the garment occupies roughly `72–82%`
of the frame with breathing room around its silhouette. Category thumbnails
use `1:1` contained crops at `56–64 px`.

The supplied WebP is a visual reference/mockup, not a production asset. Do not
use the screenshot itself as the hero image and do not treat people/model
photography as exact product masters. Every production asset needs source,
license, dimensions, focal point, Persian alt text, lazy-loading behavior, and
an explicit failed-image fallback.

### Cards and Content Blocks

Use three visible card families in the first viewport:

- `HeroStoryCard`: restrained `4–6 px`, image/copy split, short title, one
  oxblood editorial rectangular CTA, and no more than one supporting sentence.
- `SupportGarmentCard`: `4–6 px` radius, contained garment image, small
  category label, and one short link/action. Two cards stack on desktop and
  become a horizontal rail on mobile.
- `ProductCard`: portrait `4:5` image, small oxblood editorial sale/availability marker at the
  upper inline-start, two-line name, color swatches, price, and a circular
  quick-add action anchored at the lower inline-start. Card surface remains
  white with no large border.

Category tiles use a `56–64 px` rounded image well, a `12 px` Persian label,
and a `10–16 px` gap. Selected/hover cards change surface or border color in
`140 ms`; they do not scale in a way that shifts the grid. Loading cards
preserve the exact final image and content heights.

### Buttons and CTAs

The primary action is a oxblood pill (`36–40 px` high on compact cards,
`44–48 px` on hero/PDP actions), `12–18 px` horizontal padding, `999 px`
radius, white text, and a `16 px` line icon. The hero uses one primary CTA;
secondary actions use a white/transparent surface with a `1 px` oxblood border.
The sign-in control is outlined and compact. Product quick-add is a `40 px`
oxblood square-round action with a bag/plus icon and a Persian accessible label; it never
depends on hover.

States are explicit: hover uses `oxblood/800`, pressed uses `ink/950`, focus
uses a `2 px` outside `oxblood/700` ring plus a `2 px` light separation,
disabled uses a muted surface and label, loading preserves label width, and
success uses icon + `افزوده شد` or `به سبد اضافه شد`. Minimum pointer target is
`44 × 44 px` even when the visible glyph is smaller.

### Overall Design Feel

The target is **luxury fashion journal commerce**: a quiet pale canvas, oxblood
navigation and actions, warm neutral photography, restrained editorial cards, compact
Persian sans typography, and a deliberate amount of product information. The
quality comes from consistent crops, a centered wordmark, restrained contrast,
and a strong 16 px spacing rhythm—not from oversized headlines, ornate
backgrounds, or heavy shadows. The first scan should communicate “curated
clothing store” within one viewport and make the next action obvious.

## 1.2 Direction uniqueness lock

Atelier is approved only when it can be recognized with the NOVA logo removed.

Required distinguishing signals:

- Warm ivory paper canvas, never mint.
- Oxblood primary actions, never forest green.
- Champagne/brass folio accents instead of green/gold boutique accents.
- Asymmetric `8 / 4` editorial hero rather than Design 2's three-part commerce cluster.
- Portrait `4:5` fashion imagery as the dominant product language.
- Restrained `4–8 px` radii; pills are limited to tiny metadata/status uses.
- Rectangular editorial CTAs rather than a pill-heavy component language.
- Expressive Persian display typography for campaign/headline roles.
- Magazine-style captions, folio numbers, rules, and controlled negative space.
- Transactional pages become quieter and more systematic, but keep the ivory/oxblood identity.

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

### 3.1 Base layer: shadcn/ui structure and animate-ui motion

The first Atelier Editorial implementation uses **shadcn/ui as the structural
and accessibility contract** and **animate-ui as the motion layer**. shadcn/ui
components are source-owned compositions rather than a remote widget library;
the implementation team copies the required primitives into the NOVA UI
package, keeps the variants below, and owns the tokens. animate-ui follows the
same copy-first approach and adds Motion-based transitions to shadcn-style
primitives. The Penpot file therefore documents both the resting component and
its named interaction states so the design remains implementation-ready even
before React code is connected.

| Home region | shadcn/ui base | Penpot component/state to show | animate-ui behavior |
| --- | --- | --- | --- |
| Announcement, header, category links | `NavigationMenu`, `Button`, `Badge` | `AE / Header / Desktop` with `default`, `sticky`, `menu-open` | Active indicator fades in at `140 ms`; menu content uses a short opacity/translate entrance |
| Audience switcher | `Tabs` (`variant=line`) | `Tabs / audience` with `زنانه`, `مردانه`, `بچگانه`; active underline and focus ring | Underline slides between tabs at `140 ms`; no layout jump |
| Hero and editorial CTAs | `Button` (`default`, `outline`, `ghost`) | `Button / primary`, `Button / secondary`, `Button / outline`, `Button / loading` | Hover color transition; tap feedback is color-only and never scales text or the purchase target |
| New-arrival rail | `Card`, `Badge`, `Button` | `Product Card / default`, `sale`, `low-stock`, `out-of-stock`, `loading` | Image zoom on view is capped at `1.02×` over `220 ms`; wishlist icon uses tap animation |
| Product filters and sorting | `Select`, `Checkbox`, `RadioGroup`, `Chip` | `Filter Bar / applied`, `Filter Bar / empty`, `Filter Sheet / open` | Filter sheet enters from the physical right in RTL; selections use a quick fade, not a reflowing scale |
| Mobile menu and cart | `Sheet`, `SheetHeader`, `SheetContent`, `SheetFooter` | `Sheet / menu`, `Sheet / cart`, `Sheet / filters`, including scrim and focus-return note | `260 ms` slide with the shared sheet easing; Escape closes and focus returns to the trigger |
| Search | `Command`/`Dialog`, `Input`, `Button` | `Search / empty`, `typing`, `suggestions`, `no-results`, `error` | Search surface fades in; result groups use staggered `40 ms` opacity only |
| Collection story and details | `Accordion`, `Separator` | `Accordion / closed`, `open`, `loading` | Height and opacity animate together; reduced motion keeps opacity only |
| Trust and status messages | `Alert`, `Toast`/Sonner, `Badge` | `Inline Message / success|warning|error|info`, `Toast / added-to-cart` | Presence animation is `140–180 ms`; status remains understandable without color |
| Loading and slow images | `Skeleton` | `Skeleton / product`, `Skeleton / hero`, `Image / failed` | Skeleton uses a restrained opacity pulse; no shimmer that competes with the editorial hero |
| Header and product actions | Lucide icon primitives | `Icon Button / search|wishlist|cart|menu`, with `default`, `focus`, `pressed` | Use animated Lucide states on hover/tap/view; always provide a Persian accessible label |

The source contracts are the official shadcn/ui [Button](https://ui.shadcn.com/docs/components/base/button),
[Card](https://ui.shadcn.com/docs/components/base/card),
[Navigation Menu](https://ui.shadcn.com/docs/components/base/navigation-menu),
[Sheet](https://ui.shadcn.com/docs/components/base/sheet), and
[Tabs](https://ui.shadcn.com/docs/components/base/tabs) patterns. animate-ui is
the motion reference for [animated components](https://animate-ui.com/docs/components),
[installation/copy-first usage](https://animate-ui.com/docs/installation), and
[animated Lucide icons](https://animate-ui.com/docs/icons/lucide). These links
are implementation references, not assets to copy into the Penpot file.

### 3.2 Penpot foundation board and variant naming

Add a reference board on the `AE · Home` page named
`AE / Foundations / shadcn-animate` beside the two home frames. It is an
editable handoff board, not a sixth visual direction. Keep one component per
group and name states with the same slash contract used by the UI package:

```text
Button / primary / default
Button / primary / hover
Button / primary / focus
Button / primary / pressed
Button / primary / disabled
Button / primary / loading
Tabs / audience / inactive
Tabs / audience / active
Card / product / default
Card / product / sale
Card / product / loading
Sheet / filters / closed
Sheet / filters / open
Accordion / details / closed
Accordion / details / open
Icon Button / wishlist / default
Icon Button / wishlist / hover
Icon Button / wishlist / pressed
```

Each state must retain the same bounds so a developer can map it to a
shadcn-style variant without guessing. Put a small motion annotation beside
animated states (`trigger`, `property`, `duration`, `easing`, `reducedMotion`)
and keep the three audience labels visible in every navigation or tab example.
The board uses the exact colors, type, spacing, and focus treatment from this
design document; it must not introduce a second palette.

Historical Penpot handoff (verified `2026-09-04` on page `AE · Home`):

| Penpot board | Board ID | Verified contents |
| --- | --- | --- |
| `AE / Home / Desktop / Default` | `91ff5271-c10d-803f-8008-93c5d6a77550` | `1440 × 2954`; revised studio-fashion hero, corrected headline rhythm, audience story, line Tabs, four product Cards, collection story, trust/journal, and footer |
| `AE / Home / Mobile / Default` | `91ff5271-c10d-803f-8008-93c5d6d439dd` | `390 × 2248`; revised studio-fashion hero, contained meta/action stack, all three audience Cards, two-column product rail, editorial rail, trust stack, footer, and fixed bottom navigation |
| `AE / Foundations / shadcn-animate` | `3f608dcd-52e9-8034-8008-95073b2d75f3` | `1280 × 1500`; 115 editable layers from the pre-reference palette; retokenize to the ivory/oxblood editorial system before approval |

The desktop and mobile hero notes above are historical records of the earlier
Penpot pass. They remain useful for naming and state coverage, but they are not
the visual authority for this revision. New or revised frames must use the
attached reference analysis: warm ivory editorial canvas, centered wordmark,
`HeroCommerceCluster`, seven-item category rail, portrait editorial product cards, and the
new Peyda/Vazirmatn type scale. Do not mark the refreshed editable frames
approved until their screenshots and node-level token inspection are captured.

### 3.3 shadcn token aliases for Atelier

Map the existing Atelier primitives to the names used by the shadcn theme so
the design and implementation share one vocabulary:

| shadcn variable | Atelier token | Value | Usage |
| --- | --- | --- | --- |
| `--background` | `color/bg/page` | `#F6F1E8` | Pale ivory editorial storefront canvas |
| `--card` | `color/bg/surface` | `#FFFFFF` | White product and transactional card surface |
| `--foreground` | `color/text/primary` | `#272220` | Charcoal-oxblood primary text and icons |
| `--muted-foreground` | `color/text/secondary` | `#5E534D` | Supporting copy and navigation |
| `--border` | `color/border/default` | `#D8CEC2` | Inputs, cards, and dividers |
| `--primary` | `color/action/primary` | `#6D2838` | Deep muted oxblood primary action and active state |
| `--primary-foreground` | `color/text/inverse` | `#FFFFFF` | Text on primary action |
| `--secondary` | `color/bg/subtle` | `#EEE6DA` | Secondary button and category surface |
| `--accent` | `color/accent/editorial` | `#B79A6B` | Small wordmark/editorial accent only |
| `--destructive` | `error/700` | `#A83D38` | Destructive action and error state |
| `--radius` | `radius/control` | `8 px` | Fields and utility controls; storefront actions use `999 px` |

Do not create a separate dark theme or a second “kit” palette for this
direction. If the implementation later adds dark admin surfaces, it must be a
named admin theme and must not alter the customer-facing Atelier aliases.

### 3.4 Motion and accessibility contract

| Motion token | Value | Applies to |
| --- | --- | --- |
| `motion/fast` | `140 ms ease-out` | Button, tab, icon, badge, and color feedback |
| `motion/image` | `220 ms ease-out` | Product image crossfade and capped image zoom |
| `motion/sheet` | `260 ms cubic-bezier(0.2,0.8,0.2,1)` | RTL menu, filter, and cart sheets |
| `motion/stagger` | `40 ms` per row, maximum 4 rows | Search suggestions and small result groups |

Reduced-motion mode removes translation, zoom, and stagger; retain a short
opacity transition only when it communicates a state change. No interaction
may depend on hover, and no motion may reduce a `44 × 44 px` pointer target.
Keyboard focus uses a light `2 px` separation plus `2 px` `#6D2838` outer ring.
Sheet and dialog states document focus trapping, Escape,
and return-focus targets. Labels stay Persian RTL while phone, SKU, coupon,
payment, and tracking values remain isolated LTR strings. shadcn's documented
[RTL support](https://ui.shadcn.com/docs/rtl) is the implementation baseline.

### 3.5 Reference audit and guardrails

The supplied references inform pacing and component behavior; they do not
replace NOVA's Persian content, Pexels source records, or ownership of the
resulting design. Direct access and evidence level are recorded so a blocked
reference is not mistaken for a verified inspection.

| Reference | Useful direction for Atelier | Evidence and guardrail |
| --- | --- | --- |
| [Momento — Fashion Website Design](https://dribbble.com/shots/25685557-Momento-Fashion-Website-Design) | Restrained neutral/earth palette, large image-led opening, and deliberate editorial pacing. The listed palette includes `#EBEBEC`, `#BCBEBF`, `#0D0B09`, `#6D6E6C`, `#5A4224`, and `#A7592F`; use it only as a mood cue because Atelier owns the ivory/oxblood system defined in Section 1.1. | Direct page was viewable, but its description frames the work as an architecture landing-page exploration and credits third-party imagery. Do not copy its artwork or imagery. |
| [Fashion E-Commerce Website Design / Clothing Store UI](https://dribbble.com/shots/27637205-Fashion-E-Commerce-Website-Design-Clothing-Store-UI) | Clean typography, generous whitespace, filterable product grid, quick Men/Women switching, ratings, color swatches, PDP gallery/details, promo badges, and a sticky mobile quick-add path. Translate the audience switch to `زنانه / مردانه / بچگانه` and keep size, price, stock, and returns visible. | Direct page was viewable and is a visual reference only; retain NOVA copy, RTL order, toman pricing, and Pexels metadata. |
| [Saden — UI/UX Project / Men's Clothing Store Website](https://dribbble.com/shots/27416730-UI-UX-Project-Men-s-Clothing-Store-Website) | The supplied reference combines an airy pale canvas, espresso/taupe neutrals, a compact centered header, a dominant menswear hero, supporting garment tiles, a quick-add product card, a category shortcut rail, and a product rail with sale badges, color swatches, and visible pricing. Its listed palette is `#F6F1E8`, `#453C36`, `#23221F`, `#A5A19B`, and `#8E7D6F`; use those as mood cues only. | The page is a visual reference by Mahla Hamzeh for the Saden menswear concept. The attached WebP is a presentation composite with overlapping desktop/mobile views, so the overlaps are not literal page layout and the imagery is not a NOVA asset. Preserve Atelier ownership, Persian RTL content, toman pricing, and the ivory/oxblood token system defined in Section 1.1. |
| [Yokoto Fashion Clothing UI Kit](https://ui8.net/keitoto/products/yokoto-fashion-clothing-ui-kit) | Use the kit's implied system-level organization as a cue for reusable variants, auto-layout, and page coverage. | The UI8 page returned `403 Forbidden`, so no proprietary screen or asset is treated as verified. A secondary search result mentions 40+ screens and organized auto-layout; that is a planning hint only. |
| [Paperpillar E-commerce UI Kit](https://www.figma.com/design/M8bAXlqBa8PSV5AKu7GgiU/E-commerce-Website-UI-Kit---Paperpillar--Community-?node-id=54-93\&p=f\&t=CvG3W6OZuxFMjhyG-0) | Use the reported component-library/style-guide mindset: shared search, icon, title-card, button, footer, responsive, and auto-layout variants. | The direct Figma URL was blocked by the browser safety check; a secondary listing describes desktop/responsive screens and a component library. Do not claim direct file inspection or copy proprietary components. |

The home page is the first applied screen: its hero CTAs use the Button
contract, the audience row uses line Tabs, product rails use Card/Badge, and
mobile menu/filter/cart states are represented by Sheet variants. The other
four design directions remain unchanged.

### 3.6 Attached reference adaptation for the first design

The supplied WebP is now the direct visual reference for the first Atelier home
screen. This is an adaptation, not a reproduction: keep NOVA's Persian copy,
RTL behavior, ownership of assets, toman pricing, and complete commerce
coverage while adopting the reference's compact ivory/oxblood composition.

#### Observed cues

- A very warm ivory canvas gives the page an almost-white field while keeping a
  visible cool tint around the cards.
- The header is short and centered around a custom wordmark; the login, cart,
  search, and account actions are small, pill-shaped, or line icons.
- The opening composition is a commerce cluster: one dominant lifestyle story,
  two supporting garment tiles, and one narrow featured/quick-add card.
- A seven-item visual category rail follows immediately, with small rounded
  image wells and short labels.
- The product rail begins early. Cards use portrait fashion product imagery,
  small oxblood markers, color dots, visible prices, and a circular add action.
- Rounded corners are consistent across hero cards, category wells, and product
  surfaces; the reference uses softness instead of heavy borders or shadows.

#### Applied Atelier update

For `AE/Home/Desktop/Default` and `AE/Home/Mobile/Default`:

1. Make the `HeroCommerceCluster` the canonical first viewport. Use a `7 / 3 /
   2` desktop split, `320–360 px` cluster height, `16 px` gap, one dominant portrait campaign panel and one narrow editorial rail with a direct product CTA. The selected story may default to `مردانه`, but `زنانه` and
   `بچگانه` remain first-class navigation choices.
2. Use a `72 px` desktop editorial header and `60 px` mobile header with no default
   announcement bar. Center the wordmark independently from both utility
   groups and keep every icon target at least `44 × 44 px`.
3. Place a seven-item `CategoryRail` directly after the hero. Each item has a
   `56–64 px` rounded image well, a `12 px` label, and a `10–16 px` gap.
   Mobile keeps the rail horizontally scrollable with the first item fully
   visible and part of the next item visible as an affordance.
4. Make `NewArrivals` the first product comparison surface. Use a `1:1` home
   product image, four desktop columns, two mobile columns, a small green
   badge, `12–14 px` color swatches, a visible toman price, and a `40 px`
   circular quick-add action. Products requiring a size choice open the size
   sheet instead of silently adding a default.
5. Keep `CollectionStory`, `TrustJournal`, and the footer below the first
   product scan. They should use the same ivory/oxblood tokens with a little more
   vertical breathing room, remain inside the Atelier ivory/oxblood theme.
6. On mobile, the editorial rail becomes two stacked full-width blocks, category tiles
   remain touchable, products remain two columns, and the fixed bottom nav sits
   above the safe area. No purchase action may be hidden behind hover.

#### Reference-to-Atelier token translation

| Reference cue | Atelier translation | Rule |
| --- | --- | --- |
| Pale ivory canvas `#F6F1E8` family | `ivory/50` `#F6F1E8` | Use as the single customer-facing page background. |
| Dark oxblood action and text | `oxblood/700` `#6D2838` / `ink/950` `#272220` | Use for CTAs, selected states, headings, prices, and primary icons. |
| Soft green secondary blocks | `surface/soft` `#EEE6DA` / `oxblood/100` `#F0DEE3` | Use for category wells, selected controls, and quiet callouts. |
| Warm garment tiles | `surface/warm` `#E7DED2` | Keep contained imagery readable; do not tint product photography green. |
| Small gold wordmark detail | `gold/600` `#B79A6B` | Decorative accent only; never use for body copy or price. |
| Rounded white product card | `surface/0` `#FFFFFF` with `line/200` | Prefer surface contrast and a soft shadow over a dark outline. |

The responsive screen-stack contract remains the source of exact viewport
bounds. This update changes the `HOME` composition and its visual tokens; it
does not change the audience set or the requirements for loading, empty,
error, offline, stock-conflict, and payment-conflict states.

## 4. Responsive frames and grids

| Target | Frame | Content | Columns | Margin | Gutter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide desktop | 1728 px | 1408 px | 12 | 160 px | 16 px |
| Primary desktop | 1440 px | 1280 px | 12 | 80 px | 16 px |
| Compact desktop | 1280 px | 1152 px | 12 | 64 px | 16 px |
| Tablet | 768 px | 704 px | 8 | 32 px | 16 px |
| Primary mobile | 390 px | 358 px | 4 | 16 px | 12 px |
| Narrow mobile QA | 360 px | 328 px | 4 | 16 px | 12 px |

Layout rules:

- The first storefront viewport uses a compact `HeroCommerceCluster`; it does
  not reserve `600+ px` for a single full-bleed campaign image.
- Storefront desktop content is capped at `1280 px`; transactional pages may
  use the same shell but can narrow their reading/form columns.
- The home hero uses `7 / 3 / 2` columns with `16 px` gaps. Product rails use
  four equal cards on desktop and two on mobile.
- Product cards always align to a predictable comparison grid even when the
  hero or editorial blocks span multiple columns.
- Mobile supporting hero cards scroll horizontally; checkout, account forms,
  and order details use one column.
- No customer flow may depend on hover.

## 5. Color system

### 5.1 Primitive palette

| Token | Hex | Use |
| --- | --- | --- |
| `ivory/50` | `#F6F1E8` | Main storefront canvas |
| `surface/0` | `#FFFFFF` | Raised cards, forms, and drawers |
| `surface/soft` | `#EEE6DA` | Category wells and selected soft surfaces |
| `surface/warm` | `#E7DED2` | Warm-gray garment tiles and lifestyle card backing |
| `ink/950` | `#272220` | Primary text, prices, and icons |
| `ink/700` | `#5E534D` | Navigation and supporting text |
| `ink/500` | `#8A7D75` | Metadata and placeholder only |
| `line/200` | `#D8CEC2` | Default border and divider |
| `line/100` | `#E6EFEC` | Subtle divider |
| `oxblood/800` | `#54202D` | Hover, pressed, hero copy, and admin sidebar |
| `oxblood/700` | `#6D2838` | Primary action, cart, selected state, and focus |
| `oxblood/100` | `#F0DEE3` | Selected background and quiet callout |
| `champagne/600` | `#B79A6B` | Wordmark ornament and tiny editorial accent |
| `success/700` | `#6D2838` | Success |
| `success/100` | `#F0DEE3` | Success surface |
| `warning/700` | `#87643A` | Warning and low stock |
| `warning/100` | `#F4EBDD` | Warning surface |
| `error/700` | `#A83D38` | Error and validation |
| `error/100` | `#F8E4E1` | Error surface |
| `info/700` | `#356A78` | Information |
| `info/100` | `#E3F1F4` | Information surface |

### 5.2 Semantic aliases

```text
color/bg/page              ivory/50
color/bg/surface           surface/0
color/bg/subtle            surface/soft
color/bg/warm              surface/warm
color/text/primary         ink/950
color/text/secondary       ink/700
color/text/muted           ink/500
color/text/inverse         surface/0
color/border/default       line/200
color/border/subtle        line/100
color/action/primary       oxblood/700
color/action/primary-hover oxblood/800
color/action/selected      oxblood/100
color/accent/editorial     gold/600
```

Green is the only primary storefront action family. Gold is decorative and
must not be used for small low-contrast text, price, stock, or errors. Error,
stock, order, and payment statuses always include an icon and label.

## 6. Typography

- Persian display and compact UI recommendation: `Peyda Variable`.
- Persian body fallback: `Vazirmatn`.
- Latin/SKU/payment fallback: `Inter`.
- Wordmark: custom SVG or owned logo asset; never approximate it with body text.
- Weights: `400`, `500`, `600`, `700` only.

| Style | Desktop | Mobile | Family/weight |
| --- | --- | --- | --- |
| `display/hero` | 30/40 px | 24/32 px | Peyda 700 |
| `display/section` | 24/32 px | 20/28 px | Peyda 700 |
| `heading/h1` | 28/38 px | 24/32 px | Peyda 700 |
| `heading/h2` | 22/30 px | 20/28 px | Peyda 600 |
| `heading/h3` | 18/26 px | 17/25 px | Peyda 600 |
| `body/md` | 14/23 px | 14/23 px | Vazirmatn 400 |
| `body/sm` | 13/21 px | 13/21 px | Vazirmatn 400 |
| `label/md` | 12/20 px | 12/20 px | Vazirmatn 500 |
| `caption` | 11/18 px | 11/18 px | Vazirmatn 400 |
| `price/md` | 14/22 px | 13/21 px | Vazirmatn 700 |

Hero headings use a maximum of two lines. Product titles use a compact
interface face, never an oversized display style, so the four-column product
grid remains scannable.

## 7. Spacing, shape, effects, and motion

Spacing variables: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px`.

Radius variables:

- `8 px`: inputs, compact fields, and small utility controls.
- `12 px`: product cards and contained image wells.
- `14–16 px`: hero and supporting story cards.
- `999 px`: CTA blocks, compact login control, badges, swatches, and circular actions.
- `0 px`: data-table internals only; do not use square corners for the home
  image cards.

Effects:

- Product cards: surface contrast or `1 px` border; avoid heavy shadows.
- Selected/floating card: `0 2px 8px rgba(32,77,66,0.06)`.
- Dropdown/drawer: `0 8px 24px rgba(32,77,66,0.08)`.
- Sticky purchase bar: `0 -6px 20px rgba(32,77,66,0.10)`.
- Focus: light `2 px` separation plus `2 px #6D2838` outer ring.

Motion:

- Control feedback: `140 ms` ease-out.
- Image crossfade: `220 ms` ease-out; no required information appears only on
  hover.
- Drawer/sheet: `260 ms cubic-bezier(0.2,0.8,0.2,1)`.
- Reduced-motion mode removes translations, image zoom, and decorative pulse.

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

- No announcement bar in the home first viewport; campaign pages may add a
  `24 px` utility strip without pushing the hero below the fold.
- Main header: `68 px` with a centered custom wordmark.
- Optional category sub-navigation: `40 px`; home navigation may stay inside
  the main header when all links fit.
- Sticky header: `56 px` after scroll, preserving the same centered mark.
- Search overlay width: `640 px` with a warm-ivory scrim and white surface.
- Footer: four or five columns within the `1280 px` shell.

Mobile shell:

- No announcement bar by default.
- Header: `60 px`.
- Search row: `48–52 px` when exposed.
- Bottom navigation: `64 px` plus safe area.
- Navigation uses a full-height RTL drawer.

The global navigation must expose `زنانه`, `مردانه`, and `بچگانه` at the same hierarchy. None may be hidden only inside a generic “categories” page.

## 9. Component inventory

### 9.1 Primitive components

`Button`, `Icon Button`, `Link`, `Text Field`, `Text Area`, `Phone Field`, `Search Field`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Chip`, `Badge`, `Tooltip`, `Toast`, `Dialog`, `Drawer`, `Bottom Sheet`, `Accordion`, `Breadcrumb`, `Pagination`, `Stepper`, `Skeleton`, `Empty State`, `Inline Message`, `Dropdown Menu`, and `Table`.

Every interactive primitive requires default, hover, focus, pressed/selected, disabled, loading, error, and success states where applicable. Default field height is `48 px`; primary purchase buttons are `52 px`; minimum pointer target is `44 × 44 px`.

### 9.2 Commerce components

`Global Header`, `Mobile Header`, `Mega Menu`, `Mobile Bottom Nav`, `Category Card`, `Editorial Feature`, `Product Card`, `Compact Product Card`, `Price Block`, `Rating Summary`, `Color Swatch`, `Size Selector`, `Size Guide`, `Fit Indicator`, `Media Gallery`, `Inventory Message`, `Delivery Promise`, `Returns Summary`, `Product Details`, `Review Card`, `Cart Item`, `Coupon Field`, `Order Summary`, `Address Card`, `Shipping Method`, `Payment Method`, `Order Timeline`, `Support Entry`, `Trust Strip`, `Product Rail`, and `Recently Viewed`.

Home product-card image ratio is `1:1`, matching the contained shirt/product
tiles in the reference. Desktop listing cards are `288–300 px` wide depending
on grid context; the primary `1440 px` frame uses four cards of approximately
`296 px`. Mobile cards are `173 px` wide in a `390 px` frame. PDP/gallery media
may remain portrait (`4:5`) when the garment needs a full-length view. Titles
may occupy two lines; price, stock, and sale information may not be hover-only.

### 9.3 Admin components

`Admin Sidebar`, `Admin Topbar`, `Stat Card`, `Filter Bar`, `Data Table`, `Status Badge`, `Product Form Section`, `Media Uploader`, `Variant Matrix`, `Inventory Cell`, `Order Event`, `Internal Note`, `Customer PII Field`, `Content Block`, and `Audit Event`.

### 9.4 Interaction-state contract

| State | Fill | Border | Text/icon | Additional rule |
| --- | --- | --- | --- | --- |
| Default primary | `oxblood/700` | `oxblood/700` | `surface/0` | Restrained 6 px shape; no heavy shadow |
| Hover primary | `oxblood/800` | `oxblood/800` | `surface/0` | `140 ms` transition |
| Pressed primary | `ink/950` | `ink/950` | `surface/0` | No scale animation |
| Focus | Existing state fill | Light separation plus `oxblood/700` | Existing state text | Two-ring focus remains outside component bounds |
| Disabled | `surface/soft` | `line/100` | `ink/500` | No pointer action; opacity is not the sole indicator |
| Loading | Same as originating state | Same as originating state | Spinner plus preserved label width | Prevent repeat submission |
| Error | `error/100` | `error/700` | `error/700` | Icon, message, and error-summary link |
| Success | `success/100` | `success/700` | `success/700` | Icon and confirmation text |

### 9.5 Construction-level component contracts

| Component | Anatomy and exact measurements | Properties and variants | Responsive behavior |
| --- | --- | --- | --- |
| Button | Height `36/40/48 px`; inline padding `12/16/20 px`; icon `16/18 px`; label gap `8 px`; radius `6 px` for storefront CTA | Primary, Secondary, Outline, Ghost, Destructive; Small, Medium, Large; leading/trailing icon; default through loading states | Mobile purchase buttons fill available width; ordinary buttons hug content until below `360 px` |
| Icon Button | `36/40/44 px` square; icon `16/18/20 px`; radius `999 px` for cart/quick-add or `8 px` for utility controls | Ghost, Surface, Outline; tooltip and accessible-label properties | Remains at least `44 px` on customer mobile surfaces |
| Text/Phone Field | Height `48 px`; label gap `8 px`; inline padding `14 px`; icon `20 px`; helper gap `6 px`; error text `12/21 px` | Empty, filled, focus, disabled, error, success; prefix/suffix; LTR phone value | Full width on mobile; phone value is isolated LTR while label stays RTL |
| Search Field | Height `48 px`; search icon `18–20 px`; clear action `44 px`; suggestion row `52 px` | Empty, typing, loading, suggestions, no result, error | Desktop overlay `640 px`; mobile becomes a full-screen search surface |
| Select | Trigger `48 px`; menu item `44 px`; chevron `20 px`; menu padding `8 px` | Placeholder, selected, open, disabled, error; single/multiple | Mobile filter selections may render inside a bottom sheet |
| Checkbox/Radio/Switch | Checkbox/radio `20 px`; switch `44 × 24 px`; label gap `10 px` | Unchecked, checked, mixed where relevant, focus, disabled, error | Entire label row is clickable with `44 px` minimum height |
| Tabs/Chip/Badge | Tab height `44 px`; chip `36 px`; badge `24 px`; horizontal padding `12/10/8 px` | Active, inactive, hover, focus, disabled; removable/selected chip; status badge | Tabs scroll horizontally on mobile with visible edge affordance |
| Dialog | Width `480/640 px`; padding `24/32 px`; header gap `12 px`; footer gap `12 px`; radius `16 px` | Information, form, confirmation, destructive; loading/error | Mobile uses `calc(100% - 32px)` or bottom sheet for long forms |
| Drawer/Bottom Sheet | Drawer `440 px`; sheet max height `90vh`; padding `24 px`; sticky header/footer | Navigation, cart, filters, size guide; open/closing/loading | Drawer becomes full width below `480 px`; sheet respects bottom safe area |
| Toast/Inline Message | Toast width `360 px`, padding `16 px`, icon `20 px`; inline message padding `12 px` | Success, warning, error, info; optional one or two actions | Toast width becomes `calc(100% - 32px)` on mobile |
| Breadcrumb/Pagination/Stepper | Breadcrumb row `32 px`; pagination target `44 px`; stepper node `28 px` | Full/collapsed breadcrumb; first/middle/last pagination; current/complete/error step | Breadcrumb collapses after first ancestor; checkout stepper uses labels only where space permits |
| Product Card | Desktop width `288–300 px`; mobile `173 px`; home image `4:5`; content gap `8–10 px`; swatch `12–14 px`; quick-add `40 px`; wishlist target `44 px` | Regular, sale, new, low stock, out of stock, loading; optional swatches and quick-add | Four desktop, three filtered, two mobile; title stays two lines and price remains visible |
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
| Home | `1280 × 320–360 px` `HeroCommerceCluster` with `7 / 3 / 2` split; seven-item category rail; four-card square new arrivals; collection story; best sellers; trust; journal; footer | `358 × 300–360 px` hero story; horizontal supporting-card rail; horizontal category rail; two-column square products; editorial rail; sticky bottom nav | Campaign, no campaign, loading, slow images, error |
| Category landing | Category portrait, editorial intro, subcategory grid, featured looks, popular products, size/fit guide, SEO copy | Portrait hero, two-column subcategories, compact editorial cards, expandable copy | Women, men, children, empty campaign |
| Product listing | `296 px` filter rail plus three-card grid; heading, result count, sort, applied chips, pagination | Two-column cards; `52 px` sticky filter/sort bar; filter bottom sheet | Default, filtered, no results, loading, request error |
| Search | `640 px` overlay with recent, popular, category and product results; full results page | Full-screen overlay with sticky search field | Empty, typing, autocomplete, typo correction, no result, error |
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

- Desktop hero source: minimum `2400 × 1360 px`; crop to the dominant story card, not the full viewport.
- Mobile hero source: minimum `1080 × 1440 px`; preserve a copy-safe side for the compact story card.
- Home product master: minimum `1600 × 1600 px` for contained square card imagery; PDP master may remain `1600 × 2000 px`.
- Category portrait: minimum `1200 × 1600 px`.
- Preserve garment silhouette and leave intentional copy-safe space.

### 10.1 Pexels source set used in the Penpot home page

The current Penpot home-page prototype uses four real Pexels references. The
original Pexels files remain the source of record; Penpot uses a `1280 px` CDN
variant for the hero and `640 px` variants for secondary editing previews.
These are editorial references, not final NOVA product masters. Replace
product-card crops with NOVA-owned
photography before catalog launch so a model image is never mistaken for the
exact garment being sold.

| Asset ID | Pexels source / photographer | Original dimensions | Applied roles | Crop and focal guidance |
| --- | --- | ---: | --- | --- |
| `AE-HERO-PEXELS-15597607` | [Woman in Coat with Bag Posing in Studio](https://www.pexels.com/photo/woman-in-coat-with-bag-posing-in-studio-15597607/) — Pegah Sharifi | Penpot preview `1280 × 2275`; retain original Pexels file as source | Desktop and mobile hero | `cover`; use the neutral studio field and coat/handbag silhouette; desktop focal point `62% 44%`, mobile focal point `52% 34%`; never crop the bag, coat edge, or model's face into a misleading product detail |
| `AE-AUDIENCE-MEN-PEXELS-2706265` | [Photo of Man Wearing Coat](https://www.pexels.com/photo/photo-of-man-wearing-coat-2706265/) — Ziad Nr | `3358 × 5037` | Men audience; Oxford editorial card | `cover`; keep head and plaid coat centered; crop foliage before the face |
| `AE-AUDIENCE-CHILDREN-PEXELS-34684680` | [Two children in stylish outfits](https://www.pexels.com/photo/adorable-children-in-stylish-outfits-indoors-34684680/) — halfscreen photography | `4000 × 6000` | Children audience; Kids editorial card | `cover`; keep both faces, hands, and outfit context visible; do not crop into a child’s face |
| `AE-COLLECTION-PEXELS-8886965` | [Woman touching fabric in a clothing store](https://www.pexels.com/photo/photograph-of-a-woman-touching-fabric-8886963/) — Lara Jameson | `5040 × 3360` | Collection story; mobile editorial rail; accessories/journal reference | `cover`; use the fabric/hand interaction as the detail focal point; avoid implying a specific NOVA SKU |

Pexels delivery URLs are recorded on the corresponding Penpot image layers as
`sourceUrl`, `sourcePage`, `photographer`, `licenseUrl`, `optimizedUrl`,
`assetId`, `alt`, and `usageNote`. The Penpot preview variant follows this
pattern:

```text
https://images.pexels.com/photos/{photo-id}/pexels-photo-{photo-id}.jpeg?auto=compress&cs=tinysrgb&w=640
```

Pexels describes its photos as free to use for commercial projects, subject to
the [Pexels license](https://www.pexels.com/legal-pages/license/). Before public
launch, verify model, property, and trademark considerations and do not imply
endorsement by the photographer or Pexels.

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

## 16. Construction appendix

This appendix instantiates the shared deterministic Figma contract in the root [architecture document](../../arch.md). Every frame uses the `AE` prefix and must be built from the screen IDs, coordinates, component properties, fixtures, and state rules below. A frame is not approved while its direct Figma node URL, screenshot evidence, or unresolved-issue field is blank.

### 16.1 Frame matrix and coordinate anchors

| Frame family | Desktop | Tablet | Mobile | Narrow QA |
| --- | --- | --- | --- | --- |
| Storefront shell | `1440 × 1024`, content `x=80,w=1280`, 12 columns, 16 px gutter | `768 × 1024`, content `x=32,w=704`, 8 columns, 16 px gutter | `390 × 844`, content `x=16,w=358`, 4 columns, 12 px gutter | `360 × 800`, content `x=16,w=328` |
| Account shell | `1440 × 900`, nav `x=96,w=280`, gap `32`, content `w=920` | `768 × 1024`, nav becomes a summary row, content `w=704` | `390 × 844`, stacked destination list and one-column content | `360 × 800`, same stack with 16 px side padding |
| Admin shell | `1440 × 900`, sidebar `240`, topbar `64`, content padding `32` | `768 × 1024`, sidebar hidden, card queues | `390 × 844`, card queues and sticky save/action bar | `360 × 800`, no table overflow |

Use these top-level coordinates in every primary frame:

| Screen | Desktop coordinate anchors | Mobile coordinate anchors |
| --- | --- | --- |
| Shell | Header `y=0,h=68`; optional category row begins at `y=68,h=40`; content starts at `y=68` or `y=108` when the row is visible | Header `h=60`; content starts `y=60`; bottom nav fixed `h=64` plus safe area |
| `HOME` | Hero cluster `x=80,y=68,w=1280,h=320–360`; category rail starts `24 px` below; product grid cards `w≈296`, image `1:1` | Hero story `x=16,y=60,w=358,h=300–360`; supporting rail follows; product grid cards `w=173` |
| `PLP_*` | Filter rail `x=80,w=296`; gap `16`; product grid fills remaining width with three cards and 16 px internal gap | Sticky filter/sort bar `x=16,y=60,w=358,h=52`; two cards `w=173` with 12 px gap |
| `PDP` | Gallery `x=96,w=720`; gap `24`; info `x=840,w=480`; sticky info begins below `y=160` | Gallery `x=16,y=88,w=358,aspect=4:5`; info padding `16`; purchase bar fixed `h=72` |
| `CART`/checkout | Items `x=96,w=816`; gap `24`; summary `x=936,w=408` | One-column content `x=16,w=358`; sticky CTA above bottom navigation |
| Account | Nav `x=96,w=280`; gap `32`; content `x=408,w=920` | Summary header `x=16,w=358`; destination cards and content stack |
| Admin | Sidebar `x=0,w=240`; topbar `y=0,h=64`; content `x=272,w=1136` | Topbar `h=56`; content padding `16`; priority tables become cards |

Frame names follow `AE/<Screen>/<Viewport>/<State>`, for example `AE/PDP/Desktop/Size-Error`, `AE/PLP/Mobile/No-Results`, and `AE/Admin/Product-Edit/Tablet/Publish-Blocked`. Record the actual node URL beside each name after the Figma frame is created.

### 16.2 Screen-sheet map

Each row below represents an individual frame even where IDs are grouped. Every row inherits the complete baseline from the root [shared page and state matrix](../../arch.md#shared-page-and-state-matrix); the state cell lists direction-specific or visually emphasized states and is additive, never a replacement. The screen sheet for that frame must use the root schema: section bounds, tokens, component properties, copy, asset, state, responsive change, and interaction.

| Screen IDs | Desktop composition | Mobile transformation | Direction-specific / emphasized states (plus full root baseline) |
| --- | --- | --- | --- |
| `HOME` | 1280 px `HeroCommerceCluster` (`7 / 3 / 2`), seven-item category rail, four-card square new-arrival grid, collection story, best sellers, trust, journal, footer | 358 px hero story, horizontal supporting-card rail, horizontal category rail, two-column square products, editorial rail, fixed bottom nav | Campaign, no campaign, loading, slow image, request error, offline |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | Portrait hero, intro, subcategory grid, featured look, popular rail, sizing/fit guide, SEO block | Portrait hero, two-column subcategories, compact look cards, accordion SEO copy | Default, empty campaign, loading, request error |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | 300 px filter rail, 3-card comparison grid, result count, applied chips, sort, pagination | Sticky 52 px filter/sort bar, two-column cards, filter bottom sheet | Default, filtered, sale, no results, loading, request error, offline |
| `SEARCH` | 640 px search overlay with recent/popular/category/product groups and full result page | Full-screen surface with sticky 52 px input and grouped results | Empty, typing, autocomplete, typo correction, no result, loading, error |
| `PDP` | 720 px portrait gallery, 480 px sticky information, price/variant/fit/stock/delivery/returns/details/reviews | Swipe gallery, 16 px information padding, size-guide sheet, fixed 72 px purchase bar | Empty variant, selected variant, size error, low stock, out of stock, sale, zoom, added, price changed |
| `CART_DRAWER`, `CART` | 440 px cart drawer; full cart uses 816 px items plus 408 px summary | Full-width sheet; cart page stacks items and summary with sticky checkout CTA | Empty, quantity updating, removed, stock conflict, price change, coupon success/error, offline |
| `AUTH` | 456 px centered form with editorial side image; guest continuation below divider | Full-height one-column form with 16 px padding | Login, guest, invalid phone, expired code, rate limit, network error |
| `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | `816+408` two-column flow; 3-step indicator; summary remains visible | One-column step panels; sticky next/pay CTA; long selections use sheets | Saved/new address, validation, unsupported region, quote loading/unavailable/expired, payment processing/redirect/failed/cancelled/timeout/pending |
| `CONFIRMATION`, `TRACKING` | 792 px receipt and order timeline with shipment card | Single success stack and vertical timeline | Paid, pending, preparing, shipped, delayed, delivered, cancelled, shipment exception |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | 280 px account navigation plus 920 px content; cards use 16 px padding and 24 px section gaps | Summary header, stacked destination cards, one-column forms and order details | Loading, empty orders/addresses, validation error, save success/error, permission error, offline |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | Support entry, searchable FAQ, sessions, and preference groups in the 920 px content column | Accordion groups and full-width form controls | Empty search, ticket submitted, session revoke success/error, preference save error |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | Editorial reading width 720 px with 1248 px image/story modules and product references | Single-column reading flow, 4:5 media, related product rail | Published, scheduled, missing media, loading, unavailable, offline |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | 720 px reading measure, 1248 px page frame, anchored contents where useful | 358 px reading column, collapsible contents and stacked accordions | Default, loading, error, offline, contact validation/success |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | Centered 480 px message inside the shell with return/search/support actions | Full-width 358 px message and one primary action | 404, offline cached shell, maintenance window |
| `ADMIN_LOGIN`, `ADMIN_DASHBOARD` | 240 px sidebar, 64 px topbar, 32 px content padding; dashboard stat cards and action queues | Sidebar hidden; cards and priority queue | Invalid, locked, rate-limited, MFA step, loading, permission error |
| `ADMIN_PRODUCTS`, `ADMIN_CATEGORIES`, `ADMIN_INVENTORY` | Filter bar, 48/56 px data rows, status badges, bulk actions, pagination | Priority columns become labeled cards; filters become a sheet | Loading, empty, request error, stock discrepancy, bulk-action success/error |
| `ADMIN_PRODUCT_EDIT`, `ADMIN_VARIANTS`, `ADMIN_MEDIA` | Sectioned form, 2-column fields, 120 × 44 px variant cells, media crop/reorder panel | One-column sections; contained horizontal variant matrix; sticky save bar | Draft, invalid, saving, saved, publish blocked, upload/crop failure |
| `ADMIN_ORDERS`, `ADMIN_ORDER_DETAIL`, `ADMIN_PAYMENTS` | Queue tabs, order detail snapshots, payment attempt/webhook timeline, internal notes | Queue/detail cards with labeled event rows | New/paid/preparing/shipped, payment mismatch, retry, webhook error, permission error |
| `ADMIN_PROMOTIONS`, `ADMIN_CUSTOMERS`, `ADMIN_CUSTOMER_DETAIL`, `ADMIN_CONTENT`, `ADMIN_AUDIT`, `ADMIN_OPERATIONS` | Rule editor, restricted customer lookup/detail, content block editor/preview, audit before/after, notification/media/payment health | Card sections with explicit section navigation and unsaved-change guard; PII stays permission-gated | Draft, scheduled, publish blocked, success, failure, no activity, service degraded, permission error |

### 16.2.1 Exact section-bound stacks

The values below use `x,y,width,height` in pixels in one full-page coordinate system. The `1440 × 900` and `390 × 844` viewports show the portion intersecting their recorded scroll offset; `Scroll-0` starts at `y=0`, and `Scroll-1` and later frames retain these coordinates while recording the new offset. Slash-separated IDs share this geometry but still receive separate Figma frames and node URLs.

| Screen IDs | Desktop section stack (`1440 × 900`) | Mobile section stack (`390 × 844`) |
| --- | --- | --- |
| `HOME` | `HeroCommerceCluster(80,68,1280,320–360)` → `CategoryRail(80,452,1280,88)` → `NewArrivals(80,572,1280,440)` → `CollectionStory(80,1060,1280,360)` → `TrustJournal(80,1468,1280,280)` → `Footer(80,1780,1280,280)` | `HeroStory(16,60,358,300–360)` → `SupportingRail(16,436,358,132)` → `CategoryRail(16,592,358,96)` → `Products(16,720,358,420)` → `EditorialRail(16,1164,358,300)` → `Trust(16,1496,358,260)` → `Footer(16,1780,358,320)` |
| `CATEGORY_WOMEN`, `CATEGORY_MEN`, `CATEGORY_CHILDREN` | `PortraitHero(96,160,1248,460)` → `Intro(96,652,1248,160)` → `Subcategories(96,836,1248,224)` → `FeaturedLook(96,1084,1248,440)` → `PopularProducts(96,1556,1248,510)` → `GuideSEO(96,2120,1248,360)` | `PortraitHero(16,88,358,360)` → `Intro(16,480,358,144)` → `Subcategories(16,656,358,220)` → `Products(16,908,358,420)` → `GuideSEO(16,1360,358,360)` |
| `PLP_WOMEN`, `PLP_MEN`, `PLP_CHILDREN` | `Toolbar(96,160,1248,96)` → `FilterRail(96,280,300,620)` + `ProductGrid(420,280,924,620)`; card rows are `300×510`, row gap `24` | `FilterSortBar(16,88,358,52)` → `ProductGrid(16,164,358,900)`; cards are `173×420`, row gap `24`; filter sheet `16,88,358,756` |
| `SEARCH` | `SearchOverlay(360,160,720,600)` → `SearchResults(96,800,1248,620)` | `SearchSurface(0,88,390,756)` with sticky field `16,88,358,52` and results beginning `16,164,358,680` |
| `PDP` | `Gallery(96,160,720,900)` + `PurchaseInfo(840,160,480,760)` → `DetailsReviews(96,1092,1248,420)` → `RelatedProducts(96,1576,1248,510)` | `Gallery(16,88,358,448)` → `PurchaseInfo(16,568,358,650)` → `DetailsReviews(16,1250,358,420)` → `RelatedProducts(16,1694,358,420)`; purchase bar `0,692,390,72`; narrow `0,648,360,72` |
| `CART_DRAWER`, `CART` | Drawer `1000,0,440,900`; cart page `Items(96,160,816,720)` + `Summary(936,160,408,640)` | Sheet `0,88,390,756`; cart page `Items(16,88,358,620)` → `Summary(16,740,358,360)`; sticky CTA `16,712,358,52`; narrow `16,668,328,52` |
| `AUTH`, `CHECKOUT_ADDRESS`, `CHECKOUT_SHIPPING`, `CHECKOUT_PAYMENT` | Auth `Panel(492,210,456,560)`; checkout `Form(96,160,816,680)` + `Summary(936,160,408,640)` and stepper `96,120,816,32` | Auth `Form(16,88,358,650)`; checkout `Step(16,88,358,620)` → `Summary(16,732,358,300)`; sticky CTA `16,712,358,52`; narrow `16,668,328,52` |
| `CONFIRMATION`, `TRACKING` | `Receipt(96,160,792,560)` + `NextSteps(912,160,336,320)`; timeline `96,744,1248,220` | `Receipt(16,88,358,420)` → `NextSteps(16,540,358,240)` → `Timeline(16,812,358,520)` |
| `ACCOUNT_DASHBOARD`, `PROFILE`, `ADDRESSES`, `ORDERS`, `ORDER_DETAIL` | `AccountNav(96,160,280,620)` + `AccountContent(408,160,920,720)`; content sections use 24 px gaps | `AccountSummary(16,88,358,120)` → `DestinationList(16,232,358,360)` → `AccountContent(16,616,358,620)` |
| `SUPPORT`, `SECURITY`, `NOTIFICATIONS` | `AccountNav(96,160,280,620)` + `SupportContent(408,160,920,720)`; FAQ/search controls occupy the first 96 px | `Summary(16,88,358,120)` → `SearchOrControls(16,232,358,104)` → `AccordionContent(16,360,358,820)` |
| `CAMPAIGN`, `GUIDE`, `ARTICLE`, `LOOKBOOK` | `StoryHero(96,160,1248,520)` → `ReadingColumn(360,744,720,720)` → `ProductReferences(96,1512,1248,510)` | `StoryHero(16,88,358,360)` → `ReadingColumn(16,480,358,900)` → `ProductRail(16,1412,358,420)` |
| `ABOUT`, `TRUST`, `SHIPPING_POLICY`, `RETURNS_POLICY`, `SIZE_GUIDE`, `CARE_GUIDE`, `FAQ`, `CONTACT`, `PRIVACY`, `TERMS` | `DocumentHeader(96,160,1248,180)` → `ReadingMeasure(360,372,720,920)` → `RelatedOrContact(96,1324,1248,300)` | `DocumentHeader(16,88,358,160)` → `ReadingMeasure(16,272,358,980)` → `RelatedOrContact(16,1284,358,320)` |
| `NOT_FOUND`, `OFFLINE`, `MAINTENANCE` | `Message(480,300,480,300)` with actions at `520,516,400,52` | `Message(16,220,358,300)` with action `16,548,358,52` |
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

The property names come from the root contract; these are the ATELIER defaults and overrides:

| Component | ATELIER value |
| --- | --- |
| `Button` | `primary=oxblood/700`, `hover=oxblood/800`, `pressed=ink/950`, radius `999`, compact height `36–40`, purchase height `48–52` |
| `ProductCard` | `homeImageRatio=1:1`, desktop `w=288–300`, mobile `w=173`, title `maxLines=2`, `showSwatches=true`, `quickAdd=40`, no required hover information |
| `EditorialFeature` | `layout=asymmetric`, `imageRatio=4:3`, `copyMeasure=300–360`, `copySafeInset=24`, `accent=gold/600` for labels only |
| `MediaGallery` | `thumbnail=64×80`, `gap=8`, `zoom=true`, image fallback uses `surface/soft` with an outlined icon and text |
| `PriceBlock` | Customer amount `Vazirmatn 700`; regular/sale prices remain adjacent; currency suffix is `تومان`; no brass for price text |
| `Drawer/Sheet` | Drawer `w=400–440`; sheet max `90vh`; warm ivory/surface paper; oxblood CTA; focus return to trigger |
| `Admin` | Admin uses ivory/50 canvas and ink text; oxblood actions; gold is never used for status or body text |

### 16.4 State and Persian copy fixtures

Use these state fixtures consistently in the frames and prototypes:

| State | Required visible copy/action |
| --- | --- |
| Loading | Skeleton preserves the final card height; button keeps its label width and shows a spinner |
| Empty PLP | `محصولی در این محدوده پیدا نشد` / `حذف فیلترها` |
| Offline | `ارتباط برقرار نشد؛ اطلاعات ذخیره‌شده را می‌بینید.` / `تلاش دوباره` |
| PDP size error | `لطفاً اندازه را انتخاب کنید.`; focus moves to the size group |
| Stock conflict | `موجودی این کالا تغییر کرده است.` / `به‌روزرسانی سبد` |
| Price change | `قیمت این کالا تغییر کرده است.` / `مشاهده قیمت جدید` |
| Payment failure | `پرداخت ناموفق بود؛ مبلغی از حساب شما کسر نشده است.` / `تلاش دوباره` / `پشتیبانی` |
| Success | `به سبد خرید اضافه شد` or `سفارش ثبت شد`; include an icon and a next action |

### 16.5 Asset and content rules

- Hero source: minimum `2400×1360` desktop and `1080×1440` mobile; keep the garment silhouette and the Persian copy-safe area inside the declared focal rectangle.
- Home product master: minimum `1600×1600` for square contained cards; PDP product master may remain `1600×2000`, with a center crop at `50% 50%` unless the asset record declares a different focal point.
- Category portrait: minimum `1200×1600`; never crop the model's head, garment hem, or child safety context.
- Every asset record includes `assetId`, license/owner, source dimensions, crop mode, focal point, desktop/mobile variant, and Persian alt text.
- Use the fixtures from Section 9.6 for women, men, and children. Add a character-limit record for each heading, title, label, error, and CTA; long Persian strings must be tested at `360 px`.
- Editorial captions may use Peyda, but product names, prices, inventory, actions, errors, and support text use Vazirmatn or the approved compact UI face.

### 16.6 Responsive and interaction rules

- At `1024 px`, reduce editorial margins before reducing type; the admin sidebar becomes a 72 px icon rail.
- At `768 px`, the PDP changes from `720+480` to stacked gallery/information; PLP filters move to a sheet; admin tables expose priority cards.
- At `390 px`, category cards and products remain two columns; all forms are one column; purchase and checkout actions are sticky above the bottom navigation.
- At `360 px`, reduce section gaps from `32` to `24` before reducing body text; no title, price, or CTA may clip.
- Editorial hover treatments never carry required information. Image zoom, wishlist, and secondary image are available through explicit controls on touch devices.
- Filter/sort changes update query parameters, reset pagination, and preserve the selected audience. Cart and payment conflicts use a recoverable sheet instead of silently mutating data.

### 16.7 Handoff and approval checklist

For every `AE/<Screen>/<Viewport>/<State>` frame, record the direct node URL, owner, review date, screenshot path, and status. Approval requires:

- all bounds and tokens match this appendix;
- Persian RTL, mixed LTR references, focus, dialog return-focus, and reduced motion are checked;
- contrast is checked for ink, green, gold, and every status alias;
- desktop/mobile crops and text wrapping match the asset/content record;
- `360 px` has no horizontal scroll or clipped prices/actions;
- loading, empty, offline, error, stock-conflict, payment-conflict, and success frames are linked;
- no unresolved issue is hidden in a Figma comment instead of this handoff table.

## 17. Coded preview delivery (2026-09-06)

This section records the browser preview delivered in `apps/web`. It is a
dependency-free Bun implementation for reviewing the complete page family
before production React, API, authentication, and persistence work begins.
The preview follows the supplied warm-ivory clothing reference: a compact
centered header, oxblood editorial hero, portrait editorial image blocks, Persian RTL
copy, restrained type sizes, and direct paths to the customer and admin
surfaces. It is an implementation preview, not a replacement for the
editable Penpot frames or the production architecture.

### 17.1 Delivered route map

| Surface | Preview routes | Purpose |
| --- | --- | --- |
| Home | `#home` | Hero, audience rail, fresh arrivals, fabric story, trust, newsletter, and footer |
| Category landing | `#category/women`, `#category/men`, `#category/children` | Category portrait, subcategories, featured products, and size-guide entry |
| Product listing | `#products`, `#products/women`, `#products/men`, `#products/children`, `#products/new`, `#products/sale`, `#products/accessories` | Filtered catalog, sort control, filter rail, product cards, and empty-state contract |
| Product detail | `#product/linen-overshirt` and the other product IDs | Gallery, size selection, price, stock, delivery promises, details, and related products |
| Cart and checkout | `#cart`, `#checkout/address`, `#checkout/shipping`, `#checkout/payment`, `#checkout/confirmation` | Quantity controls, order summary, address, shipping, payment, and success state |
| Account and orders | `#account`, `#account/profile`, `#account/addresses`, `#account/orders`, `#account/support`, `#account/security`, `#account/notifications`, `#order/NV-1405-2481` | Account shell, saved information, support, security, notifications, and tracking |
| Editorial and utility | `#campaign`, `#guide`, `#article`, `#lookbook` | Collection story, size guide, NOVA approach, and lookbook reading pages |
| Admin | `#admin`, `#admin/products`, `#admin/categories`, `#admin/inventory`, `#admin/orders`, `#admin/payments`, `#admin/promotions`, `#admin/customers`, `#admin/content`, `#admin/audit`, `#admin/operations` | Dashboard, operational tables, filters, status cells, and review queues |
| Admin detail flows | `#admin/login`, `#admin/products/new`, `#admin/products/linen-overshirt/edit`, `#admin/products/linen-overshirt/variants`, `#admin/products/linen-overshirt/media`, `#admin/orders/NV-1405-2481` | Login shell, product editor variants/media, and order detail |

### 17.2 Current coded-preview tokens

The browser preview uses this compact reference translation so it can be
reviewed against the supplied image without adding a second dependency or
theme package:

| Token | Value | Use |
| --- | --- | --- |
| Page | `#F6F1E8` | Main warm-ivory canvas |
| Surface | `#FFFFFF` | Cards, forms, drawers, and admin panels |
| Soft surface | `#EEE6DA` | Category tiles, notes, selected controls, and secondary blocks |
| Warm surface | `#E7DED2` | Lifestyle card backing and warm garment tiles |
| Ink | `#272220` | Primary Persian text, headings, prices, and icons |
| Green | `#6D2838` | Primary action, active state, links, cart, and progress |
| Dark green | `#54202D` | Hover/pressed state, hero copy panel, and admin sidebar |
| Gold | `#B79A6B` | Wordmark ornament, eyebrows, and quiet editorial accents |
| Type | `Peyda Variable` + `Vazirmatn` + `Inter` | Peyda for compact headings/UI; Vazirmatn for body/prices; Inter for isolated LTR strings |
| Shape | `999 / 16 / 14 / 12 / 8 px` | Pills/actions, hero, supporting cards, product cards, and controls |
| Scale | `11–14 px` UI; `24–30 px` hero | Compact labels and a short, readable heading step |

This ivory/oxblood translation is the canonical customer-facing system for the
first design and is aligned with the attached reference. Admin may use the
same tokens on a denser surface, but must not introduce a competing palette.

### 17.3 Reference image and asset set

The attached `472902301466c0107c7e3dadc5d8db1d.webp` is a user-provided visual
reference only. It is a presentation composite, not a production hero, not a
product master, and not an asset to ship. Use it to validate composition,
scale, spacing, and token relationships.

| Asset role | Required treatment | Persian alt/content rule |
| --- | --- | --- |
| Dominant lifestyle hero | Real fashion portrait, `cover`, `4–6 px` radius, focal point recorded, copy-safe area for RTL text | Describe the person, garment, and setting without claiming it is a NOVA SKU |
| Supporting garment tile | Contained garment image on `surface/warm`, `4:3`, `4–6 px` radius | Name the garment/category; do not use ambiguous generic alt text |
| Home product card | Square `1:1`, centered cut-out or product photo, `72–82%` garment occupancy, white/warm surface | Product name, color, price, availability, and a visible quick-add label |
| Category tile | `56–64 px` square rounded image well, consistent crop and label | Persian category label is required even when the image fails |

Every production asset record includes `assetId`, license/owner, source
dimensions, crop mode, focal point, desktop/mobile variant, Persian alt text,
lazy-loading policy, and a broken-image fallback.

### 17.4 Preview acceptance checklist

- `bun run dev` serves the preview from `apps/web` on port `5173`.
- Home, category, catalog, PDP, cart, checkout, account, editorial, and admin
  routes render without a backend.
- PDP add-to-cart requires a size selection and shows the Persian error state.
- Search overlay returns local product results; quantity controls update the
  visible cart count; checkout advances through address, shipping, payment,
  and confirmation.
- The admin dashboard, tables, product editor, variants/media paths, order
  detail, and login shell are reachable from the hash routes.
- The primary viewport keeps the reference's compact commerce usefulness but translates it into Atelier's warm ivory, oxblood, restrained-radius editorial
  visual language; the stylesheet contains mobile transitions for the
  `390 px`, `360 px`, `768 px`, and desktop contracts listed above.
- No backend mutation, payment request, real authentication, or persistent
  data write is implied by the static preview.
