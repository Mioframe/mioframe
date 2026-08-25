# Review

Verdict: blocked

## Scope reviewed

- `databaseViewsAndQueryFlows.spec.ts` relation selected-view scenario and its current readiness diagnostic.
- `helpers.ts` row-order helper used by that scenario.
- Recovered failing branch-gate snapshot from the existing diagnostic.

## Blockers

### B1 — Relation row-order proof uses an unstable custom polling boundary

Owner: `tests/e2e`

Problem: the relation selected-view scenario wraps `expectDatabaseValuesInOrder()` in `expect.poll()`. The helper first reads the matching row count and then performs separate per-row `innerText()` reads. On the reproduced failed attempt the helper reported an empty joined row order, while the diagnostic read immediately after that failed sample observed a fully healthy relation state: one table, `aria-rowcount="3"`, no bootstrap, two real rows containing the expected alpha/beta values, and the default relation view selected. The current per-failed-attempt diagnostic also adds extra DOM reads inside the poll callback. This is an unstable proof boundary for an asynchronously rendered row list, not evidence of an incorrect persisted/product relation state.

Evidence:

- [`helpers.ts`](helpers.ts) — `getDatabaseRowTexts()` reads `rows.count()` and then individual `innerText()` values in separate Playwright operations; `expectDatabaseValuesInOrder()` builds order proof from that sampled result.
- [`databaseViewsAndQueryFlows.spec.ts`](databaseViewsAndQueryFlows.spec.ts) — `uses default relation view inline and switches to a selected relation view` wraps that helper in `expect.poll()` and performs diagnostic DOM reads after each failed callback sample.
- [`../../docs/database-virtualization-relation-readiness-failure-evidence-handoff.md`](../../docs/database-virtualization-relation-readiness-failure-evidence-handoff.md) — defines the evidence pass that recovered the already-recorded failure rather than selecting a production correction.

Recovered failure evidence:

```json
{
  "loadingIndicatorCount": 0,
  "databaseTableCount": 1,
  "tableAriaRowcounts": ["3"],
  "rowBootstrapCount": 0,
  "mountedRealTbodyRowCount": 2,
  "renderedRowTexts": ["alpha target 1787680495219-lov1e2", "beta target 1787680495219-yv6uvq"],
  "selectedRelationViewChipTexts": ["checkdefault view"]
}
```

The same attempt's original assertion reported `expected "alpha target 1787680495219-lov1e2" in row text order: ; expected >= 0, received -1`; whole-test retry then passed.

Basis:

- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — browser helpers may provide strict outcome waits, and browser instability must not be hidden through retries/recovery; proof should use the lowest faithful observable.
- [Playwright locator assertions](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text) — locator assertions are web-first/auto-retrying; array `toContainText` verifies expected texts against a locator list in the specified order while allowing other list elements.

Risk: a correct product state can be reported as flaky by the custom sampled poll, blocking branch verification and CI without demonstrating a user-visible defect.

Required final state: in this scenario, prove the initial `[alphaValue, betaValue]` and selected-view `[betaValue, alphaValue]` row ordering through one Playwright web-first locator-list assertion with equivalent ordering semantics. Remove the temporary relation-readiness diagnostic from the scenario once the custom poll is replaced. Keep product behavior, expected values/order, application helper semantics elsewhere, timeouts, retries, and production code unchanged.

Verification: focused application E2E for `databaseViewsAndQueryFlows.spec.ts`, applicable static checks for the changed spec, then `pnpm verify --base origin/develop`. Exact-head GitHub CI must pass without retry/flaky classification.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A global rewrite of `expectDatabaseValuesInOrder()` is not required by this finding; other consumers should remain unchanged unless independent evidence shows the same defect.
- No relation-value, DatabaseDataTable, virtualizer, query, persistence, timeout, retry, or loading-behavior correction is justified by the captured state.

## Unresolved questions

None.
