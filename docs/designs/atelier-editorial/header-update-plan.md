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
