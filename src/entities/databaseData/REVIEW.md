# Review

Verdict: blocked

## Scope reviewed

- PR #217 current native Database table virtualization and root-to-table surface geometry.
- Final S0/G1 production performance revalidation and the implementation chronology after that measurement.
- Current bounded-DOM/performance acceptance contract in `docs/database-virtualization.md`.

## Blockers

### B1 — Current geometry implementation is newer than the accepted S0/G1 performance evidence

Owner: `src/entities/databaseData`

Problem: the final S0/G1 production revalidation was measured at `68a71e89d03713452946819cb52ba80a64157424`, when `DatabaseDataTable` consumed already-computed numeric surface offsets. The current implementation instead owns root/table bounding measurements, mutation-triggered updates, and `onUpdated()` geometry refreshes inside `DatabaseDataTable`. That change crosses the canonical virtualization/geometry and measured-rendering boundary after the last timing evidence, so the existing performance results do not prove the current implementation.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — current geometry uses `useElementBounding` for root/table, `useMutationObserver`, and `onUpdated(updateSurfaceBounds)` before deriving the virtual collection surface offsets.
- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — final S0/G1 revalidation records repository head `68a71e89d03713452946819cb52ba80a64157424`.
- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — performance proof may be retained without rerun only while virtualization/geometry and the measured rendering algorithm remain unchanged.

Basis:

- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — current architecture explicitly requires new performance evidence after crossing the virtualization/geometry/measured-rendering boundary.
- [`../../../AGENTS.md`](../../../AGENTS.md) — main-thread work must remain bounded for large datasets and mobile browsers, and required risk-specific proof cannot be replaced by unrelated green checks.
- [`../../../.agents/skills/project-review/SKILL.md`](../../../.agents/skills/project-review/SKILL.md) — missing required performance proof is a blocker even when the implementation is architecturally valid.

Risk: the current geometry path performs DOM-bound measurements during component updates. The previous S0/G1 timing and Long Task results therefore cannot establish that the current rendering path still meets the accepted performance behavior, even though the bounded mounted-DOM invariant remains structurally intact.

Required final state: after all runtime/geometry corrections for this PR are complete, revalidate the existing production S0 and G1 scenarios against the final geometry implementation using the established protocol, and update the performance/readiness documentation with the actual result. Do not repeat the full matrix unless new evidence shows S0/G1 is insufficient.

Verification: the same production Vite build/preview, real Database import/view-switch scenario, three controlled samples per S0/G1 case, mounted row/property/cell counts, switch-to-usable timing, Long Tasks, and deep correctness sentinels used by the existing final revalidation. Run this after any further geometry/runtime correction so the proof is not invalidated again.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Repeating the complete R1/R2/R3/R4/C1/C2/C3 matrix is not required unless the final S0/G1 revalidation reveals a scale-dependent regression.

## Unresolved questions

- The current exact-head E2E slowdown may or may not be related to the newer geometry update path. The CI evidence alone does not establish causality; diagnose it before changing geometry solely for the E2E timeout.
