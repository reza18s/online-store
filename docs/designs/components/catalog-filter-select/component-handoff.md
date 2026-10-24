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

A full third-party JSON Schema validator could not be installed because DNS lookup for the package host failed. The local keyword validator checked the schema structure and the design spec against the keywords used. During initial board creation, browser review was blocked by the local-file URL policy; the category integration follow-up has since been reviewed through an isolated localhost preview. Populated facet options remain unverified because the local API was unavailable.

## Category page integration extension — 2026-10-24

The board originally isolated the catalog FilterSelect from page composition. The `/category/:audience` page now reuses its variants for the size and color facets, with category-scoped styling that follows the same 52px trigger, 44px list and size targets, 36px size chip, and 58×62px swatch-cell contract. The category sort keeps the shared native Select and its existing URL update behavior; only its page-scoped presentation changes, with a 48px target and RTL chevron. The mobile filter sheet keeps its existing accordion and results action.

Implementation owners: `apps/web/src/features/catalog/components/category-discovery.tsx` and `apps/web/src/styles/storefront-reference.css`. See `docs/refactoring/category-page-select-polish-plan.md` and `qa-report.json` for the extension scope and current validation evidence.
