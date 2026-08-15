# Floating action button migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/floatingActionButton/IMPLEMENTATION.md`
Revision summary: Fresh, independent migration pass over the current `ARCHITECTURE.md` (Status ready, Renderer revision `@m3e/web@2.7.4`, Implementation readiness ready, Dependency queue none) and the current `IMPLEMENTATION.md` (Status complete, Migration readiness ready, Architecture deviations none — this pass added a new `GeometryContract` story to `MDFab.stories.ts` and a new numeric-dimension browser test to `MDFab.browser.spec.ts` asserting the rendered `m3e-fab` host `boundingBox()` at `{width:80,height:80}` and the slotted icon `boundingBox()` at `{width:28,height:28}`, with no other production edit). This pass independently re-ran every consumer/legacy-removal reconfirmation step from scratch rather than trusting any prior `MIGRATION.md` prose: a fresh repository-wide grep for `MDFab` finds no consumer under `src/pages`, `src/widgets`, `src/features`, or `src/entities`, and no reference anywhere under `tests/`; the only non-family hits are two illustrative doc-comment mentions ("a single `MDFab` or `MDExtendedFab` action") in `src/shared/ui/Button/FabContainer.vue` and `FabContainer.stories.ts`, not imports; a direct read of `src/pages/RepoExplorer/RepoExplorerPane.vue` confirms it imports and renders only `FabContainer`/`MDExtendedFab` from `@shared/ui/Button`, not the canonical `MDFab`; the legacy plain `src/shared/ui/Button/MDFab.vue`/`.test.ts`/`.stories.ts` remain absent with no barrel export line in `src/shared/ui/Button/index.ts`; the two cross-owner legacy-proof files (`tests/e2e/storybook/focusIndicator.spec.ts`, `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`) contain zero `MDFab` matches, with `md-fab-family.spec.ts`'s snapshot directory holding only the two `MDExtendedFab` baselines; `docs/testing/migration-plan.md`'s S2-D/S2 historical notes remain accurate and unchanged. No drift was found. No production, consumer, or legacy-proof edit was required this pass.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Independently repeated this pass, not trusting any prior `MIGRATION.md` record:

- `grep -rln "MDFab" src` returns only this family's own files (`MDFab.vue`, `MDFab.test.ts`, `MDFab.browser.spec.ts`, `MDFab.visual.spec.ts`, `MDFab.stories.ts`, `index.ts`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`), the root `src/shared/ui/material/index.ts` barrel re-export, and two illustrative doc-comment mentions — `src/shared/ui/Button/FabContainer.vue` line 22 and `FabContainer.stories.ts` lines 54/58 ("a single `MDFab` or `MDExtendedFab` action" as example slot content, not an import).
- A targeted `grep -rln "MDFab" src/pages src/widgets src/features src/entities` returns zero matches: no product-layer consumer of the plain FAB exists.
- Direct read of `src/pages/RepoExplorer/RepoExplorerPane.vue` confirms it imports `FabContainer, MDExtendedFab` from `@shared/ui/Button` (line 14) and renders `<FabContainer auto-hide><MDExtendedFab label="Add" md-symbol="add" @click="onClickAdd" /></FabContainer>` (lines 194–196) — the separate, out-of-scope Extended FAB family, not the canonical `MDFab`.
- `src/shared/ui/Button/index.ts` exports exactly `FabContainer`, `MDExtendedFab`, `MDIconButton` (plus a commented-out `MDSegmentedButtons` line); no `MDFab` export line.
- `grep -rln "MDFab" tests` returns zero matches: no remaining test-suite reference anywhere under `tests/`.

Consumer inventory: none (the canonical `MDFab` has zero current product consumers; the selected default remains the approved library-only scenario per `ARCHITECTURE.md`).

## Migrated consumers

Migrated consumers: none. No product consumer exists to migrate onto the canonical `MDFab` this pass, matching `ARCHITECTURE.md`'s explicit no-consumer scenario. Fabricating one would violate this stage's "Forbidden" list.

## Preserved scenarios and failure paths

- `RepoExplorerPane.vue`'s current Extended FAB scenario (add action inside `FabContainer`, `MDExtendedFab` with `label="Add"` / `md-symbol="add"`, `@click="onClickAdd"`) is unchanged — reconfirmed this pass by direct inspection; this migration pass touched neither the file nor any of its imports.
- `FabContainer.vue`'s placement/visibility/auto-hide behavior is unchanged — the file was not touched (only inspected for its illustrative `MDFab` doc-comment mention).
- Legacy `MDExtendedFab` (`src/shared/ui/Button/MDExtendedFab.vue`) and all its proof are unchanged — out of this family's scope per `ARCHITECTURE.md`'s "Non-goals" and "Forbidden" sections.
- No failure-path changes: the legacy plain `MDFab` remains absent with zero rendered product instances, so there is no user-facing behavior, error state, or accessibility contract to preserve or regress this pass.

## Legacy ownership removed

The legacy plain `MDFab` and its proof were removed by an earlier migration pass. This pass independently reconfirmed, rather than repeated, that removal and its blast radius — no new legacy ownership was found or removed this pass:

1. **Legacy component and its own proof**: `src/shared/ui/Button/MDFab.vue`, `MDFab.test.ts`, and `MDFab.stories.ts` remain deleted (confirmed by directory listing this pass); `src/shared/ui/Button/index.ts` still has no `MDFab` export line.
2. **`docs/testing/migration-plan.md`'s S2 historical record**: reconfirmed by direct grep this pass — both historical notes (the S2-A/B/C/D/E inventory entry and the S2-D migration-group entry) remain present, accurate, and unchanged; both correctly state the legacy plain `MDFab` no longer exists and point to this family's `MIGRATION.md`.
3. **Cross-owner legacy-proof consumers removed by an earlier migration pass**: reconfirmed by direct grep this pass — `tests/e2e/storybook/focusIndicator.spec.ts` and `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` contain zero `MDFab` matches; the visual spec's snapshot directory contains exactly the two `MDExtendedFab` baselines (`md-extended-fab-states-linux.png`, `md-extended-fab-interaction-states-linux.png`) and no orphaned legacy-`MDFab` baseline.

No compatibility alias exists or was added for the removed legacy `MDFab` — it had zero product consumers, so none is warranted.

## Consumer and blast-radius proof

No product consumer exists to translate, so no legacy-to-canonical state-translation table applies this pass either. Blast-radius proof this pass reconfirms the legacy-removal's continued stability and the new implementation-stage geometry proof's compilation/lint validity:

- **Whole-project `type-check`**: rerun this pass (see "Stage verification") — passed, confirming no remaining import references the deleted legacy `MDFab.vue`/export, that the canonical `MDFab.vue` and its exports still compile cleanly, and that this pass's implementation-stage `GeometryContract` story/browser test additions type-check cleanly.
- **`src/shared/ui/Button/index.ts` barrel**: reconfirmed by direct read this pass — exports exactly `FabContainer`, `MDExtendedFab`, `MDIconButton`; no `MDFab` line.
- **`tests/e2e/storybook/focusIndicator.spec.ts`** and **`tests/e2e/visual/shared-ui/md-fab-family.spec.ts`**: reconfirmed by direct grep this pass — zero legacy-`MDFab` content reintroduced.
- **`RepoExplorerPane.vue` Extended FAB scenario**: reconfirmed unaffected by direct inspection this pass — the file, its imports, and its template were not touched by this or any prior migration edit.
- **Canonical family proof**: `MDFab.test.ts` (12 tests), `MDFab.browser.spec.ts` (4 tests, including this invocation's new geometry test), `MDFab.visual.spec.ts` (4 tests), and `MDFab.stories.ts` (6 exports, including the new `GeometryContract`) were reconfirmed present per the current `IMPLEMENTATION.md`; migration does not duplicate that already-current family-owned proof.

## Stage verification

- `pnpm verify --only type-check` — passed this pass (whole-project scope; confirms no remaining import references the deleted legacy `MDFab.vue`/export and that the canonical family, its barrel, and every touched-by-history proof file, including this invocation's implementation-stage `GeometryContract`/browser-test additions, still compile).
- Fresh `grep -rln "MDFab" src`, `grep -rln "MDFab" src/pages src/widgets src/features src/entities`, `grep -rln "MDFab" tests`, and `grep -n "MDFab" tests/e2e/storybook/focusIndicator.spec.ts tests/e2e/visual/shared-ui/md-fab-family.spec.ts docs/testing/migration-plan.md` — run this pass as the migration-owned consumer/legacy-removal reconfirmation; all return exactly the expected zero/family-only/historical-note-only results recorded above.
- No production, consumer, or legacy-proof file was edited this pass, so no `eslint`/`format`/`unit-tests`/`storybook-behavior`/`visual`/`storybook-build` rerun was required for migration's own scope; those lanes were already exercised by this invocation's fresh `IMPLEMENTATION.md` pass for the changed `MDFab.stories.ts`/`MDFab.browser.spec.ts` files.
- The podman-backed `storybook-behavior` (`focusIndicator.spec.ts`) and `visual` (`md-fab-family.spec.ts`) Playwright lanes were not executed in this sandbox: this environment cannot run podman-backed browser/visual verify commands. No content in either file changed this pass (reconfirmed by grep above), so there is nothing new for those lanes to re-prove for this family's migration scope. This is recorded honestly as "not run in this sandbox," not as "passed." The new geometry browser test's own real-browser execution belongs to `IMPLEMENTATION.md`'s stage verification and to exact-head CI, not to this migration pass.

## Remaining blockers

None.

## Review readiness

Ready.
