# Review

Verdict: virtualization implementation and the proportional moving-surface proof correction are accepted; merge is blocked by a reproducible relation-table readiness flake, operator visual reinspection, exact-head CI, and final resulting-PR review.

Active diagnosis contract:

- `docs/database-virtualization-relation-readiness-discriminator-handoff.md`
- `docs/database-virtualization-relation-readiness-discriminator-preflight.md`
- `src/features/relationValueEdit/REVIEW.md`

## Resolved

- shared deep-state `surfaceOffset` contract;
- top-level widget-supplied offsets;
- proportional moving-surface product proof;
- relation local-root explicit `0/0` geometry invariant;
- sticky action/header stacking and real-browser hit-testing.

Exact-head run #4348 confirms the corrected moving-surface scenario passes on desktop Chromium and Mobile Chrome.

## Active blocker — relation table readiness

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` is flaky on Chromium. The first attempt observes zero initial relation rows before any explicit view switch; retry passes. The same scenario also failed during local branch verification.

Current evidence does not distinguish whether:

1. `RelationValueFieldData` is still in properties-loading state and `DatabaseDataTable` has not mounted;
2. the table is mounted but logical rows are still pending;
3. logical rows are present but the nested virtualizer has no mounted row range.

Run the active discriminator before selecting a production correction.

The relation `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` invariant remains required whenever the table participates in layout.

## Forbidden

No timeout/retry/sleep workaround, helper weakening, duplicate row preload, forced remount, `virtualizer.measure()`, shared virtualization change, or unrelated performance work.

## Remaining gates

1. resolve relation readiness from discriminator evidence;
2. clean `pnpm verify --base origin/develop` after the eventual correction;
3. operator visual reinspection;
4. exact-head CI green without flaky classification;
5. final resulting-PR review.
