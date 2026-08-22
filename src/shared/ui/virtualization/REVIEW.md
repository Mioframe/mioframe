# Review

Verdict: blocked

## Scope reviewed

- `useVirtualCollection` public API after `measure` -> `vItem` rename.
- Shared Storybook browser capability proof, especially non-zero `surfaceOffset` geometry.
- Colocated reusable-library documentation.

Correction contract:

- [`../../../../docs/database-virtualization-stability-handoff.md`](../../../../docs/database-virtualization-stability-handoff.md)
- [`../../../../docs/database-virtualization-stability-preflight.md`](../../../../docs/database-virtualization-stability-preflight.md)

## Blockers

### B1 — Non-zero surface-offset proof is known intermittent

Owner: `src/shared/ui/virtualization`

Problem: The required non-zero `surfaceOffset` browser contract produced a failed focused run before passing on a later rerun. The current test samples live geometry after deep scrolling without a deterministic settled snapshot for all compared values, so a clean rerun cannot be accepted as stable proof.

Evidence:

- [`VirtualCollectionCapability.browser.spec.ts`](./VirtualCollectionCapability.browser.spec.ts) — the non-zero `surfaceOffset` scenario reads `totalSize`, `trailingSize`, last-item geometry, and `scrollHeight` across separate live browser reads after only waiting for `leadingSize > 100000`.
- [`README.md`](./README.md) — non-zero `surfaceOffset` is a public library contract and current readiness records the known intermittent proof.
- [`../../../../docs/database-virtualization-browser-proof.md`](../../../../docs/database-virtualization-browser-proof.md) — capability exit criteria require deterministic non-zero `surfaceOffset` geometry and explicitly reject known intermittent proof.

Basis:

- [`../../../../AGENTS.md`](../../../../AGENTS.md) — known flaky behavior is failed proof; retry-pass/clean rerun is not accepted, and tests must not be weakened with sleeps/retries/timeout inflation.
- [`../../../../docs/database-virtualization-stability-handoff.md`](../../../../docs/database-virtualization-stability-handoff.md) — accepted correction architecture requires one self-consistent public/DOM geometry snapshot and preserves existing tolerances/runtime architecture.

Risk: The capability gate can report green while the public collection-relative geometry proof is racing browser measurement/scroll settling, so production migration would start on non-deterministic evidence.

Required final state: The non-zero `surfaceOffset` browser proof observes a deterministic, self-consistent public/DOM geometry state and passes without relying on retries, sleeps, timeout inflation, weakened tolerances, or TanStack private state.

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
