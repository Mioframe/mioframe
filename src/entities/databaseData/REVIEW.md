# Review

Verdict: blocked

## Scope reviewed

- Database native-table virtualization capability after the shared API `vItem` rename.
- Above-viewport row-resize anchor proof in Chromium/Firefox.
- Existing bounded row/column/cell and native-table geometry contracts.

Correction contract:

- [`../../../docs/database-virtualization-stability-handoff.md`](../../../docs/database-virtualization-stability-handoff.md)
- [`../../../docs/database-virtualization-stability-preflight.md`](../../../docs/database-virtualization-stability-preflight.md)

## Blockers

### B1 — Above-viewport anchor proof is known intermittent

Owner: `src/entities/databaseData`

Problem: The required above-viewport resize anchor-stability browser scenario produced a failed focused run before passing on a later rerun. The current setup only waits for a non-empty mounted range before snapshotting above-viewport and visible-anchor geometry, which does not prove that scroll/range/measurement state has settled. After resize, public row-size growth and anchor movement are observed separately, so the assertion may also run before TanStack-owned scroll correction reaches its final state.

Evidence:

- [`DatabaseVirtualizationCapability.browser.spec.ts`](./DatabaseVirtualizationCapability.browser.spec.ts) — the anchor scenario scrolls, waits only for mounted-row presence/count, snapshots row rectangles, then resizes an above-viewport row and compares the anchor position through a separate poll.
- [`../../../docs/database-virtualization-browser-proof.md`](../../../docs/database-virtualization-browser-proof.md) — above-viewport anchor correction is a required capability contract and known intermittent proof blocks the exit criterion.
- [`../../../docs/database-virtualization-collection-api-result.md`](../../../docs/database-virtualization-collection-api-result.md) — current result records this test as an active stability blocker while keeping the architecture accepted.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — known flaky behavior is failed proof; retry-pass/clean rerun is not accepted, and tests must not be weakened with sleeps/retries/timeout inflation.
- [`../../../docs/database-virtualization-stability-handoff.md`](../../../docs/database-virtualization-stability-handoff.md) — accepted correction architecture requires settled public/DOM snapshots before and after resize and preserves existing anchor tolerance/runtime ownership.

Risk: The database capability can appear green without deterministically proving TanStack-owned scroll correction for measured rows above the viewport, which is a required geometry behavior before production table migration.

Required final state: The anchor proof establishes a deterministic settled initial viewport/range/geometry snapshot before resize, then waits for both public row-size growth and settled post-resize anchor geometry before comparing final anchor movement, without sleeps, recovery loops, broad retries, timeout inflation, weakened semantics, or private TanStack state.

Verification: Follow the bounded stability diagnostic in `docs/database-virtualization-stability-preflight.md`; exact-head CI must then pass with no flaky test classification.

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
