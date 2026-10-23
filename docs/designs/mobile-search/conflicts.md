# Source conflicts and resolutions

## Visual direction

The repository also contains the pale-mint `NOVA ATELIER EDITORIAL` candidate and the paper-and-index `QUIET GRID` candidate. Those are separate directions. The root Atelier specification declares Section 18, Soft Modern, the canonical visual source for revised Atelier frames; the running `storefront-reference.css` uses the matching pearl, warm surface, charcoal, rosewood, and neutral-line palette. This board follows that authority and does not mix in the other palettes.

## Touch-size gap in the current mobile catalog

The current search suggestion pills measured 33 px high, wishlist buttons 30 px, and add-to-cart actions 35 px at 390 px wide. The canonical design guidance requires a 44 × 44 px minimum pointer target. Search-only mobile overrides bring these controls to that minimum without changing shared non-search listing behavior.

## Fixed navigation and vertical space

The baseline 390 × 844 screen placed the first product action at y=781 under the fixed mobile navigation. The search suggestions wrapped into several rows and used 33 px links. The mobile search design makes suggestions a single horizontal RTL strip, then uses the recovered vertical space to keep the first 44 px add-to-cart action above the navigation.

## Query editing behavior

The prior results input wrote a new `q` value to the URL on every keystroke. The mobile design uses a local draft and explicit clear and submit controls; the existing URL helper still preserves filters and sorting and resets pagination on submit. Desktop continues to use its existing live-query behavior.

## Preview asset boundary

The local product photos are development fixture content. Their license status is not established by repository evidence, so the screenshots are only local design references and do not grant production asset approval.
