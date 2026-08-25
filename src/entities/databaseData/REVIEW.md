# Review

Verdict: virtualization implementation and proportional moving-surface proof are accepted; merge remains blocked by a known relation-table readiness flake, operator visual reinspection, exact-head CI after correction, and final resulting-PR review.

Active diagnosis contract:

- `docs/database-virtualization-relation-readiness-ci-diagnostic-handoff.md`
- `docs/database-virtualization-relation-readiness-ci-diagnostic-preflight.md`
- `src/features/relationValueEdit/REVIEW.md`

## Resolved

- shared deep-state `surfaceOffset` contract;
- top-level widget-supplied offsets;
- proportional moving-surface product proof;
- relation local-root explicit `0/0` geometry invariant;
- sticky action/header stacking and real-browser hit-testing.

## Active blocker — relation table readiness

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` has a known Chromium flake. A failing attempt observed zero initial relation rows before any explicit view switch and its whole-test retry passed. The same scenario also failed during local branch verification.

The first local readiness discriminator was inconclusive: healthy local state was table mounted with `aria-rowcount=3`, two real rows and no bootstrap; local `github-actions` profile failed before Playwright startup. Exact-head #4357 later passed without a production correction, confirming intermittency rather than resolution.

Current evidence still does not identify whether the failing empty state is pre-table/data-query readiness or a logical-row/virtual-range readiness gap.

The active change is test-only CI-visible failure diagnostics on the existing initial default-view assertion. No production correction is authorized until failing-state evidence is captured.

The relation `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` invariant remains required whenever the table participates in layout.

## Forbidden

No timeout/retry/sleep workaround, helper weakening, duplicate row preload, forced remount, `virtualizer.measure()`, shared virtualization change, isolated-green-run acceptance, or unrelated performance work.

## Remaining gates

1. capture failing relation readiness state and correct its root cause;
2. clean `pnpm verify --base origin/develop` after the correction;
3. operator visual reinspection;
4. exact-head CI green without flaky classification after correction;
5. final resulting-PR review.
