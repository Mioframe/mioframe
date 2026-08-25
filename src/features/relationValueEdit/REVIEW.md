# Review

Verdict: blocked by known relation-table initial readiness flakiness; no production correction is selected yet.

Active diagnosis contract:

- `docs/database-virtualization-relation-readiness-ci-diagnostic-handoff.md`
- `docs/database-virtualization-relation-readiness-ci-diagnostic-preflight.md`

## Confirmed evidence

Exact-head CI run #4348 failed `tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` on Chromium before relation-view switching. The initial default-view assertion observed zero rendered relation rows; whole-test retry passed and was classified flaky.

The same scenario also failed during local branch verification.

The first local discriminator did not reproduce the flake. Its healthy checkpoint observed loading absent, table present, `aria-rowcount=3`, no row bootstrap, two mounted real rows, and default view selected. The authorized local `github-actions` profile failed before Playwright startup.

Exact-head run #4357 later passed without a production correction. That confirms intermittency but does not close the known flaky contract.

## Active finding

The failing state still does not distinguish whether:

1. properties loading keeps `DatabaseDataTable` unmounted;
2. the table is mounted while logical rows are pending;
3. logical rows are present while the nested virtualizer has no mounted row range.

The next change is test-only: preserve the existing initial default-view assertion while emitting one structured readiness snapshot only after that assertion finally fails in CI.

The relation `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` invariant remains required whenever `DatabaseDataTable` participates in layout.

## Forbidden

Do not choose a production fix from healthy local state, accept an isolated green CI run as resolution, increase timeout, add sleeps/retry recovery, weaken assertions, duplicate preload queries, force remount, call `virtualizer.measure()`, or change shared virtualization.
