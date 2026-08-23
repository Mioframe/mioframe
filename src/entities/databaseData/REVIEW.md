# Review

Verdict: blocked

## Scope reviewed

- PR #217 `DatabaseDataTable` root-to-surface ownership and the application E2E that proves non-zero production surface displacement.

## Blockers

None.

## Major issues

### M1 — Surface-offset proof reads a private virtualizer marker and does not prove the moved surface after dismissal

Owner: `src/entities/databaseData`

Problem: the new preceding-content E2E reads `data-mioframe-virtual-index` to identify mounted ranges even though that attribute is explicitly private to `useVirtualCollection`. After dismissing the preceding success card, the test proves only that the DOM-measured table offset changed and that some rows remain mounted; it does not exercise a logical deep range/sentinel again after the surface moved.

Evidence:

- [`../../../tests/e2e/databaseViewsAndQueryFlows.spec.ts`](../../../tests/e2e/databaseViewsAndQueryFlows.spec.ts) — `keeps real preceding Database content connected to the table-owned surface range` reads `data-mioframe-virtual-index`; after the success card is dismissed it checks the physical offset and non-empty rows but no post-move logical range/sentinel.
- [`../../shared/ui/virtualization/useVirtualCollection.ts`](../../shared/ui/virtualization/useVirtualCollection.ts) — `data-mioframe-virtual-index` is documented as Mioframe-private and owned exclusively by the measurement directive.

Basis:

- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — production proof must use public DOM/user behavior, never TanStack/private virtualizer state; layout changes that move the table must update the derived offset.
- [`../../../docs/testing/architecture.md`](../../../docs/testing/architecture.md) — tests protect observable/public contracts rather than incidental private implementation details.

Risk: the proof is coupled to a private measurement marker and can remain green even if a future root-to-surface update becomes stale after the preceding composition changes. That weakens the central correction contract this E2E is meant to protect.

Required final state: identify mounted logical ranges through public table semantics such as `aria-rowindex`/sentinels, and prove correct virtualized behavior after the real preceding surface changes as well as while the non-zero displacement exists. Do not expose another test-only virtualizer API.

Verification: the same application E2E should exercise public logical row metadata or sentinels before/deep-after scrolling and again after the preceding content moves/removes, while preserving bounded mounted work.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No change to `useVirtualCollection` is needed; the test must consume existing public product semantics.

## Unresolved questions

None.
