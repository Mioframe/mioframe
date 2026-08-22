# Database virtualization browser proof

Status: **shared API + native-table capability gate passed deterministically; production database migration may begin architecture/preflight**.

This document owns the browser capability contract for the selected `useVirtualCollection` boundary and the Mioframe-owned native-table integration risks.

## Proof split

Two proof owners exist:

1. `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts` — generic one-axis shared collection contract;
2. `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` — database native-table composition using the same public API.

Do not duplicate TanStack's generic suite or inspect its private state.

## Shared collection API proof

The shared proof uses the real `useVirtualCollection` implementation with consumer-owned DOM and no product services/state.

It proves:

- mounted items remain bounded with 10,000+ logical items;
- visible `{ index, key, value, offset, size }` maps to current source truth;
- `vItem` adds no wrapper DOM and consumers do not bind TanStack attributes/methods;
- dynamic vertical grow/shrink updates public virtual geometry;
- horizontal growth updates public virtual geometry;
- stable-key reorder/index remap preserves measurement ownership;
- non-zero `surfaceOffset` keeps public geometry collection-relative;
- deep scroll produces correct leading/trailing/total extents and logical identity;
- a valid in-bounds source value may be `undefined`;
- unmount/remount has no observable stale measurement behavior.

Chromium owns this generic proof. Firefox is required only where the database/native-table risk is engine-specific.

### Deterministic `surfaceOffset` evidence

The previously intermittent deep non-zero-`surfaceOffset` scenario no longer compares separate live browser reads.

It now reads, in one synchronous browser-side snapshot:

- `leadingSize`;
- `totalSize`;
- `trailingSize`;
- current tail item identity;
- tail public `offset` and `size`;
- viewport `scrollHeight`.

The snapshot is accepted only when the complete trailing-extent and physical-scroll-height invariants hold with the existing tolerances and the observable state remains stable across consecutive observations.

No tolerance widening, sleep, fixed-frame wait, timeout inflation, retry acceptance, or private engine observation is used.

## Database native-table fixture

The database capability fixture:

- consumes only `useVirtualCollection`;
- uses actual `MDTable`;
- uses synthetic data only;
- has at least 5,000 rows × 300 properties;
- has one dedicated fixed-size overflow wrapper as its physical 2D scroll root;
- composes one vertical row collection and one horizontal property collection;
- applies `vItem` through consumer-local row/column directive aliases to real `<tr>` and `<th>` measurement owners.

`MDTable` itself is not required to be the physical scroll root; native table min-content behavior made that topology unsuitable for the capability viewport.

## Required browser matrix

- Chromium: shared collection API proof + complete database native-table proof.
- Firefox: database native-table capability spec only.

The narrow Firefox project exists because dynamic native table row/column measurement is the confirmed engine-specific risk.

## Database contracts

### Structural bounded rendering

For fixed viewport/overscan:

- mounted logical rows remain bounded while logical rows are in the thousands;
- mounted property headers remain bounded while logical columns are in the hundreds;
- actual mounted logical data-cell DOM is counted directly from rendered `<td>` elements;
- actual mounted logical-cell DOM equals the settled current row-range × column-range intersection;
- the invariant holds initially and after deep 2D scroll;
- no logical rows × columns cross product is materialized.

A derived `rows.items.length * columns.items.length` value is not accepted as mounted-DOM proof.

### Vertical geometry

The proof covers:

- top/bottom spacer extents;
- deep vertical reach without mounting predecessors;
- real `<tr>` growth and shrink with matching public row size;
- above-viewport row resize with visible-anchor preservation;
- actual `MDTable` geometry in Chromium and Firefox.

### Deterministic anchor evidence

The previously intermittent above-viewport anchor scenario now establishes a settled baseline from one browser-side snapshot containing actual scroll position, mounted row identities/rectangles, an above-viewport overscan row, and a middle overlapping visible anchor.

The baseline requires stable actual `scrollTop`, selected identities, and anchor position across consecutive observations.

The proof intentionally does **not** require actual settled `scrollTop` to equal the raw requested pixel value. TanStack may legitimately correct the scroll position after real row heights replace estimates.

After growing the above-viewport row, the test waits for:

- material growth of the same row's public `data-row-size`;
- the original anchor remaining mounted;
- stable post-resize anchor geometry across consecutive observations.

Only then is final anchor displacement compared with the existing one-row-height tolerance.

### Horizontal geometry

The proof covers:

- left/right virtual extents;
- deep horizontal reach near the end of 300 properties;
- identical visible property range in header/body;
- body-driven native table column growth reflected in public column size;
- remount at previously discovered public minimum after the widening body condition is removed;
- the narrow phantom min-content spacer normalization required by native auto table layout.

Live shrink of a previously discovered column width is intentionally not a capability contract. A full table/presentation remount may rediscover geometry.

### Accessibility

With partial DOM, the proof confirms:

- native table semantics remain exposed;
- complete logical row/column counts are published;
- visible logical indices match full-data positions;
- virtual spacers are absent from logical accessibility semantics;
- no ARIA grid conversion is required.

## Evidence quality

Claims are proved through the lowest public observable that owns them:

- DOM dimensions prove physical geometry;
- public `VirtualCollectionItem.size`/`offset` and extents prove shared virtual geometry;
- direct rendered `<td>` count proves mounted cell DOM;
- visible anchor position before/after above-viewport resize proves scroll-correction behavior.

Known flaky behavior is failed proof. Retry-pass is never accepted as green evidence.

## Stability result

The risk-specific diagnostic ran both owner specs with `--repeat 10`.

Reported result: **300/300 executions passed with no retries or flaky classification** across the applicable Chromium and Firefox projects.

The stability correction changed only the two owner browser specs. Runtime code, fixtures, API, browser matrix, timeouts, and semantic tolerances were unchanged.

## Failure thresholds

Reconsider the shared abstraction if required behavior would need a second item/element registry, observer/cache/range engine, arbitrary TanStack passthrough, generic rendering components, or database knowledge.

Reconsider native table flow only if a required table contract cannot be reliable in supported engines without substantial custom geometry machinery. Narrow native-table normalization remains acceptable; a second geometry engine does not.

## Deferred to production migration

Capability fixtures intentionally do not cover:

- real `.database-view` surface-offset wiring;
- sticky product header/action-column behavior;
- active edit eviction/view-switch handling;
- nested relation roots;
- toolbar/`after` relocation;
- real filter/sort/view switching;
- mobile/desktop product composition;
- wall-clock product performance targets.

## Exit criterion

The capability exit criterion is satisfied:

- shared public-geometry proof passes deterministically;
- non-zero `surfaceOffset` proof passes deterministically;
- database native-table proof passes in Chromium and Firefox as required;
- deep vertical/horizontal geometry passes;
- row grow/shrink and above-viewport anchor correction pass deterministically;
- column remount minimum passes;
- actual rendered logical cell DOM is directly bounded;
- logical accessibility semantics pass;
- no required capability browser contract is known intermittent.

Production database migration is now the next separate stage.