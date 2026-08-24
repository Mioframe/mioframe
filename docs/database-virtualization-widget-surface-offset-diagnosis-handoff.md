# Database virtualization widget surface-offset diagnosis handoff

Status: **ready as Pass A of `docs/database-virtualization-completion-pass-handoff.md`**.

## Goal

Determine why the top-level Database product scenario can fail on desktop Chromium after the shared deep-state `surfaceOffset` contract was proved correct.

## Confirmed current behavior and evidence

- Shared Storybook browser proof at `e52d6c7bf2397a62c6669078043f874025a0fdc0` passes `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, including bounded mount count and consistent public/physical geometry.
- `useVirtualCollection.ts` is unchanged; shared production is no longer the current owner candidate.
- Exact-head CI previously failed the top-level moving-surface product scenario 3/3 on desktop Chromium; a later run passed without a production correction. The known instability therefore remains unresolved.
- `DatabaseViewWidget` currently derives vertical/horizontal offsets from two `useElementBounding` snapshots plus current root scroll position and refreshes those snapshots from `onMounted`/`onUpdated`.

## Non-goals

- no moving-surface production correction in this pass;
- no shared virtualization or TanStack change;
- no entity geometry fallback;
- no permanent diagnostic API/state;
- no MDTable, worker/query/storage, or residual performance work.

## Source of truth

At the same lifecycle point compare:

1. actual physical root-to-`DatabaseViewLayout` content-coordinate offset from current DOM geometry;
2. numeric offset currently supplied by `DatabaseViewWidget` to `DatabaseViewLayout`/`DatabaseDataTable`.

Checkpoints:

- initial top before first deep;
- settled first deep before dismiss;
- immediately after dismiss/layout movement while still deep;
- returned top;
- second deep attempt.

## Minimum sufficient diagnosis

Use temporary task-local instrumentation in `DatabaseViewWidget` only if needed to expose the supplied values to verifier-managed E2E output. Remove all instrumentation before handoff.

Run the owning E2E normally first. If it does not reproduce, a targeted focused `--profile github-actions` verifier run is allowed for this diagnosis only.

## Decision rule

- `widget-offset-mismatch`: supplied and physical values diverge; return the first divergence and complete numeric trace. Do not implement the correction in this pass.
- `offsets-truthful-product-still-fails`: values remain truthful through a reproduced failure; return the trace and stop for architecture reconsideration.
- `not-reproduced`: no failure reproduced in authorized runs; still return supplied/physical traces for the observed successful lifecycle. Do not infer a production fix.

Independent Passes B/C in the completion handoff may proceed regardless of this diagnostic result.

## Verification

Primary product owner remains `tests/e2e/databaseVirtualizationFlows.spec.ts`. Do not weaken the moving-surface scenario or permanently assert private widget state. After temporary instrumentation is removed, the consolidated completion task owns the final `pnpm verify --base origin/develop` gate.

## Forbidden

Moving-surface production correction; permanent `data-*` diagnostics; shared virtualization edits; `virtualizer.measure()`; entity observer fallback; speculative nextTick/rAF/timer/observer fixes; sleeps/timeout inflation/retry-as-success; direct browser commands; mutating Git workflow.
