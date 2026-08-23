# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database table virtualization and root-to-table geometry.
- Fresh S0/G1 production revalidation reported for the current runtime/geometry implementation.
- Historical accepted S0/G1 baseline at `68a71e89d03713452946819cb52ba80a64157424`.
- Current bounded-DOM, responsiveness, and performance-attribution contracts.

## Blockers

### B1 — Fresh S0/G1 keeps DOM bounded but exposes a material main-thread responsiveness regression

Owner: `src/entities/databaseData`

Problem: the required fresh measurement now exists, but it does not satisfy performance acceptance. The measured implementation keeps the bounded mounted-work invariant, yet both the small control and 30,000 × 300 stress case are several times slower than the retained accepted baseline and repeatedly produce long main-thread blocks far above the project research target. The current evidence does not yet establish whether the regression is caused by the newer table-owned geometry path or by a measurement-environment/protocol mismatch, so changing geometry before attribution would be speculative.

Evidence:

- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — retained `68a71e89...` S0 median usable 304.9 ms and G1 median usable 350.5 ms, with zero observed Long Tasks in all six samples.
- Fresh revalidation on production state `8d62ba1f8adc66ebb82dd0734afc82824e112f6c` reported S0 usable 1582.5–1950.8 ms with 291–313 ms worst Long Tasks, and G1 usable 1950.7–2516.8 ms with 301–429 ms worst Long Tasks; all samples still mounted 12 rows / 8 headers / 96 expensive cells and passed deep correctness.
- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — current measured rendering owns root/table bounding reads, mutation-triggered refresh, and `onUpdated(updateSurfaceBounds)` inside the native-table owner.
- The tracked delta after measured state `8d62ba1...` changes only tests, so production/geometry remained equivalent for the reported measurement.

Basis:

- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — the responsiveness research target is no switch-associated main-thread block above 100 ms; when a timing target misses, attribute the remaining work before changing architecture.
- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — current geometry performance must be accepted on the final runtime implementation, and the geometry mechanism should change only when focused diagnosis establishes a regression.
- [`../../../AGENTS.md`](../../../AGENTS.md) — main-thread work must remain bounded for large datasets and mobile browsers.

Risk: the original freeze is structurally prevented by bounded DOM, but a short-to-full view switch still spends roughly 1.6–2.5 seconds reaching usable state and contains repeated 291–429 ms main-thread blocks in the measured environment. Accepting this would leave the core responsiveness goal unproved and potentially materially degraded.

Required final state: first reproduce the historical `68a71e89...` baseline and the current production implementation with the same temporary measurement runner and environment. If the historical implementation is also slow, correct the measurement environment/protocol before drawing a production conclusion. If the historical implementation remains materially faster, isolate the first production regression between the two states and route the correction to the actual owner. Preserve the accepted virtualization architecture unless attribution proves it insufficient.

Verification: same-environment A/B S0/G1 evidence using identical production build/preview, Chromium, viewport, worker count, dataset seed, fresh-context policy, in-page timing observer, mounted counts, and correctness sentinels. After an identified production correction, repeat three current S0 and three current G1 samples before acceptance.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Repeating the complete R1/R2/R3/R4/C1/C2/C3 matrix before attribution is not required.
- Worker/query/storage redesign, paging, indexes, or caches are not justified without attribution.

## Unresolved questions

- Whether the fresh slowdown is caused by current production runtime/geometry or by a changed measurement environment/protocol remains unresolved. Same-environment A/B evidence is required before selecting a coding correction.
