# Category Checkbox CI Unblock Plan

## Goal

Unblock the checkbox fix PR's repository CI while keeping the lint remediation scoped to the reported legacy duplicate JavaScript file.

## Scope and decision

- Keep `scripts/script.ts` as the maintained TypeScript source and lint it normally.
- Exclude `scripts/script.js` from ESLint because it is an unreferenced JavaScript mirror and its CommonJS/downlevel output produces generated-code-only lint errors.
- Leave the user's separate uncommitted `scripts/script.ts` changes in the primary checkout untouched.

## Steps and acceptance

1. Confirm the JavaScript mirror has no runtime consumers and the TypeScript source remains covered by the root lint command.
2. Add a path-specific ESLint ignore for the mirror and run repository lint, typecheck, and the web build.
3. Commit and push the scoped change, then wait for CI; merge the PR only if required checks pass.

## Risks

- If runtime code starts using `scripts/script.js`, it will remain outside ESLint; the TypeScript source should stay authoritative and the duplicate should be removed or regenerated through a documented workflow.
