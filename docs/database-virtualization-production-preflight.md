# Database virtualization production migration preflight

Status: **ready; production implementation may begin in PR #217**.

Authoring source: `docs/database-virtualization-production-handoff.md` (ready), `docs/database-virtualization.md`, `src/shared/ui/virtualization/README.md`, current production Database code, applicable `AGENTS.md`, and `docs/testing/architecture.md`.

## Goal and non-goals

Migrate the real Database UI to the accepted native-table two-axis virtualization model, preserve existing product behavior, and prepare the same PR for 30,000 × 300 profiling.

Do not redesign worker/query/storage, introduce paging/range protocols, change filter/sort semantics, add another virtualization abstraction, or broaden shared UI contracts without new evidence.

## Confirmed current behavior

- `DatabaseDataTable.vue` renders the full `itemIdList × properties` cross product.
- `useDatabaseData.ts` already receives canonical active-view filtered/sorted row IDs from service `filteredIdList`.
- `useDatabaseProperties` provides the existing ordered property ID source.
- `.database-view` in `DatabaseViewWidget.vue` is the physical 2D scroll root.
- `DatabaseViewLayout.vue` currently relies on inherited class/ref landing on `DatabaseDataTable` and passes `after` into table `<tfoot>`.
- `EditableInlineValue.vue` owns draft state locally, so virtual unmount can otherwise destroy an active draft.
- `RelationValueFieldData.vue` consumes `DatabaseDataTable` inside a separate relation overflow composition.

## Owners and public entry points

### `entities/databaseData`

Own `DatabaseDataTable` production virtualization:

- vertical `useVirtualCollection` over the existing item ID list;
- horizontal `useVirtualCollection` over existing ordered property IDs;
- `<colgroup>` left/right virtual columns;
- `<tbody>` top/bottom virtual spacer rows;
- exact mounted row × visible-property expensive-cell intersection;
- row `<tr>` and property `<th>` measurement via shared `vItem`;
- progressive column `min-width` from public virtual item `size` only;
- logical native-table ARIA metadata;
- sticky action-cell integration.

Public consumer inputs may expand only narrowly to accept the explicit physical root and truthful collection-surface offsets required by the accepted shared API.

### `entities/databaseValue`

Expose the narrow domain value-write entry point required to resolve one lifted active edit session after its cell unmounts. Do not expose service clients or a mutation manager.

### Database widget composition

`DatabaseViewWidget` keeps `.database-view` as the physical root and owns one active inline-edit session.

`DatabaseViewLayout` becomes an explicit wrapper that:

- receives/passes the explicit scroll root;
- owns table-surface DOM reference and root-to-surface offset derivation;
- preserves trailing-edge/action elevation behavior;
- renders `DatabaseDataTable` and `after` as siblings.

### Relation composition

Pass the actual relation overflow root explicitly to the nested table path. Each nested table gets independent row/column virtual collections.

## Source of truth and state shape

- rows/order/filter/sort: existing service `filteredIdList` result;
- properties/order: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection` contract;
- values: existing database value entity/service contracts;
- geometry: TanStack only, through two `useVirtualCollection` instances;
- edit state: at most one widget-owned `{ itemId, propertyId, draft, resolving }` session, with no geometry, DOM, service, provider, or broad document objects.

## Minimum implementation design

1. Make `DatabaseViewLayout` an explicit composition wrapper and move `after` out of `<tfoot>`.
2. Wire the real `.database-view` root and truthful vertical/horizontal table surface offsets explicitly.
3. Convert `DatabaseDataTable` to the already-proven native-table row/property virtualization structure.
4. Preserve action column outside horizontal property virtualization and keep native table semantics.
5. Lift only the active inline edit session and route resolution through a narrow `databaseValue` entity write contract.
6. Resolve active edit before changing explicit view selection.
7. Pass relation roots explicitly and use independent nested virtual collections.
8. Add/update product E2E for the changed contracts.
9. Run real production profiling only after bounded rendering is present.

### Simpler alternatives considered

- **Row-only virtualization:** insufficient because C3/G1 remains proportional to all columns.
- **Keep draft cell-local:** insufficient because the real virtualized cell can unmount.
- **Worker paging first:** unnecessary for bounded DOM and unsupported by current measurements.
- **Pin edited ranges:** adds generic range machinery for a lifecycle problem solved by one lifted session.

## Expected files/modules

Production code is expected to touch the narrow set around:

- `src/entities/databaseData/DatabaseDataTable.vue`;
- `src/entities/databaseValue/*` public write contract as required;
- `src/widgets/DocumentView/Database/DatabaseViewLayout.vue`;
- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`;
- `src/widgets/DocumentView/Database/EditableInlineValue.vue`;
- relation composition path under `src/features/relationValueEdit/*` and/or its database widget consumer only as required for explicit root wiring;
- centralized application E2E specs/helpers that own Database item/view/query/relation/product-performance scenarios.

Do not modify `useVirtualCollection` or `MDTable` unless production evidence proves the accepted shared contracts insufficient; stop for architecture review first.

## Pass order

### Pass 1 — explicit composition/root topology

- make `DatabaseViewLayout` an explicit wrapper;
- move `after` outside table semantics;
- establish explicit top-level and nested root inputs;
- derive truthful surface offsets from known composition DOM.

Focused proof: type-check plus existing Database product path sufficient to confirm toolbar/action composition remains reachable.

### Pass 2 — production table virtualization

- add two `useVirtualCollection` consumers in `DatabaseDataTable`;
- add native virtual row/column spacers and measurement bindings;
- preserve sticky action column and current wrapping/dynamic-height behavior;
- remove obsolete full-range `v-for` rendering and `role=list/listitem` overrides.

Focused proof: bounded DOM, deep 2D reach, native semantics, sticky behavior, non-zero surface offset.

### Pass 3 — edit lifecycle

- introduce one active session at widget owner;
- adapt `EditableInlineValue` to consume/update that session;
- add narrow entity write entry point if the existing ref-bound write API cannot resolve after unmount;
- serialize previous-edit and view-switch resolution.

Focused proof: commit, Escape, vertical eviction, horizontal eviction, failed-resolution preservation, and view switch.

### Pass 4 — relation/nested composition

- finish explicit nested root wiring;
- prove representative relation view/edit and dynamic outer row behavior.

### Pass 5 — performance evidence

- execute S0/R1/R2/R3/R4/C1/C2/C3/G1 from `docs/database-virtualization-profiling.md`;
- classify any remaining material cost before proposing further optimization.

Do not start evidence-gated worker/query/storage optimization inside these passes; it requires a new narrow architecture decision based on measurements.

## Required removal of replaced logic

- remove production full `itemIdList × properties` rendering path;
- remove `after` from `DatabaseDataTable` table footer semantics;
- remove production `tbody role="list"` / `tr role="listitem"` overrides;
- remove any table-root assumptions in `DatabaseViewLayout` that conflict with explicit `.database-view` root ownership;
- do not keep compatibility paths for the old unvirtualized production renderer.

## Inline edit contract

- opening an editor initializes/claims the active session;
- field updates write the draft into the session before virtual eviction is possible;
- Escape cancels and clears without persistence;
- normal commit clears only after successful persistence;
- eviction cannot silently lose the draft;
- failed persistence keeps the draft recoverable;
- remount of the same cell restores an unresolved active draft;
- starting another edit resolves the previous session first;
- view switch resolves the session before mutating explicit view selection;
- failed resolution blocks that view switch;
- ordinary scrolling leaves the editor open while its cell remains mounted.

## Surface-offset contract

- explicit root only;
- derive from known composition-owned root/table elements;
- maintain truthful vertical and horizontal distance as layout changes;
- direct DOM geometry reads or an existing narrow VueUse geometry primitive are acceptable for root-to-surface position;
- no second virtual-item `ResizeObserver`, size cache, scroll correction, or range engine.

## Accessibility and presentation

- preserve native table semantics;
- full logical `aria-rowcount` and `aria-colcount`;
- mounted logical `aria-rowindex`/`aria-colindex`;
- virtual spacer/fill DOM excluded from logical semantics;
- no ARIA grid conversion;
- preserve sticky header/action behavior, toolbar auto-hide, wrapping/dynamic-height behavior, and current mobile/desktop interaction tier.

## TEST IMPACT

- Contract/scenario: production bounded 2D Database rendering and deep scrolling.
  - Primary proof owner: application E2E.
  - Additional proof: existing shared/native capability Storybook behavior only if shared/native owners change.
  - Existing proof: `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`, `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`.
  - New/updated proof: centralized Database E2E covering actual mounted rows/headers/expensive `<td>`, sentinels, deep 2D scroll, real `.database-view` root, non-zero surface offset.
  - Risk/platform matrix: desktop + mobile product applicability; Chromium product path, existing Firefox native capability remains unless a Firefox-specific production risk is found.
  - Durable ownership/impact updates: update existing application-E2E source mapping/applicability only if the new/changed centralized spec requires it.

- Contract/scenario: exact filter/sort/view switching, including short -> full -> short and no stale cells.
  - Primary proof owner: application E2E.
  - Existing proof: `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
  - New/updated proof: extend the owning Database view/query product spec or a focused new centralized Database performance/product spec without duplicating service algorithm tests.
  - Risk/platform matrix: real worker/service/UI integration.
  - Durable ownership/impact updates: preserve explicit application-E2E mapping.

- Contract/scenario: inline edit lifecycle under virtual eviction and view switch.
  - Primary proof owner: application E2E.
  - Existing proof: inline commit/persistence scenarios in `tests/e2e/databaseItemFlows.spec.ts`.
  - New/updated proof: Escape plus vertical/horizontal eviction, remount/recovery, failed resolution where testable through public behavior, and view-switch serialization.
  - Risk/platform matrix: focus/overlay/scrolling; desktop and mobile where existing applicability requires.
  - Durable ownership/impact updates: preserve centralized product ownership; no Storybook duplicate.

- Contract/scenario: relation/nested table root and representative relation behavior.
  - Primary proof owner: application E2E.
  - Existing proof: relation scenarios in `databaseItemFlows.spec.ts` and `databaseViewsAndQueryFlows.spec.ts`.
  - New/updated proof: explicit nested scrolling/virtualized relation case only for the new root/geometry risk; do not repeat relation domain semantics already protected.
  - Risk/platform matrix: nested overflow, dynamic height, overlay composition.
  - Durable ownership/impact updates: existing product E2E mapping if sufficient; otherwise narrow mapping update.

- Contract/scenario: 30,000 × 300 scalability and short -> full responsiveness.
  - Primary proof owner: task-specific product performance measurement.
  - Additional proof: durable bounded-DOM assertions in application E2E.
  - Existing proof: `docs/database-virtualization-profiling.md` plan; capability bounded-DOM proof is not the product benchmark.
  - New/updated proof: controlled S0…G1 result data using in-page `MessageChannel`, `requestAnimationFrame`, switch-to-usable, and Long Task measurements.
  - Risk/platform matrix: production-like Chromium timing environment; mobile remains correctness coverage unless a stable mobile performance budget is explicitly established.
  - Metric/budget: no switch-associated main-thread block > 100 ms; prefer slices <= 50 ms; bounded mounted work independent of logical size.
  - Durable ownership/impact updates: no generic benchmark framework or permanent wall-clock CI budget unless repeated evidence justifies one.

Visual regression: not required unless implementation produces an intentional visible change beyond preserving current layout; geometry/interaction is not proved by screenshots.

Mutation: no new target identified by this migration preflight.

Release behavior/data safety: no release or persisted schema contract changes are intended.

## Acceptance criteria

- real Database uses the accepted two-axis native-table virtualization architecture;
- fixed viewport/overscan keeps expensive mounted rows, columns, and cells bounded independently of logical dataset size;
- canonical filter/sort/view behavior is unchanged;
- edit eviction/view switching cannot silently lose a draft;
- nested relation rendering uses explicit roots;
- toolbar/`after` is outside table semantics;
- native logical table accessibility is preserved;
- required product E2E proof exists;
- no parallel geometry/range/cache/pinning system exists.

This pass does not complete PR #217: profiling and any measurement-justified follow-up remain in the same PR.

## Final verification

Coding agent uses focused verifier-managed checks needed for implementation feedback, e.g. type-check and affected E2E specs. Existing capability browser specs are rerun when their owning shared/native contracts are touched or when diagnosing a geometry regression.

The architect owns final full-result review, profiling acceptance, and exact-head GitHub CI. Do not require a coding-agent broad local repository gate solely for handoff.

## Forbidden

- separate PR for migration/profiling;
- row-only final solution;
- UI-side filter/sort/slice ownership;
- paging/range worker API without profiling evidence;
- direct TanStack usage outside `useVirtualCollection`;
- direct widget `shared/service` access for edit persistence;
- generic virtual grid/table/list, pinning, edit manager, or 2D coordinator;
- independent row-height/column-width map or second virtual geometry observer;
- heuristic scroll-root discovery;
- `after` inside `<tfoot>`;
- silent active-draft loss;
- capability-only nowrap styling that changes production wrapping;
- sleeps, force, broad retries, tolerance weakening, or timeout inflation in proof.

## Preflight result

Architecture handoff: **ready**.

TEST IMPACT: **resolved**.

Pass order and owners: **resolved**.

Unresolved blockers before production implementation: **none**.

Verdict: **ready**.
