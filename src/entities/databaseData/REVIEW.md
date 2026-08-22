# Review

Verdict: blocked

## Scope reviewed

- Database native-table virtualization capability after the shared API `vItem` rename.
- Above-viewport row-resize anchor proof in Chromium/Firefox.
- Existing bounded row/column/cell and native-table geometry contracts.

## Blockers

### B1 — Above-viewport anchor proof is known intermittent

Owner: `src/entities/databaseData`

Problem: The required above-viewport resize anchor-stability browser scenario produced a failed focused run before passing on a later rerun. The current setup only waits for a non-empty mounted range before snapshotting above-viewport and visible-anchor geometry, which does not prove that scroll/range/measurement state has settled.

Evidence:

- [`DatabaseVirtualizationCapability.browser.spec.ts`](./DatabaseVirtualizationCapability.browser.spec.ts) — the anchor scenario scrolls, waits only for mounted-row presence/count, snapshots row rectangles, then resizes an above-viewport row and compares the anchor position.
- [`../../../docs/database-virtualization-browser-proof.md`](../../../docs/database-virtualization-browser-proof.md) — above-viewport anchor correction is a required capability contract and known intermittent proof blocks the exit criterion.
- [`../../../docs/database-virtualization-collection-api-result.md`](../../../docs/database-virtualization-collection-api-result.md) — current result records this test as an active stability blocker while keeping the architecture accepted.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — known flaky behavior is failed proof; retry-pass/clean rerun is not accepted, and tests must not be weakened with sleeps/retries/timeout inflation.

Risk: The database capability can appear green without deterministically proving TanStack-owned scroll correction for measured rows above the viewport, which is a required geometry behavior before production table migration.

Required final state: The anchor proof establishes a deterministic settled initial viewport/range/geometry snapshot before resize and then proves bounded anchor movement after the public row size changes, without sleeps, recovery loops, broad retries, timeout inflation, weakened semantics, or private TanStack state.

Verification: Run the focused database Storybook browser proof in Chromium and the narrow Firefox project and confirm no intermittent classification; exact-head CI must then pass with no flaky test classification.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
