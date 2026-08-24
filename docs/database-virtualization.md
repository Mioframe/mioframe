# Database virtualization

Status: **virtualization implementation accepted; PR #217 is blocked by one over-budget moving-surface E2E proof, operator visual reinspection, exact-head CI, and final resulting-PR review**.

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

## Top-level numeric diagnosis — production geometry mismatch not confirmed

The completion pass compared widget-supplied surface offsets with current DOM-derived root-to-`DatabaseViewLayout` offsets throughout the real product lifecycle. Reported values matched at every checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46` during the diagnostic run. Temporary instrumentation was removed.

Together with the accepted shared deep-state proof, current evidence does not justify another production geometry/cache/lifecycle correction. Do not add timers, extra observers, remounts, cache resets, or shared changes without new evidence that survives a proportional product proof.

## Active proof blocker — moving-surface E2E exceeds its budget

Exact-head GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a` failed only `verification-browser (e2e)`. Static, visual, Storybook behavior, and release-version lanes passed.

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` -> `keeps real preceding Database content connected to the table-owned surface range`.

Desktop Chromium exhausted the 30-second per-test timeout on all three attempts, but at different phases. Mobile Chrome passed the same scenario.

The scenario currently:

1. creates the real Weekly Plan starter example, which already contains five rows;
2. performs **40 sequential full add-item UI flows**;
3. only then runs the surface movement/deep-range contract.

This setup is disproportionate to the contract and consumes the same global timeout that is supposed to prove geometry correctness.

### Required proof correction

Keep the same real product scenario but remove unnecessary stress setup:

- use an explicit compact desktop viewport;
- create only a small fixed number of additional rows sufficient to guarantee vertical overflow and a virtualized deep range after the success card is removed;
- preserve the real success card and real dismiss action;
- preserve physical surface movement proof;
- preserve bounded mounted-range assertions;
- preserve first and second deep-range assertions against `aria-rowcount`;
- do not increase timeout, add sleeps, accept retries, or weaken logical assertions.

Large-data stress remains owned by the separate virtualization stress/capability proofs; this scenario owns moving-surface correctness only.

If the corrected proportional proof still fails to reach the logical tail with meaningful test budget remaining, reopen production architecture from that concrete result.

## Sticky action/header stacking — resolved

`DatabaseDataTable` body action cells use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action cell remains locally elevated.

The existing sticky native-table application E2E performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` correction was required.

## Verification workflow

Use focused verifier feedback for the moving-surface proof correction, then the normal cumulative branch gate:

`pnpm verify --base origin/develop`

Do not increase the test timeout or force retries. Do not force `--profile github-actions` on the normal final branch gate.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to later PRs and are not #217 merge blockers.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge only when:

1. the moving-surface product proof is proportional and stable within the normal test budget;
2. operator inspection confirms Database border/corner/sticky presentation, including combined vertical + horizontal sticky behavior;
3. coding-agent `pnpm verify --base origin/develop` passes cleanly on the final code/proof;
4. exact-head GitHub CI is green without retry/flaky classification;
5. final resulting-PR review finds no blocker.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- speculative production moving-surface recovery while the current proof is over-budget;
- increasing E2E timeout or adding sleeps/retry recovery;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.