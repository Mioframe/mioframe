# Floating action button migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/floatingActionButton/IMPLEMENTATION.md`
Revision summary: Fresh migration pass over the current `ARCHITECTURE.md`/`IMPLEMENTATION.md`. Independently re-ran every reconfirmation step in `ARCHITECTURE.md`'s "Migration plan" from scratch rather than trusting the prior `MIGRATION.md`: no product consumer of the plain `MDFab` exists anywhere in `src`; the legacy `src/shared/ui/Button/MDFab.vue`/`.test.ts`/`.stories.ts` remain deleted with no barrel export; the two cross-owner legacy-proof files (`tests/e2e/storybook/focusIndicator.spec.ts`, `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`) and the `docs/testing/migration-plan.md` S2-D historical notes remain accurate with no reintroduced legacy-`MDFab` reference; `RepoExplorerPane.vue`'s Extended FAB scenario is unchanged. No new drift was found. No production, consumer, or legacy-proof edit was required this pass.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Independently repeated the architecture-stage grep this pass (not trusting the prior `MIGRATION.md`'s record) across `src` for `MDFab`:

- Fresh `grep -rln "MDFab" src` finds only this family's own files (`MDFab.vue`, `MDFab.test.ts`, `MDFab.browser.spec.ts`, `MDFab.visual.spec.ts`, `MDFab.stories.ts`, `index.ts`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`), the root `src/shared/ui/material/index.ts` barrel re-export, and two illustrative doc-comment mentions in `src/shared/ui/Button/FabContainer.vue`/`FabContainer.stories.ts` ("`MDFab` or `MDExtendedFab`" as example slot content — not an import).
- A targeted `grep -rln "MDFab" src/pages src/widgets src/features src/entities` returns zero matches: no product-layer consumer of the plain FAB exists.
- Direct read of `src/pages/RepoExplorer/RepoExplorerPane.vue` (line 14, lines 194–196) confirms it imports and renders only `FabContainer`/`MDExtendedFab` from `@shared/ui/Button` — the separate, out-of-scope Extended FAB family — not the canonical `MDFab`.
- `src/shared/ui/Button/index.ts` no longer exports `MDFab`; the legacy `src/shared/ui/Button/MDFab.vue`/`.test.ts`/`.stories.ts` files remain absent (`find`/`ls` confirms only `MDSegmentedButtons.vue`, `MDExtendedFab.vue`, `MDIconButtonToolbarVisualStory.vue`, `MDIconButton.vue`, `FabContainer.vue`, `MDIconButton.stories.ts`, `MDIconButtonTargetHitVisualStory.vue`, `LegacyButton.browser.spec.ts`, `FabContainer.stories.ts`, `index.ts`, `MDIconButtonToolbarInteractionStory.vue`, `MDExtendedFab.test.ts`, `MDExtendedFab.stories.ts`, `FabContainer.test.ts`, `MDIconButton.test.ts`).
- Fresh `grep -rln "MDFab" tests` returns zero matches: no remaining test-suite reference anywhere under `tests/`.

Consumer inventory: none (canonical `MDFab` has zero current product consumers; the selected default remains the approved library-only scenario per `ARCHITECTURE.md`).

## Migrated consumers

Migrated consumers: none. No product consumer exists to migrate onto the canonical `MDFab` this pass, matching `ARCHITECTURE.md`'s explicit no-consumer scenario. Fabricating one would violate the migration skill's "Forbidden" list.

## Preserved scenarios and failure paths

- `RepoExplorerPane.vue`'s current Extended FAB scenario (add action inside `FabContainer`, `MDExtendedFab` with `label="Add"` / `md-symbol="add"`, `@click="onClickAdd"`) is unchanged — reconfirmed this pass by direct inspection of `src/pages/RepoExplorer/RepoExplorerPane.vue`; this migration pass touched neither the file nor any of its imports.
- `FabContainer.vue`'s placement/visibility/auto-hide behavior is unchanged — the file was not touched.
- Legacy `MDExtendedFab` (`src/shared/ui/Button/MDExtendedFab.vue`) and all its proof (`MDExtendedFab.test.ts`, `MDExtendedFab.stories.ts`, the `MDExtendedFab` portions of `focusIndicator.spec.ts` and `md-fab-family.spec.ts`) are unchanged — out of this family's scope per `ARCHITECTURE.md`'s "Non-goals" and "Forbidden" sections; reconfirmed this pass by direct read of both files' surviving test lists (see "Legacy ownership removed").
- No failure-path changes: the legacy plain `MDFab` remains absent with zero rendered product instances, so there is no user-facing behavior, error state, or accessibility contract to preserve or regress this pass.

## Legacy ownership removed

The legacy plain `MDFab` and its proof were already removed by the prior migration pass. This pass independently reconfirmed, rather than repeated, that removal and its blast radius — no new legacy ownership was found or removed this pass:

1. **Legacy component and its own proof**: `src/shared/ui/Button/MDFab.vue`, `MDFab.test.ts`, and `MDFab.stories.ts` remain deleted; `src/shared/ui/Button/index.ts` still has no `MDFab` export line — reconfirmed by direct `find`/`Read` this pass.
2. **`docs/testing/migration-plan.md`'s Stage S2-D historical record**: reconfirmed by direct grep (`MDFab`, `S2-D`) that both historical notes (line 227's S2-D inventory entry and line 254's S2-D migration-group entry) remain present, accurate, and unchanged — both correctly state the legacy plain `MDFab` no longer exists and point to this family's `MIGRATION.md`, with no dangling reference to a deleted component.
3. **Cross-owner legacy-proof consumers removed by the prior migration pass**: reconfirmed by direct grep/read this pass that no stale legacy-`MDFab`-shaped assertion has been reintroduced:
   - `tests/e2e/storybook/focusIndicator.spec.ts` — fresh grep finds zero `MDFab` matches; the file's three surviving focus-indicator tests are `MDButton`, `MDIconButton`, and `MDExtendedFab` only.
   - `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` — fresh grep finds zero `MDFab` matches; all thirteen surviving `test(` blocks and the `EXTENDED_FAB_TOKEN_MATRIX` fixture belong exclusively to the `MDExtendedFab` suite; the snapshots directory (`tests/e2e/visual/shared-ui/md-fab-family.spec.ts-snapshots/`) contains exactly the two `MDExtendedFab` baseline PNGs (`md-extended-fab-states-linux.png`, `md-extended-fab-interaction-states-linux.png`) and no orphaned legacy-`MDFab` baseline.

No compatibility alias exists or was added for the removed legacy `MDFab` — it had zero product consumers, so none is warranted per the migration skill's rule against keeping replaced logic to reduce work.

## Consumer and blast-radius proof

No product consumer exists to translate, so no legacy-to-canonical state-translation table applies this pass either (the canonical `MDFab` has no prior or current consumer whose props/state require a translation formula). Blast-radius proof this pass instead reconfirms the legacy-removal's continued stability:

- **Whole-project `type-check`**: rerun this pass (see "Stage verification") — passes, confirming no remaining import references the deleted legacy `MDFab.vue`/export and that the canonical `MDFab.vue`, its exports, and the root `@shared/ui/material` barrel still compile cleanly.
- **`src/shared/ui/Button/index.ts` barrel**: reconfirmed by direct read this pass — exports exactly `FabContainer`, `MDExtendedFab`, `MDIconButton`; no `MDFab` line.
- **`tests/e2e/storybook/focusIndicator.spec.ts`** and **`tests/e2e/visual/shared-ui/md-fab-family.spec.ts`**: reconfirmed by direct grep/read this pass that every surviving test/fixture belongs to `MDButton`/`MDIconButton`/`MDExtendedFab`, with zero legacy-`MDFab` content reintroduced.
- **`RepoExplorerPane.vue` Extended FAB scenario**: reconfirmed unaffected by direct inspection this pass — the file, its imports, and its template were not touched by this or any prior migration edit.
- **Canonical family proof**: `MDFab.test.ts` (12 tests), `MDFab.browser.spec.ts` (3 tests), `MDFab.visual.spec.ts` (4 tests), and `MDFab.stories.ts` (5 exports) were reconfirmed present and unchanged by `IMPLEMENTATION.md`'s own fresh pass this invocation; migration does not duplicate that already-current family-owned proof.

## Stage verification

- `pnpm verify --only type-check` — passed (whole-project scope; reconfirms no remaining import references the deleted legacy `MDFab.vue`/export and that the canonical family, its barrel, and every touched-by-history proof file still compile).
- Fresh `grep -rln "MDFab" src`, `grep -rln "MDFab" src/pages src/widgets src/features src/entities`, `grep -rln "MDFab" tests`, and `grep -n "MDFab" tests/e2e/storybook/focusIndicator.spec.ts tests/e2e/visual/shared-ui/md-fab-family.spec.ts` — run this pass as the migration-owned consumer/legacy-removal reconfirmation; all return exactly the expected zero/family-only results recorded above.
- No production, consumer, or legacy-proof file was edited this pass, so no `eslint`/`format`/`unit-tests`/`storybook-behavior`/`visual`/`storybook-build` rerun was required for migration's own scope; those lanes were already exercised by this invocation's fresh `IMPLEMENTATION.md` pass (type-check, unit-tests 12/12) and by the prior migration's now-reconfirmed edits (eslint, format, storybook-build — unchanged since, per the reconfirmation above).
- The podman-backed `storybook-behavior` (`focusIndicator.spec.ts`) and `visual` (`md-fab-family.spec.ts`) Playwright lanes were not re-executed in this sandbox: this environment cannot run podman-backed browser/visual verify commands. No content in either file changed this pass (reconfirmed by grep/read above), so there is nothing new for those lanes to re-prove beyond what `REVIEW.md` already recorded as an accepted, CI-covered risk for the prior migration's edits to these same two files. This is recorded honestly as "not run in this sandbox," not as "passed."

## Remaining blockers

None.

## Review readiness

Ready.
