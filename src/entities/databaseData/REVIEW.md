# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database table virtualization and root-to-table geometry.
- Current bounded-DOM and deep-correctness evidence.
- Retained historical S0/G1 evidence.
- Later current-geometry slowdown measurement and its proof workflow.

## Blockers

### B1 — Current responsiveness must be reproduced in the verifier-owned environment

Owner: `src/entities/databaseData`

Problem: current production structurally satisfies the bounded mounted-work invariant, but the latest temporary measurement reported S0/G1 usable-state delays of roughly 1.6–2.5 seconds and repeated 291–429 ms Long Tasks. That measurement was not produced through the canonical focused verifier workflow, and the attempted historical A/B follow-up required manual Git/worktree orchestration that proved unsuitable for the coding-agent workflow. The performance blocker therefore remains, but the next proof must be narrower and verifier-owned.

Evidence:

- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — historical `68a71e89...` S0/G1 evidence is fast and structurally bounded; later current-geometry measurement is structurally bounded but reports the slowdown and Long Tasks.
- [`../../../docs/database-virtualization-performance-attribution-handoff.md`](../../../docs/database-virtualization-performance-attribution-handoff.md) — active replacement contract requires current-head reproduction only through `pnpm verify --only e2e`.
- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — current table implementation remains the measured product owner; no production correction is authorized by the current diagnostic pass.

Basis:

- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — switch-associated main-thread work above the 100 ms research target requires diagnosis before performance acceptance.
- [`../../../.agents/skills/verification/SKILL.md`](../../../.agents/skills/verification/SKILL.md) — coding-agent browser diagnostics use focused verifier-managed proof; repository-wide final verification remains architect-owned.
- [`../../../AGENTS.md`](../../../AGENTS.md) — main-thread work must remain bounded for large datasets and mobile browsers.

Risk: merging without canonical current-head responsiveness evidence could leave the original freeze replaced by a reproducible 1.6–2.5 second interaction delay, while treating a noncanonical measurement as definitive could also trigger unnecessary architecture changes.

Required final state: collect exactly three S0 and three G1 samples on the current PR head through the focused verifier-managed application-E2E lane, preserving the established timing, bounded-DOM, and deep-correctness observations. Classify only whether the slowdown is reproduced, not reproduced, or ambiguous. If reproduced, stop and route a separate current-head attribution task. If not reproduced, the architect evaluates whether the earlier result was an environment/protocol mismatch and whether performance acceptance can close.

Verification: one temporary nested diagnostic spec executed only through:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts
```

The temporary spec must be removed before handoff. No historical checkout/worktree or direct Playwright/Vite execution is part of this proof.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Historical-ref A/B execution by the coding agent.
- First-bad commit localization before canonical current-head reproduction.
- Full R1/R2/R3/R4/C1/C2/C3 matrix.
- Worker/query/storage redesign, paging, indexes, or caches.

## Unresolved questions

- Whether the reported current slowdown reproduces inside the canonical verifier-owned E2E environment.
