# Database virtualization simplification correction handoff

Status: **ready**.

This correction supersedes the production root/surface and relation-root ownership described in `docs/database-virtualization.md` and `docs/database-virtualization-production-handoff.md` where they conflict with this document. The shared `useVirtualCollection` API remains unchanged.

## Goal

Remove unnecessary production plumbing introduced by the first virtualization migration while fixing the two semantic-review blockers: recursive relation root ownership and user-driven effective-view replacement during an unresolved inline edit.

## Confirmed current behavior

- Production two-axis virtualization is implemented and G1 30,000 × 300 remains bounded; see `docs/database-virtualization-production-results.md`.
- `DatabaseViewLayout` and `RelationValueFieldData` both derive root-to-table surface offsets and pass `verticalSurfaceOffset` / `horizontalSurfaceOffset` into `DatabaseDataTable`.
- `RelationValueInline` exposes an HTMLElement `scrollRoot`; recursive preview content is teleported by `MDRichTooltip`, so that element is not the physical ancestor/root of the nested table.
- `DatabaseViewWidget` owns one lifted inline-edit session, but the state machine is embedded in the component.
- Direct explicit view selection resolves the active edit first, while opening view management and subsequently removing the current view can bypass that handler.

## Non-goals

- no change to `useVirtualCollection` or `MDTable` public APIs;
- no worker/query/storage change;
- no new virtualization abstraction, 2D coordinator, root manager, edit manager, or provider;
- no change to canonical filter/sort/property/view sources of truth;
- no persisted schema change.

## Ownership

| Layer | Final responsibility |
| --- | --- |
| feature | Existing mutation flows remain unchanged. |
| entity | `databaseData` owns native table virtualization **and geometry from the explicit root to its own table surface**; `databaseValue` keeps the narrow value writer. Relation entity UI does not expose DOM virtualization roots. |
| widget | Chooses physical roots, composes nested relation surfaces, owns one local inline-edit lifecycle, and gates source/shape-changing configuration actions. |
| page/pane | No new responsibility. |
| shared | `useVirtualCollection` stays the only virtualization API; no automatic root/surface discovery. |
| service/worker | Canonical row/filter/sort/order/data remain unchanged. |

## Source of truth and state

- rows: existing `filteredIdList` result;
- properties: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection`;
- geometry: TanStack for virtual items/ranges plus one Database-table-owned root-to-own-surface calculation;
- edit: one widget-owned `{ itemId, propertyId, initialValue, draft, resolving }` session.

## Public entry points

- `DatabaseDataTable` accepts the explicit physical `scrollRoot`; remove consumer-provided vertical/horizontal surface-offset props.
- `RelationValueInline` removes the Database-specific `scrollRoot` slot value.
- No shared/public virtualization API changes.

## Minimum sufficient design

1. `DatabaseDataTable` references its own rendered table surface and derives both `surfaceOffset` values internally from that surface plus the explicit `scrollRoot`. Direct DOM reads and existing narrow VueUse geometry/mutation primitives are allowed; no virtual-item observer/cache is added.
2. `DatabaseViewLayout` forwards only the physical root, keeps table/`after` composition and action elevation, and drops table-surface geometry state.
3. `RelationValueFieldData` forwards only `.relation-value-field__data`; it drops duplicate offset derivation.
4. `DatabaseRelationValueInline` owns a small local overflow wrapper around nested `DatabaseViewLayout` and passes that wrapper as the root. Because the wrapper belongs to the widget slot content, it moves with recursive content when teleported. `RelationValueInline` remains domain/display-only.
5. Extract the cohesive inline-edit state machine into one local widget composable (for example `useDatabaseInlineEditSession.ts`). It may receive only the narrow `postValue(itemId, propertyId, value)` dependency. `DatabaseViewWidget` retains lifecycle ownership but no longer embeds the state machine.
6. Before opening view/filter/sort/property configuration surfaces, run one widget-level edit-resolution gate. If resolution fails, do not open the surface and keep the draft recoverable. Keep the direct explicit-view resolve-before-set guard.

The simpler alternative is preferred over changing shared virtualization: shared automatic surface tracking would need product-layout observation policy and would increase hidden complexity.

## Rejected approaches

- adding `surface` or automatic root discovery to `useVirtualCollection`;
- keeping duplicated root/surface geometry in every consumer;
- exporting DOM roots from relation entity UI;
- using the non-teleported outer relation element as the recursive tooltip table root;
- generic edit/view-transition manager;
- parallel view state to preserve a canonically removed view;
- worker/query optimization.

## Shared blast radius

None intended. If correction requires changing `useVirtualCollection`, `MDTable`, overlay/tooltip public APIs, or service/worker contracts, stop and return for architecture review.

## Acceptance matrix

- `DatabaseDataTable` consumers pass one virtualization topology input: the real physical root;
- root-to-own-table offset logic exists in one owner and remains truthful for non-zero top-level displacement;
- relation editor, inline relation preview, and teleported recursive preview each use a physical root that actually contains their nested table;
- no Database virtualization HTMLElement contract remains in relation entity UI;
- edit session behavior is unchanged but localized in one widget composable;
- user configuration capable of replacing row source/property shape cannot open while an edit failed to resolve;
- explicit view switch/current-view removal cannot silently lose a draft;
- existing bounded DOM, deep scrolling, dynamic sizing, sticky, accessibility, toolbar and mobile/desktop behavior remain intact.

## Risk matrix

- **high:** recursive teleported root -> prove physical containment + deep two-axis range in app E2E;
- **high:** edit/configuration serialization -> prove successful gate and recoverable failure at the lowest faithful level;
- **medium:** moving surface geometry owner -> prove non-zero displacement affects correct virtual ranges, not only DOM arithmetic;
- **low:** performance -> algorithm is unchanged; proportional final S0/G1 revalidation is sufficient unless regression appears.

## Required proof

Application E2E remains the primary owner for complete product scenarios. Update the centralized Database view/query/relation proof rather than creating duplicate product semantics.

Required correction proof:

- top-level real-root/non-zero-surface case tied to correct virtualized deep range;
- relation editor explicit-root deep range;
- inline relation preview physical local root;
- recursive teleported preview root physically contains the nested table and reaches deep row/property sentinels;
- edit commit/cancel/vertical+horizontal eviction after extraction;
- opening source/shape-changing configuration resolves the edit first;
- failed resolution retains the draft and blocks that user action at the lowest faithful deterministic proof;
- current-view removal cannot bypass the gate;
- bounded DOM/native accessibility/sticky behavior remain protected.

Performance: preserve the existing matrix result as baseline; on final corrected code rerun controlled S0 and G1 short -> full samples plus bounded/deep product proof. G1 must remain bounded and have no switch-associated Long Task > 100 ms.

## Forbidden

- shared virtualization API changes for convenience;
- consumer-provided surface-offset props after correction;
- second geometry/range/cache/anchor system;
- heuristic root discovery;
- relation entity DOM-root API;
- generic edit manager/provider/registry;
- direct widget `shared/service` persistence;
- parallel filter/sort/view/property source state;
- sleeps, force, retries-as-success, timeout inflation, or tolerance weakening.

## Readiness

Architecture decisions: **resolved**.

Unresolved blockers before correction implementation: **none**.

Verdict: **ready**.
