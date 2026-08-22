# Database virtualization collection API handoff

Status: **ready**.

## Goal

Replace the over-generalized `useVirtualAxis` wrapper with one minimal shared `useVirtualCollection` API that hides TanStack collection/measurement plumbing without owning rendering, then prove the database native-table model against that public API before production migration.

## Confirmed evidence

- Database virtualization requires two independent one-axis collections: rows and properties.
- Direct TanStack use is mechanically simple but leaks engine-specific collection mapping, `data-index`, and `measureElement` wiring into consumers.
- The previous `useVirtualAxis` abstraction mirrored TanStack too closely and added unnecessary validation/API concepts.
- Vue directives are the narrowest fit for binding low-level measurement behavior to consumer-owned elements without adding wrapper DOM or constraining markup.
- Current capability work already identified a native-table spacer min-content normalization that may remain useful.
- Existing database production rendering remains unchanged and is still out of scope for this capability task.

## Non-goals

- no production `DatabaseDataTable` migration;
- no generic list/table/grid rendering component;
- no functional/renderless component that clones consumer VNodes;
- no worker/query/subscription/paging/index changes;
- no product editor/relation/toolbar fixture;
- no fallback DOM architecture implementation if native table fails.

## Ownership

| Layer | Capability-task ownership |
| --- | --- |
| shared | `src/shared/ui/virtualization` owns `useVirtualCollection` and its per-instance measurement directive. |
| entity | `databaseData` owns native-table composition and table-specific capability proof using the shared API. |
| widget/page | unchanged in this task. |
| service/worker | unchanged. |

## Source of truth

Consumer source collections and stable keys remain logical truth. TanStack owns virtual ranges, measured geometry, element observation, measurement cache, offsets, and scroll correction.

Shared virtualization adds no second geometry state.

## Public API

Implement the conceptual contract from `docs/virtualization-library.md`:

```ts
useVirtualCollection(source, {
  root,
  key,
  estimateSize,
  axis?,
  overscan?,
  surfaceOffset?,
})
```

Result:

```ts
{
  items,
  totalSize,
  leadingSize,
  trailingSize,
  measure,
}
```

Each returned item contains only:

```ts
{
  index,
  key,
  value,
  offset,
  size,
}
```

`measure` is a per-instance Vue directive applied to the consumer's actual measurement owner.

## Minimum sufficient design

- keep `@tanstack/vue-virtual` as the engine dependency;
- replace `useVirtualAxis` with `useVirtualCollection`;
- expose source values directly in returned virtual items;
- expose collection-relative leading/trailing/total geometry;
- hide TanStack `data-index` and `measureElement` wiring inside the returned directive;
- keep one small shared ordinary-element Storybook proof;
- remove the old generic two-axis grid fixture/proof;
- update the database capability fixture to consume only `useVirtualCollection` and use actual `MDTable`;
- keep Firefox scoped only to database native-table capability.

## Simpler alternative comparison

Direct TanStack has fewer shared files but forces every consumer to repeat engine-specific source-index mapping and measurement binding.

The selected shared API is acceptable only because its public vocabulary is smaller than TanStack use and describes the consumer problem rather than the engine.

If implementation requires broad option passthrough, its own registry/observer/cache, or more public concepts than this contract, stop: direct TanStack becomes the simpler architecture.

## Acceptance

- no `useVirtualAxis` remains;
- `useVirtualCollection` public API matches the narrow contract;
- consumers do not bind `data-index` or call `measureElement`;
- directive creates no wrapper DOM and owns no observer/cache/registry;
- shared proof demonstrates bounded rendering, dynamic grow/shrink, stable-key remap, deep leading/trailing geometry, and remount behavior;
- database proof uses actual `MDTable`, at least 5,000 × 300 logical scale, deep vertical and horizontal offsets, row grow/shrink, column grow/remount stability, and logical accessibility;
- Chromium shared+database proof passes;
- Firefox database proof passes without fixed row sizes or second geometry machinery.

## Required result

Create `docs/database-virtualization-collection-api-result.md` with exact dependency/browser versions, actual test counts/outcomes, contract matrix, retained native-table normalization, and final `ready`/`not ready` verdict.

## Forbidden

- arbitrary TanStack option passthrough;
- `VirtualList`, `VirtualTable`, `VirtualGrid`, or two-axis coordinator;
- functional/renderless wrapper component for item measurement;
- root directive/automatic scroll-parent discovery;
- independent ResizeObserver, element registry, measurement cache, offset/range math, or scroll-anchor algorithm;
- hidden full-dataset measurement;
- production database migration;
- sleeps, force, broad retries, or timeout inflation.

## Readiness

Architecture, ownership, public API, proof ownership, and stop conditions are resolved.

Unresolved blockers: **none for capability implementation**.

Verdict: **ready**.
