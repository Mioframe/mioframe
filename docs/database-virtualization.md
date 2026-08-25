# Database virtualization

Status: **virtualization implementation and proportional moving-surface proof correction accepted; PR #217 is blocked by relation-table readiness flakiness, operator visual reinspection, exact-head CI, and final resulting-PR review**.

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

## Active diagnosis contract

- `docs/database-virtualization-relation-readiness-discriminator-handoff.md`
- `docs/database-virtualization-relation-readiness-discriminator-preflight.md`
- `src/features/relationValueEdit/REVIEW.md`

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

Relation local-root geometry remains explicit: `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` must be truthful whenever the relation table participates in layout.

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

Together with the accepted shared deep-state proof, current evidence does not justify another production geometry/cache/lifecycle correction.

## Moving-surface product proof — accepted

The previously over-budget moving-surface E2E now uses a compact deterministic viewport and 16 additional real rows while preserving the real success-card lifecycle, bounded mounted ranges, physical surface movement, and both logical-tail checks.

Exact-head GitHub Actions run #4348 on `cf2d9c246c324193bf0398327a1268edfad75426` confirms that scenario passes on both desktop Chromium and Mobile Chrome. The moving-surface finding remains closed.

## Active blocker — relation table initial readiness

Exact-head run #4348 failed only application E2E with one Playwright flaky result:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` -> `uses default relation view inline and switches to a selected relation view`.

The first Chromium attempt failed before the explicit relation-view switch. The initial default-view assertion observed no mounted relation rows (`joined === ""`). The whole-test retry passed, so the repository correctly rejected the run as flaky.

The same scenario had already failed during coding-agent branch verification. It is therefore a real current proof blocker and cannot be dismissed as unrelated CI noise.

Current evidence does not distinguish whether the empty state is caused by:

1. properties loading keeping `DatabaseDataTable` unmounted;
2. the table being mounted while logical rows are still pending;
3. logical rows being present while the nested virtualizer has no mounted range.

Run the active readiness discriminator before choosing a production correction.

## Relation local-root geometry — preserved

The previous `v-else` correction solved a real geometry issue: a normal-flow spinner preceding a mounted table makes fixed vertical surface offset `0` false.

Any readiness correction must keep `0/0` truthful whenever the relation table is visible/participates in layout. Do not restore the old spinner-before-table normal-flow topology.

## Sticky action/header stacking — resolved

`DatabaseDataTable` body action cells use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action cell remains locally elevated.

The existing sticky native-table application E2E performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` correction was required.

## Verification workflow

For the readiness discriminator use verifier-managed focused E2E only. If the normal profile does not reproduce, one focused `--profile github-actions` run is allowed. The discriminator is diagnostic-only; if all temporary edits are removed and no tracked implementation result remains, no branch handoff gate is required.

After a later production correction, the normal final gate remains:

`pnpm verify --base origin/develop`

Do not increase timeout or accept retry/flaky classification.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to later PRs and are not #217 merge blockers.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge only when:

1. relation-table initial readiness is deterministic and its owning E2E passes without flaky/retry classification;
2. operator inspection confirms Database border/corner/sticky presentation, including combined vertical + horizontal sticky behavior;
3. coding-agent `pnpm verify --base origin/develop` passes cleanly after the eventual readiness correction;
4. exact-head GitHub CI is green without retry/flaky classification;
5. final resulting-PR review finds no blocker.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- increasing E2E timeout, `test.slow()`, sleeps, or retry recovery;
- weakening the relation-view E2E helper;
- duplicate preload/query paths;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.
