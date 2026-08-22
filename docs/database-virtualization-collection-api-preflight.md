# Database virtualization collection API capability preflight

Status: **completed**.

This document records the completed implementation preflight for the shared virtualization capability. The final evidence and verdict are in `docs/database-virtualization-collection-api-result.md`.

## Scope that was implemented

The completed capability work covered:

- the minimal shared `useVirtualCollection` public API;
- per-instance measurement directive on consumer-owned elements;
- ordinary-element shared browser proof;
- database native-table proof using actual `MDTable`;
- one vertical row collection and one horizontal property collection;
- deterministic deep 2D geometry;
- dynamic row and column measurement;
- stable-key remap behavior;
- non-zero `surfaceOffset`;
- valid in-bounds `undefined` source values;
- column remount width retention through public `size`;
- above-viewport resize anchor stability;
- native table accessibility semantics;
- direct counting of actual mounted logical data-cell `<td>` DOM at initial and deep 2D ranges.

## Verified final state

The final capability browser corpus reported:

- Chromium shared capability: 10 passed;
- Chromium database capability: 10 passed;
- Firefox database capability: 10 passed;
- total: 30/30 passed in the final clean run, with no accepted flaky/retry outcome.

The bounded-cell contract is proven from actual DOM via `[data-testid^="db-virt-cell-"]`, not from a derived row-range × column-range diagnostic. The obsolete derived mounted-cell output was removed from the fixture.

No capability proof item remains pending.

## Architecture constraints preserved

- no public `useVirtualCollection` expansion beyond the accepted contract;
- no direct TanStack API exposure to consumers;
- no independent `ResizeObserver`, measured-size cache, element registry, range engine, or scroll-anchor algorithm;
- no generic `VirtualList`, `VirtualTable`, `VirtualGrid`, or two-axis coordinator;
- no production database rendering changes in the capability stage;
- no worker/query/paging/index changes.

## Stage transition

Capability preflight: **satisfied**.
Capability result: **Ready**.

Production database migration is a new stage and is not covered by this preflight. Its implementation must start from the current production code, `docs/database-virtualization.md`, `docs/database-virtualization-profiling.md`, and `docs/database-virtualization-collection-api-result.md`, with a new migration-specific architecture/preflight before code edits.
