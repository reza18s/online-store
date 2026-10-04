# Product card design update

## Scope

Update the storefront catalog `ProductCard` and its loading skeleton to follow the supplied product-card reference. Preserve catalog data contracts, product links, favorites, availability handling, and add-to-cart behavior.

## Steps

1. Keep the current product model and handlers; do not add placeholder review scores because rating and review-count fields are not available.
2. Update the storefront card and loading-skeleton styles for the reference's portrait image, warm white surface, rounded media, compact details, swatches, and rosewood purchase action across desktop and mobile.
3. Check the web typecheck and production build, inspect the rendered card at desktop and phone widths, and review the final diff.

## Risk

The reference displays ratings, but the storefront API has no rating data. The card will use its existing category and availability details in that space.
