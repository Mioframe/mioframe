# Review

Verdict: blocked by relation-table initial readiness flakiness.

Active diagnosis contract:

- `docs/database-virtualization-relation-readiness-discriminator-handoff.md`
- `docs/database-virtualization-relation-readiness-discriminator-preflight.md`

## Confirmed evidence

Exact-head CI run #4348 failed `tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` on Chromium before relation-view switching. The initial default-view assertion observed zero rendered relation rows; whole-test retry passed and was classified flaky.

The same scenario also failed during local branch verification.

The previous `0/0` geometry invariant remains valid: whenever `DatabaseDataTable` participates in layout it is first unpadded content of `.relation-value-field__data`.

## Active finding

Current evidence does not yet distinguish whether the empty initial relation table is caused by:

1. properties loading keeping `DatabaseDataTable` unmounted, which also delays its row query;
2. the table being mounted while logical rows are still pending;
3. logical rows being present while the nested virtualizer has no mounted row range.

Run the active readiness discriminator before choosing a production correction.

## Forbidden

Do not fix by timeout/retry/sleep, duplicate preload queries, forced remount, `virtualizer.measure()`, shared virtualization changes, or weakening E2E assertions.
