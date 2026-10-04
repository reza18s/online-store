# Header Reference Update Plan

## Scope

Update the shared storefront header to follow the supplied Atelier Editorial header reference while preserving existing destinations and interactions.

## Acceptance criteria

- Desktop keeps the wordmark optically centered, primary RTL navigation on the right, and compact utility actions on the left.
- Catalog quick links use returned category names and the existing `/products?category=` route.
- The desktop header compacts to 56px after scrolling; mobile stays 60px with menu/search on the left and favorites/cart on the right.
- Search still opens the existing dialog, the menu still opens the existing drawer, and account/cart links keep their current routes.

## Work and validation

- Update the app shell, header component, and the Atelier Editorial header styles.
- Run the storefront typecheck/build, inspect desktop and mobile runtime layouts, and review the final diff.

## Follow-up pass — 2026-10-04

### Reference gaps observed

- The rendered desktop header runs edge to edge; the reference frames it in a centered, rounded shell.
- The search control opens a full-screen dialog, while the reference shows an expanded input within the header.
- The homepage header loses its frame, opens search as a full-screen dialog, and uses a 58px row; the reference uses an inline search state and a 60px row.

### Acceptance criteria

- Desktop shell is centered and capped at 1280px with 32px page gutters, rounded corners, a 68px main row, and a separate 40px category rail after an 8px gap.
- Compact desktop state is 56px and hides the category rail; mobile uses a 60px row, 44px controls, 16px gutters, and no category rail.
- Header search expands inline, closes with Escape or its close button, and submits to the existing product query route while recording recent searches.
- Menu, account, favorite, cart, active category, quick category links, and the existing full search route remain usable.
- Review desktop, compact desktop, and 390px mobile states in the running storefront; run web typecheck/build and inspect the final diff.
