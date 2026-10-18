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

## Follow-up pass — integrated 2026-10-18

### Reference gaps observed

- The rendered desktop header runs edge to edge; the reference frames it in a centered, rounded shell.
- The search control opens a full-screen dialog, while the reference shows an expanded input within the header.
- The homepage header loses its frame, opens search as a full-screen dialog, and uses a 58px row; the reference uses an inline search state and a 60px row.

### Acceptance criteria

- Desktop shell is centered and capped at 1280px with rounded corners and a 68px main row. The separate quick-category rail is intentionally not restored; main’s existing primary navigation remains.
- Compact desktop state is 56px; tablet and mobile use the compact menu layout, with a 60px mobile row and 44px controls.
- Header search expands inline, closes with Escape or its close button, and submits to the existing product query route while recording recent searches.
- Menu, account, favorite, cart, active category, and the existing full search route remain usable.
- The 885px compact-menu search flow was checked in the running storefront. A 390px phone viewport was unavailable in the browser session; web typecheck, focused lint, tests, client/SSR build, and the final diff were checked.
