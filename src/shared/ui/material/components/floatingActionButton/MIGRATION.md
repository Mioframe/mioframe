# Floating action button migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/floatingActionButton/IMPLEMENTATION.md`
Revision summary: Revalidated the approved library-only FAB scenario; no consumer, legacy, or proof-ownership change is required.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Migration preflight used the deterministic Material migration workflow and the current ready artifacts: `DESIGN.md` is current, `ARCHITECTURE.md` is ready with no dependencies, and `IMPLEMENTATION.md` is complete with no architecture deviations and migration readiness `ready`.

The approved scope remains the standalone canonical `MDFab` library contract. `rg` found no `MDFab`, `m3e-fab`, or `floatingActionButton` use in `src/pages`, `src/widgets`, `src/features`, or `src/entities`; the only public entrypoint is the root `@shared/ui/material` export. `FabContainer`'s two `MDFab` mentions are documentation examples, not imports or rendered instances.

Consumer inventory: none.

## Migrated consumers

Migrated consumers: none. Creating a product consumer or compatibility alias would expand the accepted library-only architecture.

## Preserved scenarios and failure paths

- No product placement, action state, disabled state, routing, error, or persistence scenario belongs to the canonical FAB because it has no current consumer. A future adoption must return to architecture before selecting its placement and action contract.
- `RepoExplorerPane` remains a separate Extended FAB scenario: it imports `FabContainer` and `MDExtendedFab` from `@shared/ui/Button`, mounts that pair only while `canEditDirectoryContents !== false`, and forwards its `Add` action to `onClickAdd`. This migration made no change to that capability guard, overlay placement, or action behavior.
- No legacy-to-canonical state translation exists: there is no old plain-FAB consumer, capability flag, configuration value, or rendered state to map.

## Legacy ownership removed

- The former plain-FAB files `src/shared/ui/Button/MDFab.vue`, `MDFab.test.ts`, and `MDFab.stories.ts` are absent, and `src/shared/ui/Button/index.ts` has no `MDFab` export.
- `tests/e2e/storybook/focusIndicator.spec.ts` and `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` contain no `MDFab` or `m3e-fab` reference. The retained central visual spec and its two baselines cover only the separate `MDExtendedFab` owner.
- No compatibility alias was added. `FabContainer` and `MDExtendedFab` remain outside this family and unchanged.

## Consumer and blast-radius proof

The repository inventory is the primary proof for the approved no-consumer scenario and legacy removal. It confirms no product import, raw renderer use, legacy barrel export, legacy test, browser proof, visual proof, or legacy snapshot has been reintroduced.

The surviving canonical proof remains at its architecture-selected owner-local paths: `MDFab.test.ts`, `MDFab.browser.spec.ts`, `MDFab.visual.spec.ts` with its colocated snapshots, and `MDFab.stories.ts`. Those component contracts were not changed by this migration; no fabricated product E2E, consumer test, or duplicate browser/visual lane is warranted.

## Stage verification

Preflight resolved the minimum design as a documentation-only no-consumer migration. The simpler alternative of adding a consumer, alias, or extra proof was rejected because it would change the accepted scope. Pass order was artifact validation, consumer/legacy inventory, migration record, then focused verification.

TEST IMPACT:

- No-consumer scenario, legacy removal, and product blast radius: primary proof is the fresh `rg` inventory; whole-project type-check additionally proves no residual typed import. Existing canonical component, browser, and visual proof remains implementation-owned and unchanged.
- Migration record: focused format validation owns the changed Markdown file.

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/floatingActionButton/MIGRATION.md` — passed.

## Remaining blockers

None.

## Review readiness

Ready. The no-consumer scenario is proven, legacy plain-FAB ownership is absent, focused migration checks pass, and no migration-stage correction is required.
