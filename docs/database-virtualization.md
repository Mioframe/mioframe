# Database virtualization

Status: **architecture accepted; production virtualization/profiling and CI-static cleanup complete; quality correction implemented; required mutation proof still blocked**.

This is the architecture source of truth for large Database rendering in PR #217.

Related current contracts:

- shared virtualization API: `src/shared/ui/virtualization/README.md`;
- final semantic correction: `docs/database-virtualization-final-correction-handoff.md`, `docs/database-virtualization-final-correction-preflight.md`;
- CI-static cleanup: `docs/database-virtualization-ci-cleanup-handoff.md`, `docs/database-virtualization-ci-cleanup-preflight.md`;
- current full-review correction contract: `docs/database-virtualization-quality-correction-handoff.md`, `docs/database-virtualization-quality-correction-preflight.md`;
- active review findings: `src/features/databaseInlineValueEdit/REVIEW.md` and `src/widgets/DocumentView/Database/REVIEW.md`;
- raw product measurements: `docs/database-virtualization-production-results.md`.

## Goal

Scale Database rendering to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, while preserving exact filter/sort/view behavior, editing, relations, native table semantics, accessibility, and desktop/Mobile Chrome usability.

Primary invariant:

> For fixed viewport and overscan, mounted expensive rows, properties, and cells are bounded independently of total logical dataset size.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` is the only virtual-item geometry/range/cache engine.
- `useVirtualCollection` is the only Mioframe virtualization boundary and its public API remains unchanged.
- Production Database uses one row collection and one property collection over the existing complete canonical sources.
- Native `<table>` flow remains the renderer; only mounted row × mounted property intersections instantiate expensive cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- No UI-side paging/source reconstruction, worker redesign, generic virtual grid/table, second geometry system, pinning, independent size maps, or virtual-item registry exists.

## Ownership

| Owner                              | Responsibility                                                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/virtualization`         | Generic one-axis collection virtualization and `vItem` measurement binding.                                                                                                                   |
| `entities/databaseData`            | Native table DOM, row/property virtual collections, spacers, column sizing, logical accessibility, sticky action cells, and geometry from an explicit physical root to its own table surface. |
| `entities/databaseValue`           | Narrow value read/write contracts used by inline editing.                                                                                                                                     |
| `features/databaseInlineValueEdit` | One active inline-edit session: draft, request/update/cancel, serialized resolve/commit, entity-backed persistence, and recoverable failure.                                                  |
| Database widget/composition        | Physical-root choice, table/toolbar/relation composition, screen branches, explicit view/configuration state, and cross-feature resolve-before-transition orchestration.                      |
| relation entity UI                 | Domain/display behavior only; no Database virtualization DOM-root API.                                                                                                                        |
| service/worker                     | Canonical data/filter/sort/order.                                                                                                                                                             |
| `shared/ui/Table`                  | Presentation only.                                                                                                                                                                            |

## Source of truth

- rows/order/filter/sort: existing `filteredIdList` exposed through `useDatabaseData`;
- properties/order: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection`;
- values: existing Database value entity/service contracts;
- top-level physical root: `.database-view`;
- relation editor root: `.relation-value-field__data`;
- inline/recursive relation preview root: Database-widget-owned local overflow element that physically contains the nested layout, including after teleport;
- edit draft: one active session owned by `features/databaseInlineValueEdit`;
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
- direct DOM reads and narrow VueUse geometry/mutation primitives are allowed only for root-to-own-surface position;
- no virtual-item observer/cache/range/anchor logic outside TanStack;
- no automatic scroll-parent discovery.

`DatabaseViewLayout` and `RelationValueFieldData` do not compute or pass numeric surface offsets.

Passing the physical `HTMLElement` root explicitly is intentional browser-resource dependency injection. Do not replace it with DOM discovery, `provide/inject`, a root manager, or a generic context solely to hide the prop.

## Composition

Top level:

```text
.database-view (physical root)
  optional preceding content
  DatabaseViewLayout
    DatabaseDataTable(scrollRoot=.database-view)
    after / toolbar composition
```

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

The local widget root moves with slot content when tooltip composition teleports the recursive preview. `RelationValueInline` does not expose an HTMLElement root.

## Dynamic sizing / sticky UI

Rows and mounted property headers are measured through the shared per-instance `vItem`. TanStack owns measured size and scroll correction.

Production wrapping remains intact. A mounted property may use public virtual item `size` as remount `min-width`; no parallel width map exists.

Native sticky header behavior remains presentation-owned. The trailing action column stays mounted for each mounted logical row and remains outside property virtualization.

## Inline editing

Virtual eviction requires one lifted active session:

```text
{ itemId, propertyId, initialValue, draft, resolving }
```

`features/databaseInlineValueEdit` owns that session and obtains the existing entity-level `useDatabaseValueWrite(path, documentId)` contract internally.

The feature owns request/claim, draft update, cancel, serialized resolve/commit, and recoverable persistence failure. It must not know about views, configuration surfaces, scroll roots, relation DOM, or screen layout.

`DatabaseViewWidget` consumes the feature and owns only cross-feature screen decisions. In particular, it resolves the current edit before changing explicit view or opening a source/shape configuration surface.

Invariants:

- Escape cancels without persistence while interactive;
- normal resolve clears only after successful persistence;
- while `resolving`, UI exposes no editable/cancel interaction or Material activation feedback;
- the resolving host is not the active state-layer/ripple target and does not keep a clickable cursor;
- failed persistence restores the same exact draft and normal interaction surface;
- eviction cannot silently lose a draft;
- remount restores an unresolved draft;
- starting another editor resolves the previous one first;
- direct explicit view change resolves before setting selection;
- opening views/sort/filter/properties resolves before setting the controlled configuration surface;
- no second/local draft, pinning, global registry, provider, generic manager, or public persistence callback injection.

## Source/shape-changing user configuration

Database widget composition owns one controlled configuration state:

```ts
DatabaseConfigurationSurface | undefined;
```

with `views`, `sort`, `filter`, or `properties`.

`DatabaseToolbar` is controlled by that state. Toolbar actions emit typed request/close intents upward; parent-owned resolve/permission/async-gate functions are not passed down as callback props.

Opening behavior:

1. toolbar emits configuration request;
2. `DatabaseViewWidget` resolves the feature-owned active inline edit;
3. only after success the widget sets the controlled configuration surface;
4. failed resolution leaves the surface closed and draft recoverable;
5. toolbar close emits upward and the widget clears the state.

Direct explicit-view resolve-before-set remains defense in depth. Do not add parallel view/filter/sort/property source state.

## Vue composition conventions for the touched flow

- Widget components use explicit props, emits, slots, and named handlers.
- New controlled props should be exposed as named local bindings instead of mixing `props.*` access into a template that already uses named refs.
- `EditableInlineValue` remains widget-level screen composition; the feature owns the lifted action/session lifecycle rather than importing widget UI.
- Do not move feature-owned action state back into the widget to reduce file count.

Pre-existing Database widget debts such as direct item-remove entity mutation, duplicate read-model subscriptions, and unrelated callback props are outside PR #217 unless current work materially touches them.

## Accessibility

Preserve native table semantics:

- `aria-rowcount` = header + complete logical rows;
- `aria-colcount` = complete logical properties + action column when present;
- row `i` uses `aria-rowindex = i + 2`;
- property `j` uses `aria-colindex = j + 1`;
- action uses the trailing logical column index;
- spacer/fill DOM is hidden from logical semantics;
- no `role=list/listitem` override;
- no ARIA-grid keyboard model.

## Proof ownership

Application E2E owns complete cross-owner product behavior.

The Database virtualization product scenarios have one dedicated root application owner:

`tests/e2e/databaseVirtualizationFlows.spec.ts`

with persistent project applicability `both`.

The historical `tests/e2e/databaseViewsAndQueryFlows.spec.ts` retains `desktop` applicability. Virtualization source impact selects the dedicated spec explicitly through `scripts/lib/e2eRisk.ts`, including the `features/databaseInlineValueEdit` owner.

Final product proof covers:

- bounded mounted rows/properties/cells and deep 2D sentinels;
- real non-zero top-level surface displacement and range behavior after surface movement;
- relation editor physical root;
- normal and recursive teleported relation preview roots;
- edit commit, Escape, vertical/horizontal eviction, and direct view switching;
- resolve-before-configuration and current-view-removal behavior;
- resolving interval and rejected-write recovery through focused deterministic/component proof;
- native accessibility, sticky surfaces, toolbar behavior, and desktop/Mobile Chrome virtualization applicability.

Product tests use public DOM/user behavior and must not read private virtualizer markers.

## Performance

The complete S0/R1/R2/R3/R4/C1/C2/C3/G1 baseline and final S0/G1 revalidation are complete. G1 remains bounded and the final three G1 samples observed no Long Tasks.

The quality correction changes FSD placement/wiring, resolving interaction targeting/presentation, a template binding, and E2E ownership metadata/file placement. It does not change virtualization/geometry or the measured short-to-full rendering algorithm.

Do not rerun performance evidence unless implementation crosses those boundaries or a focused proof reveals a regression.

## Forbidden

- changing `useVirtualCollection`, `MDTable`, overlay/tooltip, shared State/Ripple public APIs, entity value-write API, or service/worker APIs for convenience;
- consumer-provided numeric surface-offset props;
- automatic root discovery or generic root context/manager;
- relation entity DOM-root API;
- generic virtualization/edit/configuration/interaction manager;
- second edit draft or geometry/range/cache/anchor system;
- independent row/column size maps;
- callback props for parent-owned commands/permission/async gates;
- widget-owned value persistence for the inline-edit session;
- feature knowledge of views/configuration/scroll roots;
- parallel canonical source state;
- private virtualizer markers in product proof;
- broad historical views/query mobile reclassification merely to host virtualization proof;
- broad cleanup of pre-existing Database widget debt;
- weakening mutation thresholds/configuration or excluding touched production behavior to make verification pass;
- worker/query/storage optimization without new evidence;
- sleeps, force, retries-as-success, timeout inflation, or tolerance weakening.

## Readiness

Shared/native capability: **accepted**.

Production virtualization and performance evidence: **complete**.

Final semantic correction: **complete**.

CI-static cleanup: **complete**.

Quality-correction implementation: **complete and architecture-reviewed** — inline-edit ownership is feature-correct, resolving State/Ripple targeting is corrected, toolbar controlled-state binding is normalized, and virtualization product E2E has a dedicated audited owner.

Application-E2E ownership review: **resolved**.

Focused type-check/unit/component proof: **passing**.

Required mutation proof: **blocked** — the current verifier-managed mutation run scores 32.84% across the touched feature/widget source against the repository breaking threshold of 60%. Active proof findings live in the owner-local `REVIEW.md` files.

Exact-head GitHub CI: **not green while mutation verification is unresolved**.

Merge readiness: **not yet; close the mutation-proof findings, re-review the resulting correction, then require green exact-head GitHub CI**.
