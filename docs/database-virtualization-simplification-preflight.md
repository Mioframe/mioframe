# Database virtualization simplification correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-simplification-handoff.md`, current PR #217 implementation, applicable `AGENTS.md`, and `docs/testing/architecture.md`.

## Goal

Apply the approved simplification correction without changing the shared virtualization algorithm or product behavior.

## Current behavior

- `DatabaseDataTable` correctly virtualizes rows and properties.
- `DatabaseViewLayout` and `RelationValueFieldData` duplicate root-to-table offset calculation.
- `RelationValueInline` exports a DOM root that becomes physically wrong for teleported recursive preview.
- `DatabaseViewWidget` embeds the active-edit state machine and only direct explicit view selection is gated by edit resolution.

## Owners / APIs

- `entities/databaseData`: keep two virtual collections; `DatabaseDataTable` keeps `scrollRoot`, removes numeric surface-offset props, and derives offsets from the explicit root plus its own rendered table.
- Database widget: choose physical roots, own a local `useDatabaseInlineEditSession`, and gate source/shape-changing configuration.
- relation entity: remove the Database-specific `scrollRoot` slot value.
- `databaseValue`, service/worker, `useVirtualCollection`, `MDTable`: contracts unchanged.

## Minimum design

1. Move root-to-own-table surface calculation into `DatabaseDataTable`.
2. Remove geometry state from `DatabaseViewLayout` and `RelationValueFieldData`.
3. Make `DatabaseRelationValueInline` own a local overflow wrapper/root around nested `DatabaseViewLayout`; remove root plumbing from `RelationValueInline`.
4. Extract the existing edit session state machine into one local widget composable; do not redesign it.
5. Before opening view/filter/sort/property configuration, resolve the active edit. Failed resolution blocks opening and keeps the draft. Keep direct explicit-view resolve-before-set handling.
6. Update focused product proof, then rerun final-code S0 and G1 measurements only; widen profiling only if a regression appears.

Changing `useVirtualCollection` to observe a surface element is rejected: it would move product-layout lifecycle into shared and add hidden geometry ownership.

## Expected scope

- `src/entities/databaseData/DatabaseDataTable.vue`
- `src/widgets/DocumentView/Database/DatabaseViewLayout.vue`
- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`
- new local `src/widgets/DocumentView/Database/useDatabaseInlineEditSession.ts`
- `src/entities/databaseRelation/RelationValueInline.vue`
- `src/widgets/DocumentView/Database/DatabaseRelationValueInline.vue`
- `src/features/relationValueEdit/RelationValueFieldData.vue`
- affected centralized Database E2E / risk mappings
- `docs/database-virtualization-production-results.md` for final raw S0/G1 evidence

Stop before changing `src/shared/ui/virtualization/*`, `MDTable`, tooltip/overlay public APIs, or service/worker contracts.

## Pass order

1. **Surface ownership:** table-owned offsets; delete offset props and duplicated consumer geometry.
2. **Relation roots:** widget-owned physical root; remove entity DOM-root contract; prove teleport path.
3. **Edit lifecycle:** extract local composable; add one configuration gate; preserve existing semantics.
4. **Proof:** focused E2E plus final S0/G1 measurement.

## Required removal

- `verticalSurfaceOffset` / `horizontalSurfaceOffset` consumer props;
- table-surface geometry/observer code from `DatabaseViewLayout` and `RelationValueFieldData`;
- `scrollRoot` slot value from `RelationValueInline`;
- inline edit state machine from `DatabaseViewWidget` after extraction;
- old/new compatibility paths.

## TEST IMPACT

- **Top-level root/surface:** application E2E; prove non-zero real surface displacement is connected to correct virtualized deep-range behavior, not only DOM arithmetic.
- **Relations:** application E2E; keep relation-editor deep root proof and add normal + recursive teleported preview proof where the physical root contains the nested table and a large case reaches deep row/property sentinels.
- **Edit/configuration:** application E2E for user flows; a narrow local unit test may prove rejected persistence keeps the extracted session recoverable. Prove source/shape configuration resolves first and current-view removal cannot bypass the gate.
- **Performance:** existing S0…G1 matrix remains baseline; rerun controlled S0 and G1 on final code with the same in-page MessageChannel/rAF/usable/Long Task protocol. G1 remains bounded and has no switch-associated Long Task > 100 ms.

No new visual design, persisted schema, generic benchmark, or permanent wall-clock CI budget.

## Acceptance

- shared virtualization API unchanged;
- one root-to-own-table offset owner;
- consumers pass only the real physical root;
- relation entity exposes no virtualization HTMLElement;
- every nested root physically contains its table, including teleport;
- edit lifecycle is localized without a generic manager;
- failed edit resolution blocks source/shape-changing user configuration;
- existing bounded DOM, accessibility, sticky behavior, and mobile/desktop behavior remain correct;
- final S0/G1 evidence shows no material regression.

## Verification

Coding agent runs only focused verifier-managed checks useful to the correction. Architect owns full semantic re-review, exact-head CI, PR metadata, and merge recommendation.

## Forbidden

Shared API changes for convenience; automatic root discovery; second geometry/range/cache system; generic edit/config manager; parallel canonical state; worker/query/storage optimization; sleeps/retries/timeout inflation/tolerance weakening.

Verdict: **ready**.
