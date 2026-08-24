# Database virtualization dynamic surface-offset correction handoff

## Goal

Make a Database virtual collection remain correct when its table surface moves inside an unchanged physical scroll root, including after preceding widget content is removed.

## Confirmed behavior and evidence

- Exact-head CI on `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da` fails `keeps real preceding Database content connected to the table-owned surface range` on desktop Chromium on the initial attempt and both retries; Mobile Chrome passes.
- The physical table offset is proven to move after the success card is dismissed, but the second top -> deep transition does not reach the final logical row.
- `useVirtualCollection.surfaceOffset` is a reactive `MaybeRefOrGetter<number>` and shared ownership includes reactive surface-offset forwarding.
- TanStack Virtual core includes `scrollMargin` in measurement-layout dependencies. A changed margin rebuilds item starts from `paddingStart + scrollMargin` while preserving measured item sizes. Vue's adapter watches option changes and calls `setOptions()` / `_willUpdate()`.
- Therefore an unconditional `virtualizer.measure()`/cache reset is not justified by the engine contract.

## Non-goals

- no new range/measurement/cache engine;
- no retry, timeout, remount, forced update, scroll polling, or per-frame geometry reads;
- no MDTable/frame changes in this correction;
- no residual heterogeneous-content Chromium performance work;
- no filter/query/storage/inline-edit changes.

## Affected scenarios

1. Top-level Database with real preceding success-card content: top -> deep, dismiss card, top -> deep again.
2. Ordinary top-level Database without preceding content.
3. Nested relation Database whose scroll root owns no preceding content.
4. Existing vertical/horizontal deep ranges, dynamic row sizing, sticky surfaces, bootstrap and spacer boundaries.

## Boundaries and ownership

- **widget** owns the physical scroll root and composition that can place content before the Database surface; it owns the current root-to-surface layout fact.
- **entity / `DatabaseDataTable`** consumes explicit surface geometry and owns table virtualization presentation; it must not observe sibling/widget topology through an ancestor `MutationObserver`.
- **shared virtualization** owns reactive forwarding of the supplied `surfaceOffset` to TanStack and surface-relative public geometry. Its public API remains unchanged.
- **TanStack** remains the sole owner of range, item measurements, measurement cache, scroll-margin layout math, and scroll correction.
- feature/page/service/worker: unchanged.

## Source of truth and state shape

The canonical physical fact is the scroll-root owner's current root-to-Database-surface offset on each axis.

No persistent duplicate geometry state or cache is introduced. The widget may retain only the reactive current offset values needed to pass that layout fact down to the entity.

## Public entry points

- `useVirtualCollection(..., { surfaceOffset })`: unchanged.
- `DatabaseDataTable`: receives explicit vertical/horizontal surface offsets from its widget composition path instead of discovering ancestor sibling layout itself.
- `DatabaseViewLayout`: forwards those presentation offsets to `DatabaseDataTable`.

These are internal FSD presentation contracts, not a new shared public abstraction.

## Minimum sufficient design

1. First extend the shared virtualization browser capability proof so a mounted collection changes a reactive non-zero `surfaceOffset` without replacing its root, then returns top/deep correctly. This proves the existing shared contract rather than guessing from Database behavior.
2. Keep `useVirtualCollection` unchanged if that proof passes. Do not call `measure()` merely because `surfaceOffset` changed.
3. Move dynamic root-to-surface measurement to the owner of the root/composition:
   - top-level `DatabaseViewWidget` measures its own `.database-view` root against the rendered `DatabaseViewLayout` surface and updates that fact from its own post-render lifecycle when preceding composition changes;
   - window/root-size changes may use existing bounding observation, but no continuous scroll-time measurement is allowed;
   - relation inline owns a root whose Database layout begins at that root origin, so it supplies the truthful zero offset unless current DOM evidence disproves that fact.
4. `DatabaseViewLayout` forwards the two offsets; `DatabaseDataTable` removes `useElementBounding`, ancestor `MutationObserver`, and `onUpdated` surface-discovery logic.
5. The entity passes the supplied values directly to its row/column `useVirtualCollection` instances.

### Simpler alternative considered

Keeping the current entity observer and adding another timing callback is fewer edited files but preserves the wrong ownership and the already-unreliable ancestor/sibling observation path. It is rejected after repeated CI recurrence.

## Rejected approaches

- `virtualizer.measure()` on every margin change: TanStack already rebuilds starts from `scrollMargin`; clearing measured sizes is broader than required.
- root-scroll listener / requestAnimationFrame geometry measurement: adds forced layout to the performance-critical scroll path.
- broader MutationObserver/subtree/attribute observation: couples the entity to unrelated widget/table mutations and can create unbounded work.
- success-card-specific logic in `DatabaseDataTable` or shared virtualization.
- a second surface/range cache or manual virtual-range correction.

## Shared UI blast radius

`useVirtualCollection` API is unchanged. Add only the missing dynamic-surface capability proof. Database is the production consumer affected by the ownership correction.

## Acceptance matrix

- Shared capability: changing a reactive `surfaceOffset` on the same root preserves top/deep range and surface-relative extents.
- Top-level Database: both deep transitions reach `aria-rowcount`; preceding content movement remains physically proven.
- Relation Database: existing independent/nested ranges remain correct.
- No scroll-time bounding-box reads or new observer/cache/range owner.
- Existing zero-distance spacer omission, transient bootstrap, bounded DOM, deep rows/columns, dynamic sizing, sticky header/action and inline edit remain green.

## Risk matrix

- Desktop Chromium composition movement: primary blocker, product E2E required.
- Mobile Chrome/nested relations: regression proof required.
- Shared virtualization: browser capability proof required because its documented reactive surface-offset contract is exercised dynamically for the first time.
- Performance: do not introduce per-scroll geometry measurement.

## Required test proof

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`: dynamic same-root `surfaceOffset` change.
- `tests/e2e/databaseVirtualizationFlows.spec.ts`: unchanged/strengthened moving-surface product scenario plus existing virtualization suite.
- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`: rerun persisted relation-filter scenario if Database table production code changes.
- type-check and applicable focused checks.

## Required verification

During implementation use focused verifier runs. Final coding handoff requires:

`pnpm verify --base origin/develop`

If that gate finds another PR-caused in-contract failure, fix narrowly, focused-verify it, then rerun the full branch gate until clean.

## Forbidden

- `virtualizer.measure()` or cache reset without a failing shared capability proof that specifically establishes it is required;
- exposing the TanStack virtualizer publicly;
- second range/geometry/measurement state;
- per-scroll/rAF bounding measurement;
- broad/subtree mutation observation of the virtualized table;
- Database-specific shared virtualization behavior;
- retries/sleeps/timeout inflation/remount/force update;
- unrelated MDTable, performance, worker/query/storage changes.

## Implementation readiness

- Product behavior: resolved.
- Ownership: resolved — scroll-root composition owner supplies surface offset; entity consumes; shared forwards; TanStack computes.
- Public contract: resolved, no shared API expansion.
- Proof ownership: resolved.
- Unresolved blockers: none before implementation; if the new shared dynamic-surface capability proof fails, stop after capturing evidence because the selected consumer-only production correction is invalidated.
- Verdict: **ready**.
