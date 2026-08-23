# Database virtualization

Status: **architecture accepted; production virtualization/profiling complete; final semantic correction ready and required before merge**.

This is the architecture source of truth for large Database rendering in PR #217. Final correction contract: `docs/database-virtualization-final-correction-handoff.md` and `docs/database-virtualization-final-correction-preflight.md`. Shared API: `src/shared/ui/virtualization/README.md`. Raw product measurements: `docs/database-virtualization-production-results.md`.

## Goal

Scale Database rendering to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, while preserving exact filter/sort/view behavior, editing, relations, native table semantics, and mobile/desktop usability.

Primary invariant:

> For fixed viewport and overscan, mounted expensive rows, properties, and cells are bounded independently of total logical dataset size.

## Accepted architecture

- `@tanstack/vue-virtual` is the only virtual-item geometry/range/cache engine.
- `useVirtualCollection` is the only Mioframe virtualization boundary and its public API remains unchanged.
- Production Database uses one row collection and one property collection over the existing complete canonical sources.
- Native `<table>` flow remains the renderer; only mounted row × mounted property intersections instantiate expensive cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- No UI-side source reconstruction, paging protocol, worker redesign, generic virtual grid/table, second geometry system, pinning, or independent size maps are introduced.

## Ownership

| Owner                       | Responsibility                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/virtualization`  | Generic one-axis collection virtualization and `vItem` measurement binding.                                                                                                                       |
| `entities/databaseData`     | Native table DOM, row/property virtual collections, spacers, column sizing, logical accessibility, sticky action cells, and geometry from an explicit physical root to **its own table surface**. |
| `entities/databaseValue`    | Narrow value read/write contracts used by inline editing.                                                                                                                                         |
| Database widget/composition | Chooses physical roots, composes table/toolbar/relation surfaces, owns one inline-edit lifecycle, and gates user configuration that can replace table source/shape.                               |
| relation entity UI          | Domain/display behavior only; no Database virtualization DOM-root API.                                                                                                                            |
| service/worker              | Canonical data/filter/sort/order.                                                                                                                                                                 |
| `shared/ui/Table`           | Presentation only.                                                                                                                                                                                |

## Source of truth

- rows/order/filter/sort: existing `filteredIdList` exposed through `useDatabaseData`;
- properties/order: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection`;
- values: existing Database value entity/service contracts;
- top-level physical root: `.database-view`;
- relation editor root: `.relation-value-field__data`;
- inline/recursive relation preview root: a Database-widget-owned local overflow element that physically contains the nested layout, including after teleport;
- edit draft: one widget-owned active session;
- active source/shape configuration surface: one widget-owned controlled union state.

## Table rendering

`DatabaseDataTable` owns two independent `useVirtualCollection` consumers and renders:

```text
<table>
  <colgroup> leading spacer | mounted properties | trailing spacer | action </colgroup>
  <thead>     leading spacer | mounted headers    | trailing spacer | action </thead>
  <tbody>     top spacer | mounted logical rows × mounted properties | bottom spacer </tbody>
</table>
```

The action column is outside horizontal property virtualization. Spacer/fill DOM is presentation-only and excluded from logical accessibility semantics.

## Root and surface geometry

A Database table consumer supplies only its real physical `scrollRoot`.

`DatabaseDataTable` owns the collection surface because it owns the rendered table. It derives vertical and horizontal `surfaceOffset` internally from the explicit root plus its own table element.

Requirements:

- truthful non-zero top-level offset when content precedes the table;
- truthful horizontal offset from root padding/table placement;
- independent nested roots;
- layout changes that move the table update the derived offset;
- direct DOM reads and existing narrow VueUse geometry/mutation primitives are allowed only for root-to-own-surface position;
- no virtual-item observer/cache/range/anchor logic outside TanStack;
- no automatic scroll-parent discovery.

`DatabaseViewLayout` and `RelationValueFieldData` do not compute or pass numeric surface offsets.

## Composition

Top level:

```text
.database-view (physical root)
  optional preceding content
  DatabaseViewLayout
    DatabaseDataTable(scrollRoot=.database-view)
    after / toolbar placeholder
```

`after` is composition, never `<tfoot>` data.

Relation editor:

```text
.relation-value-field__data (physical root)
  RelationValueFieldData
    DatabaseDataTable(scrollRoot=.relation-value-field__data)
```

Inline/recursive relation preview:

```text
RelationValueInline (entity display only)
  slot content
    DatabaseRelationValueInline local overflow root
      DatabaseViewLayout(scrollRoot=local root)
```

The local widget root moves with slot content when `MDRichTooltip` teleports recursive preview. `RelationValueInline` does not expose an HTMLElement root.

## Dynamic sizing / sticky UI

Rows and mounted property headers are measured through the shared per-instance `vItem`. TanStack owns measured size and scroll correction.

Production wrapping remains intact; capability-only nowrap styling is forbidden. A mounted property may use public virtual item `size` as remount `min-width`; no parallel width map exists.

Native sticky header behavior remains presentation-owned. The trailing action column stays mounted for each mounted logical row and remains outside property virtualization.

## Inline editing

Virtual eviction requires one lifted active session:

```text
{ itemId, propertyId, initialValue, draft, resolving }
```

Database widget/composition owns it through one local `useDatabaseInlineEditSession` composable. The composable may receive only the narrow `postValue(itemId, propertyId, value)` dependency and owns request/claim, draft update, cancel, serialized resolve/commit, and recoverable failure state.

Invariants:

- Escape cancels without persistence while the session is interactive;
- normal resolve clears only after successful persistence;
- while `resolving`, UI must not expose editable/cancel interaction that the session intentionally rejects;
- failed persistence restores the same exact draft to an interactive editor;
- eviction cannot silently lose a draft;
- remount restores an unresolved draft;
- starting another editor resolves the previous one first;
- direct explicit view change resolves before setting selection;
- no second/local draft, pinning, global registry, provider, or generic edit manager.

## Source/shape-changing user configuration

Database widget composition owns one controlled configuration state:

```ts
DatabaseConfigurationSurface | undefined
```

where the surface is one of `views`, `sort`, `filter`, or `properties`.

`DatabaseToolbar` is controlled by that state. Toolbar actions emit typed request/close intents upward; parent-owned resolve/permission/async-gate functions are not passed down as callback props.

Opening behavior:

1. toolbar emits configuration request;
2. `DatabaseViewWidget` resolves the active inline edit;
3. only after success the parent sets the controlled configuration surface;
4. failed resolution leaves the surface closed and the draft recoverable;
5. toolbar close emits upward and the parent clears the state.

Direct explicit-view resolve-before-set remains as defense in depth. Do not add parallel view/filter/sort/property source state.

## Accessibility

Preserve native table semantics:

- `aria-rowcount` = header + complete logical rows;
- `aria-colcount` = complete logical properties + action column when present;
- row `i` uses `aria-rowindex = i + 2`;
- property `j` uses `aria-colindex = j + 1`;
- action uses trailing logical column index;
- spacer/fill DOM is hidden from logical semantics;
- no `role=list/listitem` override;
- no ARIA-grid keyboard model.

## Proof

Application E2E owns cross-owner product behavior. Final proof must cover:

- bounded mounted rows/properties/cells and deep 2D sentinels;
- real non-zero top-level surface displacement connected to correct virtualized range behavior;
- logical deep-range behavior again after preceding content moves/removes the table surface;
- relation editor physical root;
- normal inline relation preview local physical root;
- recursive teleported preview where that root contains the nested table and a large case reaches deep row/property sentinels;
- edit commit, Escape, vertical eviction, horizontal eviction and direct view switching;
- successful resolve-before-configuration and no current-view-removal bypass;
- resolving-interval and rejected-write recovery through deterministic/component proof;
- toolbar request/controlled-open/close through component-contract proof;
- native accessibility, sticky surfaces, toolbar behavior, and existing desktop/Mobile Chrome applicability.

Use public DOM/user behavior. Product tests must not read Mioframe-private/TanStack measurement markers such as `data-mioframe-virtual-index`.

## Performance

The complete S0/R1/R2/R3/R4/C1/C2/C3/G1 baseline and final S0/G1 correction revalidation are complete. G1 remains bounded and the final three G1 samples observed no Long Tasks.

The remaining semantic correction does not change virtualization/geometry or the measured short-to-full rendering algorithm. Do not rerun performance evidence unless implementation crosses those boundaries or a focused proof reveals a regression.

## Forbidden

- changing `useVirtualCollection`, `MDTable`, overlay/tooltip, or service/worker public APIs for convenience;
- consumer-provided numeric surface-offset props;
- relation entity DOM-root API;
- automatic root discovery;
- generic virtualization/root/edit/configuration manager;
- second edit draft or geometry/range/cache/anchor system;
- independent row/column size maps;
- callback props for parent-owned commands, permission checks, confirmations, or async gates;
- direct widget `shared/service` value persistence;
- parallel canonical source state;
- private virtualizer markers in product proof;
- worker/query/storage optimization without new evidence;
- sleeps, force, retries-as-success, timeout inflation, or tolerance weakening.

## Readiness

Shared/native capability: **accepted**.

Production virtualization and performance evidence: **complete**.

Final semantic correction handoff/preflight: **ready**.

Semantic review: **blocked until final correction implementation and proof are complete**.

Merge readiness: **not yet; correction, full re-review, and exact-head GitHub CI remain required**.
