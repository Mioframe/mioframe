# Database virtualization

Status: **PR #217 virtualization implementation, proportional browser/product proof, relation selected-view proof, and operator visual inspection are accepted. The remaining automatic merge gate is exact-head GitHub CI on the final repository head.**

This is the architecture source of truth for PR #217. Temporary implementation handoff, preflight, diagnostic, and stage-result artifacts are intentionally not retained after closure. Retained measurement evidence and deferred performance scope are documented separately.

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

Those performance investigations are owned by `docs/database-chrome-jank-follow-up.md` and are not #217 merge criteria.

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

## Shared deep-state `surfaceOffset` contract — accepted

Reusable browser capability proves:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`

on the same root/list. Both deep phases reach the logical tail, top recovery reaches item `0`, mounted work remains bounded, and public/physical geometry remains consistent.

`useVirtualCollection.ts` remains unchanged. No shared/TanStack production correction, `virtualizer.measure()`, cache-reset protocol, or virtualizer exposure is justified.

## Top-level numeric diagnosis — accepted

Widget-supplied surface offsets matched current DOM-derived root-to-`DatabaseViewLayout` offsets at every diagnosed checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46`. No production geometry/cache/lifecycle correction is justified by current evidence.

## Moving-surface product proof — accepted

The proportional moving-surface E2E uses a compact deterministic viewport and 16 additional real rows while preserving the real success-card lifecycle, bounded mounted ranges, physical surface movement, and both logical-tail checks.

The corrected scenario passes on desktop Chromium and Mobile Chrome without requiring shared virtualization changes.

## Relation selected-view proof — resolved

The historical Chromium flake in `uses default relation view inline and switches to a selected relation view` was investigated rather than treated as a production defect by assumption.

The captured failed-attempt snapshot showed a healthy product state immediately after the custom sampled assertion failed:

- no loading indicator;
- one Database table;
- `aria-rowcount=3`;
- no row bootstrap;
- two mounted real rows containing the expected alpha/beta values;
- the default relation view selected.

The failure was therefore owned by the E2E proof boundary, not by relation persistence, query state, `DatabaseDataTable`, or shared virtualization. The scenario now uses Playwright web-first locator-list assertions on real relation rows:

- default view: `toContainText([alphaValue, betaValue])`;
- selected descending view: `toContainText([betaValue, alphaValue])`.

The temporary relation-readiness diagnostic was removed. Focused E2E and the coding-agent cumulative `pnpm verify --base origin/develop` gate both passed with no retry/flaky classification after the correction.

Earlier relation-readiness diagnostic passes are historical evidence only and are not active contracts.

## Relation local-root geometry — preserved

The earlier `v-else` correction solved a real geometry issue: a normal-flow spinner preceding a mounted table makes fixed vertical surface offset `0` false.

The accepted topology keeps `0/0` truthful whenever the relation table is visible and participates in layout. Do not restore the old spinner-before-table normal-flow topology.

## Sticky action/header stacking — accepted

`DatabaseDataTable` body action cells use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action intersection remains locally elevated.

The sticky native-table application E2E performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No additional shared `MDTable` correction is required.

## Verification state

Accepted coding-agent evidence after the final relation proof correction:

- focused application E2E for `tests/e2e/databaseViewsAndQueryFlows.spec.ts`: passed without retry/flaky classification;
- cumulative branch gate `pnpm verify --base origin/develop`: passed;
- applicable static checks: no blocking errors.

Operator visual inspection of the Database border/corner/sticky presentation is accepted.

Exact-head GitHub CI on the final repository head remains the authoritative automatic merge gate.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to a later PR and are not #217 merge blockers.

Retained evidence and the first discriminator for that work are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge when:

1. exact-head GitHub CI on the final head is green without retry/flaky classification;
2. the final merge decision confirms no new blocker was introduced after the documentation-only closing pass.

No additional production, relation-readiness, visual-reinspection, or performance-attribution correction is required for #217 unless new repository evidence contradicts the accepted state above.

## Forbidden before merge

- expanding #217 into the deferred heterogeneous-content performance investigation;
- increasing E2E timeout, `test.slow()`, sleeps, or retry recovery to mask instability;
- replacing the accepted relation-view web-first proof with sampled polling without new evidence;
- changing expected relation row values/order;
- duplicate preload/query paths;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization requirements.
