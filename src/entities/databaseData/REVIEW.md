# Review

Verdict: virtualization implementation and proportional moving-surface proof are accepted; merge remains blocked by a known relation-table readiness flake, operator visual reinspection, exact-head CI, and final resulting-PR review.

## Resolved

- shared deep-state `surfaceOffset` contract;
- top-level widget-supplied offsets;
- proportional moving-surface product proof;
- relation local-root explicit `0/0` geometry invariant;
- sticky action/header stacking and real-browser hit-testing.

Exact-head run #4348 confirms the corrected moving-surface scenario passes on desktop Chromium and Mobile Chrome.

## Active blocker — relation table readiness

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` has a known Chromium flake. A failing attempt observed zero initial relation rows before any explicit view switch and its whole-test retry passed. The same scenario also failed during local branch verification.

The first readiness discriminator did not reproduce the failure. Its healthy local checkpoint showed table mounted, `aria-rowcount=3`, no bootstrap row, two mounted real rows, and default view selected. The authorized local `github-actions` profile failed before Playwright startup and yielded no browser evidence.

Exact-head run #4357 subsequently passed without a production correction. That green run is useful evidence that the failure is intermittent, but it cannot close a known flaky contract.

Current evidence still does not distinguish whether a failing empty state occurs before table/data-query readiness or after logical items arrive but before a mounted virtual range exists.

The next diagnostic must surface the readiness snapshot in exact-head CI when the owned assertion fails. Do not select a production correction from the healthy local state alone.

The relation `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` invariant remains required whenever the table participates in layout.

## Forbidden

No timeout/retry/sleep workaround, helper weakening, duplicate row preload, forced remount, `virtualizer.measure()`, shared virtualization change, isolated-green-run acceptance, or unrelated performance work.

## Remaining gates

1. identify and correct the relation readiness flake from failing-state evidence;
2. clean `pnpm verify --base origin/develop` after the eventual correction;
3. operator visual reinspection;
4. exact-head CI green without flaky classification after the correction;
5. final resulting-PR review.
