# Database virtualization browser proof

Status: **shared-API + native-table capability gate passed; production database migration may begin planning**.

The browser gate proves the selected `useVirtualCollection` boundary plus Mioframe-owned native-table integration risks. Passing DOM layout assertions alone is not sufficient when the contract being claimed is virtual measurement geometry.

## Proof split

Two proof owners exist:

1. shared collection API proof — verifies the public headless collection/measurement contract without table-specific assumptions;
2. database native-table proof — verifies the same public API on `<tr>`/`<th>` with real `MDTable` geometry.

Do not duplicate TanStack's full generic virtualization suite.

## Shared collection API proof

Use one deterministic Storybook fixture under `src/shared/ui/virtualization`.

Requirements:

- use the real production `useVirtualCollection` implementation;
- ordinary consumer-owned markup such as `<ul>/<li>` or `<div>`;
- no generic grid fixture;
- no product services/state;
- at least 10,000 logical items for bounded-DOM proof.

Prove:

- mounted items remain bounded by viewport/overscan;
- returned items expose correct current `{ index, key, value, offset, size }` mapping;
- returned measurement directive adds no wrapper DOM and consumer markup does not bind TanStack attributes/methods;
- a mounted item can grow and shrink and **public virtual geometry** updates both ways;
- after stable-key reorder/index remapping, resizing the remapped item updates public geometry for the current item/index rather than the former index;
- non-zero `surfaceOffset` keeps public `offset`, `leadingSize`, `trailingSize`, and `totalSize` collection-relative;
- deep scroll produces materially large `leadingSize`, correct `trailingSize`, and correct visible logical positions;
- valid source values may include `undefined` when the index is in bounds;
- unmount/remount has no observable stale measurement behavior.

Physical `boundingBox()` changes may be supporting evidence, but they must not be the sole evidence for a measurement-cache/virtual-geometry claim.

Chromium is sufficient for this generic shared proof. Firefox is added only where a shared-specific incompatibility is actually observed; current confirmed Firefox risk is native table measurement, not generic list measurement.

## Database native-table fixture

Use one deterministic Storybook fixture under `src/entities/databaseData`.

Requirements:

- consume `useVirtualCollection` only; no direct `@tanstack/vue-virtual` import;
- use actual `MDTable`, not copied approximation CSS;
- synthetic row/property data only;
- no worker, service, persistence, routing, editor, relation, or toolbar product behavior;
- at least 5,000 rows × 300 properties;
- one physical scroll root for this capability fixture.

A dedicated fixed-size wrapper may be the physical scroll root. `MDTable` itself need not own scrolling when native table min-content behavior prevents it from being a stable viewport.

Use one vertical row collection and one horizontal property collection. Apply their returned directives directly to real `<tr>` and `<th>` measurement owners.

## Required browser matrix

- Chromium: shared collection API proof + complete database native-table proof.
- Firefox: database native-table capability spec only, because dynamic table row/column measurement is the confirmed engine-specific risk.

Keep the Firefox Playwright project narrowly matched to `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`.

Performance wall-clock comparison remains Chromium-controlled and belongs to later profiling.

## Database contracts

### Structural bounded rendering

For fixed viewport/overscan:

- mounted data rows remain bounded while logical rows are in the thousands;
- mounted property headers remain bounded while logical columns are in the hundreds;
- **actual mounted logical data-cell DOM is counted directly from the rendered `<td>` set**, excluding spacer cells;
- the actual logical-cell DOM count equals the settled current row-range × column-range intersection count;
- the actual logical-cell DOM count remains bounded initially and after deep 2D scrolling;
- no logical rows × columns cross product is materialized.

A fixture output computed as `rows.items.length * columns.items.length` may be diagnostic, but it is not proof of mounted-cell DOM and must not be used as the primary bounded-cell assertion.

### Vertical geometry

Prove:

- top/bottom spacer rows use `leadingSize`/`trailingSize` and preserve total virtual extent;
- deep scroll reaches rows near the end without mounting predecessors;
- dynamic mounted row growth updates both physical `<tr>` geometry and public row virtual geometry;
- the same row can shrink again and both physical/public geometry update;
- resizing a measured row above the viewport updates geometry while preserving a visible anchor within a bounded tolerance smaller than one representative row height;
- behavior works with real `MDTable` border/layout model in Chromium and Firefox.

Fixed-height Firefox fallback is not acceptable.

### Horizontal geometry

Prove:

- left/right spacer columns use `leadingSize`/`trailingSize` and preserve horizontal extent;
- deep horizontal scroll reaches a property near the end of at least 300 logical properties;
- visible header/body use the same property collection items;
- mounted body content can widen its corresponding `<th>` through native table layout;
- the corresponding public column item `size` increases after that widening;
- after the widened property is evicted, the widening body condition is removed before remount, and the previously discovered public `size` still preserves the remount `min-width` within tolerance;
- spacer-column phantom min-content technique, if still needed, produces correct deep offset in both engines.

Live shrink of a previously discovered column width is intentionally **not** a capability requirement. Width may remain grow-only for the current table lifetime; a full remount may rediscover it.

### Accessibility

With partial DOM prove:

- native table semantics remain exposed;
- table logical row/column counts are complete;
- visible logical row/column indices match full-data positions, including after deep scrolling;
- virtual spacers are absent from logical accessibility semantics;
- ARIA grid conversion is unnecessary.

## Evidence quality rule

Every claimed contract must be asserted through the lowest public observable that actually owns the behavior.

Examples:

- DOM height proves DOM height, not virtual measurement state;
- public `VirtualCollectionItem.size`/`offset` and public extents prove shared virtual geometry;
- direct count of rendered logical `<td>` elements proves bounded mounted-cell DOM;
- a derived row-range × column-range product does **not** prove mounted-cell DOM by itself;
- visible anchor viewport position before/after an above-viewport resize proves scroll-correction behavior.

Do not inspect TanStack private caches or instances to make capability proof pass.

## Shared API failure threshold

The shared abstraction is blocked if making it work requires any of:

- a second item/element registry;
- independent `ResizeObserver` or measured-size cache;
- arbitrary TanStack option passthrough;
- generic rendering components;
- consumer-specific database/table knowledge;
- a broader API than the contract in `docs/virtualization-library.md`.

If direct TanStack would become simpler than the shared public contract after required behavior is implemented, stop and report the concrete cause instead of growing the abstraction.

## Native-table failure threshold

Native table flow is blocked only if a required table contract cannot be made reliable in Chromium/Firefox without substantial custom geometry machinery.

A narrow CSS/native-table normalization such as a spacer phantom box is acceptable. A second offset algorithm, per-cell measurement cache, independent ResizeObserver, or manual range engine is not.

If native flow is blocked, stop and return evidence for architecture review. Do not implement the fallback rendering model in the same task.

## Deferred to production migration

Do not clone these into capability fixtures:

- actual `.database-view` product surface-offset wiring beyond the shared generic non-zero offset proof;
- sticky action-column product behavior;
- active edit eviction/view-switch handling;
- nested relation roots;
- toolbar/after relocation;
- real filter/sort/view-switch scenarios;
- desktop/mobile product composition;
- wall-clock performance targets.

## Evidence result

Record the outcome in `docs/database-virtualization-collection-api-result.md`:

- resolved TanStack/Playwright/browser versions;
- exact shared API and database proof counts/outcomes;
- pass/fail for each required public-geometry contract;
- direct actual mounted-cell DOM evidence at initial and deep 2D ranges;
- anchor-stability evidence;
- any narrow native-table normalization retained;
- whether the minimal shared API remained within its architecture boundary;
- whether native-table-first remains accepted;
- unresolved blockers.

## Exit criterion

Production migration preflight may start only when:

- shared `useVirtualCollection` proof passes using public geometry, without a second geometry/lifecycle system;
- non-zero `surfaceOffset`, leading/trailing geometry, and source-value semantics pass;
- database native-table proof passes in Chromium;
- Firefox dynamic row/column measurement passes with real `MDTable` geometry and public virtual size assertions;
- deep vertical and deep horizontal offsets are both proven;
- row grow/shrink and above-viewport anchor correction work;
- column remount minimum is proven after widening content is removed;
- **actual rendered logical data-cell DOM**, plus row/column DOM, is directly proven bounded;
- logical accessibility semantics pass.
