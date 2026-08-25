# Review

Verdict: blocked by known relation-table initial readiness flakiness; the first local discriminator was inconclusive.

## Confirmed evidence

Exact-head CI run #4348 failed `tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` on Chromium before relation-view switching. The initial default-view assertion observed zero rendered relation rows; whole-test retry passed and was classified flaky.

The same scenario also failed during local branch verification.

The diagnostic pass did not reproduce the flake locally. At its healthy checkpoint it observed:

- loading indicator absent;
- `DatabaseDataTable` present;
- `aria-rowcount=3`;
- row bootstrap absent;
- two real mounted rows;
- default view selected.

The authorized local `github-actions` profile failed before Playwright startup, so it produced no failing browser state.

A later exact-head CI run #4357 on the same production implementation passed application E2E without flaky classification. Because no production correction occurred between the known failure and that green run, the green run does not close the known flake.

## Active finding

Current evidence still does not distinguish whether the failing empty state is caused by:

1. properties loading keeping `DatabaseDataTable` unmounted;
2. the table being mounted while logical rows are still pending;
3. logical rows being present while the nested virtualizer has no mounted row range.

The relation `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` invariant remains required whenever `DatabaseDataTable` participates in layout.

## Next evidence required

The next diagnostic must preserve enough test-side readiness state into exact-head GitHub CI so that a future failing attempt reports loading/table/`aria-rowcount`/bootstrap/mounted-row/selected-view state at the owned initial default-view assertion.

Do not choose a production correction from the healthy local snapshot alone.

## Forbidden

Do not fix by timeout/retry/sleep, duplicate preload queries, forced remount, `virtualizer.measure()`, shared virtualization changes, weakening E2E assertions, or accepting an isolated green rerun as proof that the known flake is fixed.
