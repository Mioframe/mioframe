# Database virtualization

Status: **architecture accepted; implementation review reopened for persistence-error semantics, final geometry performance proof, and E2E stability**.

This is the architecture source of truth for large Database rendering in PR #217.

Related current contracts:

- shared virtualization API: `src/shared/ui/virtualization/README.md`;
- final semantic correction: `docs/database-virtualization-final-correction-handoff.md`, `docs/database-virtualization-final-correction-preflight.md`;
- CI-static cleanup: `docs/database-virtualization-ci-cleanup-handoff.md`, `docs/database-virtualization-ci-cleanup-preflight.md`;
- implemented full-review correction contract: `docs/database-virtualization-quality-correction-handoff.md`, `docs/database-virtualization-quality-correction-preflight.md`;
- superseded mutation-proof correction record: `docs/database-virtualization-mutation-proof-correction-handoff.md`, `docs/database-virtualization-mutation-proof-correction-preflight.md`;
- active review findings: `src/entities/databaseData/REVIEW.md`, `src/features/databaseInlineValueEdit/REVIEW.md`, `src/widgets/DocumentView/Database/REVIEW.md`, and `tests/e2e/REVIEW.md`;
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

| Owner                              | Responsibility                                                                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/virtualization`         | Generic one-axis collection virtualization and `vItem` measurement binding.                                                                                                                        |
| `entities/databaseData`            | Native table DOM, row/property virtual collections, spacers, column sizing, logical accessibility, sticky action cells, and geometry from an explicit physical root to its own table surface.      |
| `entities/databaseValue`           | Narrow value read/write contracts used by inline editing.                                                                                                                                          |
| `features/databaseInlineValueEdit` | One active inline-edit session: draft, request/update/cancel, serialized resolve/commit, entity-backed persistence, recoverable failure, and explicit feature-owned persistence-failure semantics. |
| Database widget/composition        | Physical-root choice, table/toolbar/relation composition, screen branches, explicit view/configuration state, and cross-feature resolve-before-transition orchestration.                           |
| relation entity UI                 | Domain/display behavior only; no Database virtualization DOM-root API.                                                                                                                             |
| service/worker                     | Canonical data/filter/sort/order.                                                                                                                                                                  |
| `shared/ui/Table`                  | Presentation only.                                                                                                                                                                                 |

## Source of truth

- rows/order/filter/sort: existing `filteredIdList` exposed through `useDatabaseData`;
- properties/order: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection`;
- values: existing Database value entity/service contracts;
- top-level physical root: `.database-view`;
- relation editor root: `.relation-value-field__data`;
- inline/recursive relation preview root: Database-widget-owned local overflow element that physically contains the nested layout, including after teleport;
- edit draft and persistence-failure state/result: one active flow owned by `features/databaseInlineValueEdit`;
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

The current implementation uses root/table bounding measurements plus mutation/update-driven refresh. That ownership is architecture-compatible, but its performance characteristics are not yet accepted because the final S0/G1 measurement predates this geometry implementation. Change this mechanism only if focused diagnosis shows it is responsible for a correctness/performance regression; do not redesign geometry merely because proof must be refreshed.

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

The feature owns request/claim, draft update, cancel, serialized resolve/commit, recoverable persistence failure, and the explicit error outcome for a rejected persistence attempt. It must not know about views, configuration surfaces, scroll roots, relation DOM, or screen layout.

A rejected persistence operation must not be reduced to an anonymous boolean failure. The exact draft remains recoverable, and the original failure must remain available through project-standard feature error semantics (directly or as the raw cause of a project-standard error) so the owning flow can handle the error truthfully. Do not add feature-local error classifiers or synthetic safe-cause wrappers.

`DatabaseViewWidget` consumes the feature and owns only cross-feature screen decisions. In particular, it resolves the current edit before changing explicit view or opening a source/shape configuration surface.

Invariants:

- Escape cancels without persistence while interactive;
- normal resolve clears only after successful persistence;
- while `resolving`, UI exposes no editable/cancel interaction or Material activation feedback;
- the resolving host is not the active state-layer/ripple target and does not keep a clickable cursor;
- failed persistence restores the same exact draft and normal interaction surface and exposes an explicit feature-owned failure outcome without discarding the cause;
- a defined successful retry/reset clears the previous failure state/result;
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
4. failed resolution leaves the surface closed and draft recoverable, with the failure represented by the feature rather than silently discarded;
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

The required product contracts remain:

- bounded mounted rows/properties/cells and deep 2D sentinels;
- real non-zero top-level surface displacement and range behavior after surface movement;
- relation editor physical root;
- normal and recursive teleported relation preview roots;
- edit commit, Escape, vertical/horizontal eviction, and direct view switching;
- resolve-before-configuration and current-view-removal behavior;
- resolving interval and rejected-write recovery through focused deterministic/component proof;
- native accessibility, sticky surfaces, toolbar behavior, and desktop/Mobile Chrome virtualization applicability.

The dedicated spec must not combine so many independent product behaviors into one stateful scenario that the normal per-test budget is exhausted and failures no longer identify one contract. Split behavior while preserving one proof owner; do not duplicate scenarios or raise timeouts to hide a test-design/runtime problem.

Product tests use public DOM/user behavior and must not read private virtualizer markers.

Mutation proof for the touched feature/widget owners is local to their colocated unit/component tests. It protects their public lifecycle and component branches and must not duplicate complete product E2E scenarios or expose private production state.

## Performance

The complete S0/R1/R2/R3/R4/C1/C2/C3/G1 baseline remains useful historical evidence. The final S0/G1 revalidation at `68a71e89d03713452946819cb52ba80a64157424` showed bounded DOM and zero Long Tasks, but it predates the current `DatabaseDataTable` geometry implementation.

Therefore current performance acceptance is **open**. After all runtime/geometry corrections are complete, rerun the established production S0/G1 revalidation against the final implementation and update `docs/database-virtualization-production-results.md`. The full matrix is not required unless S0/G1 exposes a regression or new scale-sensitive evidence.

Do not run the final S0/G1 proof before a pending geometry/runtime correction that could invalidate it again.

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
- feature-local failure classifiers or synthetic safe-cause wrappers;
- parallel canonical source state;
- private virtualizer markers in product proof;
- broad historical views/query mobile reclassification merely to host virtualization proof;
- broad cleanup of pre-existing Database widget debt;
- weakening mutation thresholds/configuration, excluding touched production behavior, adding test-only production seams, or changing production behavior merely to make mutation verification pass;
- timeout inflation, sleeps, force, or retry-as-success to hide E2E failures;
- treating performance evidence from an earlier geometry implementation as final proof;
- worker/query/storage optimization without new evidence.

## Readiness

Shared/native capability: **accepted**.

Production virtualization architecture: **accepted**.

Bounded mounted-DOM invariant: **structurally implemented and historically measured**.

Current geometry performance acceptance: **blocked pending final S0/G1 revalidation after runtime/geometry corrections**.

Inline-edit ownership: **accepted**, but persistence-error semantics are **not yet accepted** because the current implementation collapses rejection to `false` and discards the cause.

Owner-local mutation threshold: **passing**, but remaining feature/widget semantic proof gaps are active review blockers.

Application-E2E ownership: **accepted**, but the current combined inline-edit virtualization scenario exceeds the normal test budget and exact-head E2E is not green.

Merge readiness: **blocked; resolve active owner-local review findings, diagnose/fix E2E, perform final S0/G1 revalidation, then require green exact-head GitHub CI**.
