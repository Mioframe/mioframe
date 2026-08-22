# Database virtualization collection API result

Status: **not ready; architecture accepted, capability proof requires one correction round**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

## Accepted implementation state

The current implementation boundary remains accepted:

- `useVirtualCollection` is the only shared virtualization API;
- public surface is limited to `items`, `totalSize`, `leadingSize`, `trailingSize`, and per-instance `measure` directive;
- consumers do not import TanStack or bind its measurement API;
- no independent observer, measured-size cache, range engine, or grid coordinator exists;
- database capability uses the shared API and actual `MDTable`;
- dedicated fixed-size wrapper is the database capability's one physical scroll root;
- phantom min-content horizontal spacer normalization remains an accepted native-table integration detail;
- Firefox remains narrowly scoped to the database capability spec.

## Previously executed proof

The previous run reported:

- Chromium shared: 8/8 passed;
- Chromium database: 8/8 passed;
- Firefox database: 8/8 passed;
- total: 24/24 passed.

Those passing counts are retained only as historical execution evidence. They do **not** establish readiness because several assertions did not prove the claimed public contract.

## Review findings requiring correction

| Contract | Current status | Reason |
| --- | --- | --- |
| Shared bounded mounted item count | PASS | Observable mounted-DOM bound is valid. |
| Shared visible `{index,key,value}` mapping | PASS | Public values are directly asserted. |
| Directive adds no wrapper / hides TanStack markup | PASS | Consumer DOM proves the boundary. |
| Shared dynamic grow/shrink virtual geometry | **NOT PROVEN** | Tests assert physical DOM size only; stale virtual measurement could still pass. |
| Shared stable-key remap + second resize | **NOT PROVEN** | Final assertion is physical height, not public geometry at the new index. |
| Non-zero `surfaceOffset` | **NOT PROVEN** | Public collection-relative offset/extents are not exercised with a real non-zero surface offset. |
| Deep `leadingSize` | PASS | Materially large leading extent is asserted. |
| Deep `trailingSize` | **NOT PROVEN** | No corresponding trailing-extent assertion. |
| Generic source value may be `undefined` | **FAIL IMPLEMENTATION CONTRACT** | `readValue()` currently treats `undefined` as an out-of-range value. |
| Actual `MDTable` / native semantics | PASS | Real component and native roles/counts are used. |
| Database row grow/shrink virtual geometry | **NOT PROVEN** | `<tr>` bounding-box change does not prove row collection `size` updated. |
| Database body-driven column virtual geometry | **NOT PROVEN** | `<th>` width changes, but public column `size` is not asserted. |
| Deep vertical/horizontal offsets | PASS | Deep logical targets and material spacer extents are asserted. |
| Header/body visible property range agreement | PASS | Same logical range is asserted. |
| Column remount minimum | **NOT PROVEN** | Widened body content remains active on remount, so native table layout can satisfy the width without cached public `size`. |
| Bounded mounted rows/columns | PASS | Explicit row/column bounds exist. |
| Bounded mounted data cells | **NOT PROVEN** | Data cells are not counted explicitly. |
| Above-viewport row-resize anchor stability | **NOT PROVEN** | Required browser-proof scenario is absent. |
| Firefox real-`MDTable` measurement | **PARTIAL** | DOM grow/shrink passes, but corrected public virtual-size proof has not run yet. |

## Root-ownership finding

Using `MDTable` itself as the scroll root is not viable with the native-table phantom spacer under `table-layout: auto`: the table's min-content width expands instead of producing a stable internal viewport.

The accepted capability topology is therefore:

```text
fixed-size overflow wrapper  ← physical scroll root
          ↓
       MDTable
          ↓
 native virtual spacer/table content
```

This does not add a second scroll owner and is compatible with the production architecture where `.database-view` is expected to own the physical viewport.

## Required correction evidence

Before changing this document back to `ready`, the final proof must demonstrate:

- shared grow/shrink through public virtual geometry, not DOM size alone;
- stable-key remap followed by another resize updates public geometry at the new index;
- non-zero `surfaceOffset` with collection-relative `offset`, `leadingSize`, `trailingSize`, and `totalSize`;
- correct valid `undefined` source-value handling;
- database row/column physical changes accompanied by public virtual `size` changes in Chromium and Firefox;
- column remount minimum after widening body content is removed while the property is unmounted;
- explicit bounded mounted data-cell count at 5,000 × 300 logical scale, including deep range;
- acceptable visible-anchor stability after resizing a measured row above the viewport.

Exact final browser test counts must be replaced with the counts from that corrected verifier run.

## Architecture boundary

No architecture redesign is requested by this review. Keep:

- the existing public API unchanged;
- TanStack as the sole geometry/observer/cache owner;
- database-specific table layout outside shared virtualization;
- no generic grid/rendering abstraction;
- no TanStack private state exposed to tests.

## Verdict

**Not ready.** Production database migration preflight remains blocked until the correction requirements above pass and this result document is rewritten from the corrected evidence.
