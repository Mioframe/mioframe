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

### Relevant PR-owned changes

`RelationValueFieldData` currently renders:

- the loading progress indicator while `isLoading && !propertiesIdList`;
- `DatabaseDataTable` only in the `v-else` branch.

`DatabaseDataTable` owns `useDatabaseData()` internally. Therefore the `v-else` correction changes query startup: the row query cannot start until the properties-loading branch releases and the table mounts.

`DatabaseDataTable` also has a transient row bootstrap when logical items exist but TanStack exposes zero mounted virtual rows.

The observed empty relation-row set is compatible with two different mechanisms:

1. delayed table mount delays the row query;
2. logical rows are already available, but the nested relation virtualizer remains in bootstrap/no-mounted-range state.

No production correction is selected until these are distinguished.

### Required discriminator

At the initial default-view checkpoint capture enough observable/temporary diagnostic state to distinguish the two mechanisms:

- relation properties-loading state;
- whether `DatabaseDataTable` is mounted;
- table `aria-rowcount`;
- mounted non-bootstrap row count;
- row-bootstrap presence;
- logical item count already available at the table boundary;
- selected/effective relation view.

If the table/data query has not started because of loading composition, revisit the feature-owned loading composition while preserving truthful zero surface offsets. Do not introduce a duplicate preload query.

If logical items are already present while mounted rows remain absent, investigate the nested relation virtualizer/root/bootstrap lifecycle. Do not respond with timeout inflation, sleeps, retries, forced remounts, cache resets, or `virtualizer.measure()`.

The test helper itself is not the first correction target: it already waits for the observable row-order contract, and a retry-pass is explicitly invalid proof.

## Relation local-root geometry — preserved

The previous `v-else` correction solved a real geometry issue: a normal-flow spinner preceding a mounted table makes fixed vertical surface offset `0` false.

Any readiness correction must keep `0/0` truthful whenever the relation table is visible/participates in layout. Do not restore the old spinner-before-table normal-flow topology.

## Sticky action/header stacking — resolved

`DatabaseDataTable` body action cells use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action cell remains locally elevated.

The existing sticky native-table application E2E performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` correction was required.

## Verification workflow

For the relation-readiness blocker, use focused verifier-managed E2E diagnostics and then the normal cumulative branch gate:

`pnpm verify --base origin/develop`

A branch-gate retry/flaky classification is not accepted. GitHub exact-head CI remains the authoritative automatic merge gate.

Do not increase test timeout or add sleeps/recovery.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to later PRs and are not #217 merge blockers.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge only when:

1. relation-table initial readiness is deterministic and its owning E2E passes without flaky/retry classification;
2. operator inspection confirms Database border/corner/sticky presentation, including combined vertical + horizontal sticky behavior;
3. coding-agent `pnpm verify --base origin/develop` passes cleanly after the readiness correction;
4. exact-head GitHub CI is green without retry/flaky classification;
5. final resulting-PR review finds no blocker.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- changing the relation E2E timeout or helper merely to wait longer;
- sleeps or retry/recovery loops;
- restoring a normal-flow spinner before a visible relation table while keeping fixed `verticalSurfaceOffset=0`;
- duplicate feature-level data preloading solely to start the table query earlier;
- speculative shared virtualization/TanStack changes before the discriminator;
- unconditional `virtualizer.measure()` or cache reset;
- exposed TanStack virtualizer instances;
- second geometry/range/measurement state;
- restoring entity-owned ancestor/sibling geometry discovery;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.
