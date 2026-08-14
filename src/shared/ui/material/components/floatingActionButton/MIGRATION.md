# Floating action button migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/floatingActionButton/IMPLEMENTATION.md`
Revision summary: Confirmed the explicit no-consumer record for the canonical `MDFab` default, removed the now-dead legacy plain `MDFab` (`src/shared/ui/Button/MDFab.vue`/`.test.ts`/`.stories.ts`) and its barrel export, and removed every legacy-proof consumer of the deleted component's Storybook stories discovered during migration-time audit (a `focusIndicator.spec.ts` cross-owner test and nine legacy-only tests plus three baseline PNGs in `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`) that `ARCHITECTURE.md`'s "Current scenarios" analysis did not account for. `RepoExplorerPane.vue`'s Extended FAB scenario, `FabContainer.vue`, and legacy `MDExtendedFab` are unaffected.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Repeated the architecture-stage grep across `src/pages`, `src/widgets`, `src/features`, `src/entities`, and every shared UI barrel/re-export at migration time. Zero production Vue consumers of the legacy plain `MDFab` (`src/shared/ui/Button/MDFab.vue`) exist. Confirmed directly:

- `src/pages/RepoExplorer/RepoExplorerPane.vue` imports `FabContainer` and `MDExtendedFab` from `@shared/ui/Button` — neither is the plain `MDFab`.
- `src/shared/ui/Button/FabContainer.vue` and `FabContainer.stories.ts` only reference `MDExtendedFab` (plus a doc-comment mentioning "`MDFab` or `MDExtendedFab`" as illustrative slot content, not an import).
- No `src/entities`, `src/features`, or `src/widgets` file imports `Button/MDFab` or the canonical `MDFab` (the canonical family had no prior consumer to begin with — this is its first migration pass).
- The only import-time references to legacy `MDFab` were the legacy component's own `MDFab.test.ts`/`MDFab.stories.ts`, both removed in this migration.

Beyond production Vue consumers, migration-time audit found two additional non-Vue legacy-proof consumers of the legacy `MDFab.stories.ts` catalogue that `ARCHITECTURE.md`'s "Current scenarios" and "Migration plan" did not enumerate (see "Legacy ownership removed" below):

- `tests/e2e/storybook/focusIndicator.spec.ts` — one cross-owner test opened the legacy `FocusIndicatorTarget` story.
- `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` — nine legacy-only tests plus three baseline PNGs exercised the legacy `MDFab`'s color/elevation/geometry/state-layer token routing and appearance.

Consumer inventory: none (canonical `MDFab` has zero current product consumers; the selected default is the approved library-only scenario per `ARCHITECTURE.md`).

## Migrated consumers

Migrated consumers: none. No product consumer exists to migrate onto the canonical `MDFab`; fabricating one would violate `ARCHITECTURE.md`'s explicit no-consumer scenario and the migration skill's "Forbidden" list.

## Preserved scenarios and failure paths

- `RepoExplorerPane.vue`'s current Extended FAB scenario (add action inside `FabContainer`, `MDExtendedFab` with `label="Add"` / `md-symbol="add"`, `@click="onClickAdd"`) is unchanged — verified by direct inspection of `src/pages/RepoExplorer/RepoExplorerPane.vue`; this migration touched neither the file nor any of its imports.
- `FabContainer.vue`'s placement/visibility/auto-hide behavior is unchanged — the file was not touched.
- Legacy `MDExtendedFab` (`src/shared/ui/Button/MDExtendedFab.vue`) and all its proof (`MDExtendedFab.test.ts`, `MDExtendedFab.stories.ts`, the `MDExtendedFab` portions of `focusIndicator.spec.ts` and `md-fab-family.spec.ts`) are unchanged — out of this family's scope per `ARCHITECTURE.md`'s "Non-goals" and "Forbidden" sections.
- No failure path changes: the legacy plain `MDFab` had zero rendered product instances, so there is no user-facing behavior, error state, or accessibility contract to preserve or regress.

## Legacy ownership removed

Removed the legacy plain `MDFab` as dead code (zero product consumers) and every proof file that exclusively exercised it:

1. **Legacy component and its own proof** (per `ARCHITECTURE.md`'s "Migration plan" steps 1–2):
   - `src/shared/ui/Button/MDFab.vue` — deleted.
   - `src/shared/ui/Button/MDFab.test.ts` — deleted.
   - `src/shared/ui/Button/MDFab.stories.ts` — deleted.
   - `src/shared/ui/Button/index.ts` — removed the `export { default as MDFab } from './MDFab.vue';` line; the `FabContainer`/`MDExtendedFab`/`MDIconButton` exports are unchanged.

2. **`docs/testing/migration-plan.md`'s Stage S2-D historical record** (per `ARCHITECTURE.md`'s "Migration plan" step 3): direct inspection of `src/shared/ui/Button/LegacyButton.browser.spec.ts` showed it contains only `MDIconButton` tests — no legacy `MDFab`-only browser contract was ever present there, despite the S2-D inventory/migration-group text (two locations) claiming "MDIconButton/MDFab/MDExtendedFab-only contracts moved" to that file. Updated both locations to remove the inaccurate `MDFab` mention and added a **Historical note** at each recording that the legacy `MDFab` component this wording referenced no longer exists, per `ARCHITECTURE.md`'s Risk callout ("update that record accurately rather than leaving a dangling reference to a deleted component").

3. **Cross-owner legacy-proof consumers discovered during migration-time audit** (not enumerated by `ARCHITECTURE.md`'s "Current scenarios"/"Migration plan," corrected here as legacy-ownership removal — the disposition to delete the legacy `MDFab` was already architecture-approved; only the proof-file audit was incomplete, matching the precedent already established by the `switch` family migration's removal of legacy `MDSwitch` tests from `tests/e2e/visual/shared-ui.spec.ts`):
   - `tests/e2e/storybook/focusIndicator.spec.ts` — removed the `'MDFab focus indicator follows real keyboard focus and is not clipped'` test, which opened the legacy `material-3-components-buttons-mdfab--focus-indicator-target` story (now deleted). The `MDIconButton` and `MDExtendedFab` focus-indicator tests are unchanged.
   - `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` — removed nine legacy-`MDFab`-only tests (`'MDFab visual states match baseline'`, `'MDFab interaction states match baseline'`, `'MDFab routes independent icon, elevation, and state-layer tokens for all six colors'`, `'MDFab default color resolves to the primary-container token'`, `'MDFab resting styles resolve to the documented Material color role for all six colors'`, `'MDFab default hover, focus, and pressed elevation resolves to the documented system levels for all six colors'`, `'MDFab container height and icon size match the exact documented size tokens'`, `'MDFab size comparison matches baseline'`, `'MDFab width and height are independently overridable through exact official component tokens'`, `'MDFab container shadow-color routes an override into the shared elevation bridge'`, `'MDFab plain-style focus-indicator component tokens route into the generic focus-indicator contract'`) and the now-orphaned `FAB_TOKEN_MATRIX` fixture object; split the one mixed test (`'FAB-family loading colors and enabled geometry contracts'`) into an `MDExtendedFab`-only test (`'MDExtendedFab loading colors and enabled geometry contract'`), removing only its legacy-`MDFab` half. Deleted the three now-orphaned baseline PNGs (`md-fab-states-linux.png`, `md-fab-interaction-states-linux.png`, `md-fab-size-comparison-linux.png`) from the colocated snapshots directory. Every `MDExtendedFab` test, its shared `EXTENDED_FAB_TOKEN_MATRIX`/`FAB_COLORS`/`rotateRgbChannels` fixtures, and its two baseline PNGs (`md-extended-fab-states-linux.png`, `md-extended-fab-interaction-states-linux.png`) are unchanged and remain the file's only content.

No compatibility alias was kept for the removed legacy `MDFab` — it had zero product consumers, so none was warranted per the migration skill's rule against keeping replaced logic to reduce work.

## Consumer and blast-radius proof

No product consumer exists to translate, so no legacy-to-canonical state-translation table applies (the canonical `MDFab` has no prior consumer whose props/state require a translation formula). Blast-radius proof instead covers the legacy-removal:

- **`src/shared/ui/Button/index.ts` barrel**: repo-wide `type-check` (whole-project scope) confirms no remaining import of the removed `MDFab` export compiles-fails, i.e., nothing else in the tree referenced it.
- **`tests/e2e/storybook/focusIndicator.spec.ts`**: confirmed by direct read that only the `MDFab`-only test opened the deleted legacy story; the surrounding `MDIconButton`/`MDExtendedFab` tests, the shared `assertFocusIndicatorFollowsHost` helper, and imports are untouched and still referenced.
- **`tests/e2e/visual/shared-ui/md-fab-family.spec.ts`**: confirmed by grep that every remaining `FAB_COLORS`-consuming test after the edit belongs to the `MDExtendedFab` suite (`EXTENDED_FAB_TOKEN_MATRIX`'s `satisfies` clause, the `MDExtendedFab` token-routing test, and the `MDExtendedFab default interaction routes...` test), and that every remaining helper import (`readButtonLocatorVisuals`, `getSysPropertyValue`, etc.) still has a live call site after removal — no unused import remains (confirmed by the passing `eslint` focused check).
- **`RepoExplorerPane.vue` Extended FAB scenario**: confirmed unaffected by direct inspection — the file, its imports, and its template were not touched by any edit in this migration.
- **Storybook catalogue**: `pnpm storybook:build` still succeeds after the legacy `MDFab.stories.ts` deletion, confirming no other story or catalogue entry depended on it.

## Stage verification

- `pnpm verify --only type-check` — passed (whole-project scope; confirms no remaining import references the deleted legacy `MDFab.vue`/export).
- `pnpm verify --only eslint --files src/shared/ui/Button/index.ts tests/e2e/storybook/focusIndicator.spec.ts tests/e2e/visual/shared-ui/md-fab-family.spec.ts` — passed (confirms no now-unused imports in the edited spec files).
- `pnpm verify --only format --files src/shared/ui/Button/index.ts tests/e2e/storybook/focusIndicator.spec.ts tests/e2e/visual/shared-ui/md-fab-family.spec.ts docs/testing/migration-plan.md` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/Button/index.ts` — skipped (empty focused unit-test scope; the barrel file has no colocated test, and no touched file requires a component-contract test since only exports/proof-file content changed, not runtime behavior).
- `pnpm verify --only storybook-build` — passed (confirms the Storybook catalogue builds cleanly after the legacy `MDFab.stories.ts` deletion).
- Real-browser execution of the edited `tests/e2e/storybook/focusIndicator.spec.ts` and `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` Playwright specs (`storybook-behavior`/`visual` verifier lanes) was not run in this sandboxed environment — those lanes require the project's podman-backed browser runner, which is outside this worker's sandbox. The edits are pure test-content deletions/renames of already-passing assertions (no assertion logic was added or changed), and `type-check`/`eslint`/`format`/`storybook-build` all pass, but the operator should run the podman-backed `pnpm verify --only storybook-behavior` and `pnpm verify --only visual` lanes (or the outer workflow's final gate) to directly confirm the surviving `MDExtendedFab`-only specs still execute and screenshot-match.

## Remaining blockers

None.

## Review readiness

Ready.
