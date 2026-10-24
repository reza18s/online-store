# Catalog filter rail and mobile dialog handoff

## Scope

This handoff covers `ListingDiscovery`'s desktop filter rail and its mobile filter dialog. It preserves all listing query behavior, facet values, controls, and result actions. The visual references use invented sample products and counts only to make layout legible.

## Source-backed layout

- Persian page direction is RTL. The effective listing override places the first grid column, the filter rail, on the right.
- Desktop uses `minmax(280px, .43fr) minmax(0, 1fr)` with an 18px gap. The rail is sticky, has `min(600px, calc(100vh - 325px))` maximum height, 13px corners, and the active surface, line, and shadow tokens.
- At widths up to 767px, desktop tools and the rail are hidden. The filter control stays in the mobile toolbar.
- The mobile surface is a centered dialog. At 390 × 844 it measures 358 × 756 at x=16, y=44; it has a 15px corner radius, a 42% dark overlay, and a scrollable body between its heading and footer.
- Keep Persian labels, native focusable controls, the existing result count, and the fixed footer action.

## Desktop transition

Animate the current RTL two-column grid track to zero alongside the rail's opacity and 18px horizontal exit. Animate in from the corresponding zero-width track and 18px offset. Keep the rail mounted during its exit, then clear inline animation properties and apply the closed state. This lets the result track reclaim the space before the rail becomes hidden. Use 240ms with `power2.out` entering and `power2.in` exiting as **proposed** values.

## Mobile transition

Fade the overlay and animate the centered dialog from a 14px vertical offset and 0.985 scale. Reverse the translation and fade on exit. Use 240ms with `power2.out` entering and `power2.in` exiting as **proposed** values. Keep the dialog mounted, body scroll lock, focus trap, and `aria-modal` state until the exit finishes. Escape, backdrop, close, and apply all request that same exit. When it ends, restore focus to the mobile trigger.

Backdrop dismissal returns focus to the dialog's close control immediately, so keyboard focus stays inside the still-mounted modal during the exit.

On entry, move focus to the close control on the next animation frame so the triggering pointer event cannot leave focus behind the modal.

## Mobile touch targets

- The mobile close control has a 44 × 44px interactive target while its visible glyph stays compact.
- The reset link has a minimum 44px line target in the fixed footer.
- These sizes follow the customer accessibility contract in docs/designs/nova-atelier-editorial.md §3; the older 32px and 27px local values are superseded.

## Accessibility and preserved contract

- Set `aria-expanded` and `aria-controls` on both triggers; the mobile trigger controls `listing-filter-sheet`.
- Make reduced motion immediate: set the final GSAP values without translate or scale and complete the same state cleanup.
- Do not hide the mobile dialog until its exit completes. The existing focus trap and body lock should stay active until the panel is gone.
- Preserve URL/query ownership in `ListingDiscovery`, all existing filter actions, and the desktop trigger's focus restoration.

## Reference sources

See `source-index.json`, `authority-map.json`, and `conflicts.json`. The active listing cascade resolves the old FilterSelect board's page-placement ambiguity and supersedes the base LTR grid rule. The current rail token is `rgb(83 61 46 / 13%)`, which is the value consumed by the live listing rail.

## Motion status

The animation engine is GSAP with `@gsap/react`'s `useGSAP` hook. Duration, distance, scale, and easing are proposals because the target has no existing transition values. `qa-report.json` records the final local render, schema, and application validation evidence.
