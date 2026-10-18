# Merge remaining header updates into main

## Scope and ownership

Integrate commit c8b7896 from origin/codex/header-reference-refresh-20261004 into main (base ab2b07d) through codex/merge-header-into-main-20261018. Preserve all pre-existing uncommitted files. Production ownership remains the storefront app shell, shared header/search controls, and storefront reference stylesheet.

## Acceptance criteria

- The integrated history includes the remaining header branch.
- Inline header search submits to the existing products route, records recent searches, and closes with Escape or close.
- Existing menu, account/cart links, responsive header behavior, catalog filters, and removal of quick-category navigation survive the merge.
- Relevant type/lint/test/build checks and interactive browser checks run on the candidate. Repository CI failures and viewport limits are reported accurately.
- Publish and verify main only after required integration checks pass; otherwise retain the candidate and report the exact blocker.

## Decision and risks

Merge the existing feature branch to retain provenance. Resolve conflicts by preserving compatible behavior from both sides. Do not resurrect the removed quick-category rail. A wholesale replacement of current files would discard newer work. Existing PR #9 CI runs fail at repository-wide Lint; no local lint failure was found in the changed TypeScript files. The user's requested target is `main`; the repository's default branch remains `master`.

## Steps

1. Fetch, inspect protections and branch scope; create dedicated integration branch. Done.
2. Merge the header branch and resolve conflicts in production owners.
3. Validate the integrated candidate and inspect the full staged diff.
4. Commit, publish, and integrate to main if checks allow; fetch and verify remote state.

## Validation results

Resolved the App/header/CSS conflicts while retaining main’s removal of quick-category navigation and catalog filter changes.

- Web typecheck passed.
- Targeted ESLint passed for all changed web TypeScript files.
- Web tests passed: 118 passed, 0 failed.
- Web production client and SSR builds passed. Vite reported the existing large-chunk advisory.
- Browser interaction passed at 885 px: inline search opens, submits a Persian query to the products route, the recent term appears in the search dialog, and Escape closes search. A 390 px runtime viewport was unavailable.
- Existing PR #9 check runs fail at the repository-wide Lint step. The run log could not be retrieved locally; targeted lint for the changed TypeScript files passes. No changed-file check failed.
- Final diff check passed after removing extra blank lines at EOF. User’s pre-existing unstaged and untracked work remains outside the merge.

The candidate is ready for integration; the repository-wide CI lint result remains visible and reported rather than represented as passing.
