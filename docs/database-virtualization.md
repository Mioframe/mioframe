# Database virtualization

Status: **virtualization implementation and proportional moving-surface proof correction accepted; PR #217 remains pending exact-head CI, operator visual reinspection, and final resulting-PR review**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

## PR #217 scope

This PR finishes Database virtualization itself.

In scope through completion:

- bounded row/property rendering;
- deep-range correctness and physical-root/surface geometry;
- top-level and nested relation roots;
- native-table spacer/bootstrap integration;
- sticky header/action behavior;
- accessibility and logical ARIA contracts;
- presentation regressions introduced or exposed by the virtualization/native-table migration;
- stable, proportional proof of those virtualization contracts.

Explicitly deferred to later PRs:

- remaining heterogeneous-content Chromium freezes/jank;
- value-type-specific rendering cost investigation;
- other causes of Short -> Full or scrolling stalls that are not caused by virtualization correctness/integration.

Those performance investigations remain owned by `docs/database-chrome-jank-follow-up.md` and are not #217 merge criteria.

## Current correction record

- `docs/database-virtualization-moving-surface-proof-correction-handoff.md`;
- `docs/database-virtualization-moving-surface-proof-correction-preflight.md`;
- `src/entities/databaseData/REVIEW.md`.

The production completion pass is complete. The moving-surface proof correction is implemented and now awaits exact-head CI.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains the shared one-axis boundary with its current public API.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Physical scroll-root/composition owners supply truthful root-to-collection-surface offsets.
- Service/worker remains canonical for row membership/filter/sort/order.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

Implementation flow:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The removed entity root/table ancestor/sibling geometry-discovery path must not return.

## Settled implementation contracts

Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. It disappears when TanStack supplies real virtual items and never becomes a second range/measurement owner.

`MDTable` uses one native root-owned outer border/radius with no per-row pseudo-element perimeter.

Database body action cells remain sticky/right below the shared sticky-header plane; the header action intersection remains locally elevated inside the header plane.

`RelationValueFieldData` renders its loading indicator and `DatabaseDataTable` mutually exclusively, so explicit local `0/0` offsets are truthful whenever the table is mounted.

## Shared deep-state surfaceOffset contract — accepted

Reusable browser capability proves:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`

on the same root/list. Both deep phases reach the logical tail, top recovery reaches item `0`, mounted work remains bounded, and public/physical geometry remains consistent.

`useVirtualCollection.ts` remains unchanged. No shared/TanStack production correction, `virtualizer.measure()`, cache-reset protocol, or virtualizer exposure is justified.

## Top-level numeric diagnosis — no production geometry mismatch confirmed

The completion pass compared widget-supplied surface offsets with current DOM-derived root-to-`DatabaseViewLayout` offsets throughout the real product lifecycle. Reported values matched at every checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46` during the diagnostic run. Temporary instrumentation was removed.

Together with the accepted shared deep-state proof, current evidence does not justify another production geometry/cache/lifecycle correction. Do not add timers, extra observers, remounts, cache resets, or shared changes without new evidence from a proportional product proof.

## Moving-surface product proof — corrected

Exact-head GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a` failed only application E2E. The old moving-surface scenario used the real five-row Weekly Plan starter example plus 40 sequential Add Item dialog flows, and desktop Chromium exhausted the 30-second test budget at different phases across initial attempt and retries. Mobile Chrome passed.

The correction is test-only. `tests/e2e/databaseVirtualizationFlows.spec.ts` now uses:

- desktop viewport `640 x 360`;
- Mobile Chrome project width `393` with height `360`;
- five real starter rows;
- exactly 16 additional Task rows through the existing public Add Item flow;
- 21 logical data rows, exposed as `aria-rowcount=22` including the header.

The corrected proof preserves:

- real starter success card before the table;
- non-zero initial vertical/horizontal surface offsets;
- bounded initial top range beginning at logical row index `2`;
- first deep logical tail `22/22` with bounded mounted work;
- real `Got it` dismissal;
- decreased physical vertical surface offset after dismissal;
- bounded moved top range beginning at logical row index `2`;
- second deep logical tail `22/22` with bounded mounted work.

No production code changed.

The coding agent reports the focused moving-surface proof clean in multiple independent executions. Its branch-diff gate later stopped on a different `databaseViewsAndQueryFlows.spec.ts` relation-view flake rather than this corrected scenario. Under repository verification rules an unrelated or differently owned branch-gate failure is reported rather than patched inside this proof correction.

Any exact-head retry/flaky classification of the moving-surface scenario itself reopens this finding.

## Verification correction

The architect-authored proof handoff originally required:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts --repeat 3`

That requirement was invalid. Current `.agents/skills/verification/SKILL.md` defines `--repeat` as a bounded Storybook-behavior-only diagnostic. E2E does not support it.

The supported verification contract is:

- focused E2E: `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`;
- required coding-agent branch gate: `pnpm verify --base origin/develop`, with stop/report if a failure is unrelated or requires another owner;
- exact-head GitHub CI as the authoritative automatic merge gate.

Do not increase timeout or accept retry/flaky classification.

## Sticky action/header stacking — resolved

`DatabaseDataTable` body action cells use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action cell remains locally elevated.

The existing sticky native-table application E2E performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` correction was required.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to later PRs and are not #217 merge blockers.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge only when:

1. exact-head GitHub CI is green without retry/flaky classification for the virtualization proofs;
2. operator inspection confirms Database border/corner/sticky presentation, including combined vertical + horizontal sticky behavior;
3. final resulting-PR review finds no blocker.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- speculative production moving-surface recovery without new failing evidence;
- increasing E2E timeout, `test.slow()`, sleeps, or retry recovery;
- changing application-E2E project applicability;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.
