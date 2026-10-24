# Catalog FilterSelect design handoff

## Scope

The board targets the catalog FilterSelect in apps/web, with its list, size, and swatches presentations. It does not target the base UI Select, admin controls, category-page composition, or listing query behavior.

## Component contract

- Each facet has one string value and one native radio group.
- ListingDiscovery remains responsible for category, size, color, and material URL updates.
- Labels and page direction stay Persian and RTL.
- Loading, empty, disabled, focus, Escape, and reduced-motion behavior remain in the existing component and CSS.

## Visual contract

| Variant | Interactive geometry | Visible geometry |
| --- | --- | --- |
| List | 44px row, 20px indicator, 44px show-more target | 20px square indicator |
| Size | Minimum 44 × 44px target | 36 × 36px chip, 10px corner |
| Swatches | At least 58 × 62px option cell | 36px circle with a 12px name |
| Trigger | 52px minimum height | Existing Atelier styling |

Use the palette in design-tokens.json. Listing option and swatch-cell corners use the Atelier 10–12px range. Facet separators and indicator outlines use line/200. Count text uses ink/700 at 12px; its calculated contrast on surface/0 is 5.54:1.

## Production change

Only apps/web/src/styles/storefront-reference.css changes:

- Apply the line/200 color to the listing facet divider and square indicator outline.
- Bring list-row and swatch-cell corners to 10px.
- Keep size options on a 44 × 44px interactive label target while the nested visual chip stays 36 × 36px.
- Increase show-more height from 32px to 44px.
- Set small facet counts and swatch names to 12px; use the muted Atelier ink token for counts.
- Preserve the already-effective 44px list rows and 20px indicators from the later listing cascade.

## Responsive references

The board shows desktop and mobile breakpoints. The clean mobile reference is 390 × 844 with a 358 × 756 sheet at x=16, y=44, following the prior component plan. The mobile PNG is an offline raster reference, not a screenshot of the live app.

The earlier plan and desktop reference disagree about which side of the page contains the filter rail. That page-level choice remains out of scope; this board isolates the component.

## Validation status

See qa-report.json. Web typecheck and build passed; the build has existing Vite deprecation and chunk-size warnings. Static reference images, image dimensions, the authored schema keywords, and the patch whitespace check passed. No tests were run.

A full third-party JSON Schema validator could not be installed because DNS lookup for the package host failed. The local keyword validator checked the schema structure and the design spec against the keywords used. A live browser review was blocked by the local-file URL policy and remains unverified.
