# Checkbox implementation

Artifact revision: 2026-08-13T06:47:59.000Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-13T06:41:40.600Z
Revision summary: Proof-relocation-only refresh required by `ARCHITECTURE.md`'s fresh `Artifact revision` (`2026-08-13T06:41:40.600Z`), which corrected pass 10, the TEST IMPACT visual-proof-owner entry, and the acceptance-criteria visual-baseline line to select the owner-local target `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` (colocated `MDCheckbox.visual.spec.ts-snapshots/`) instead of the legacy central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`. This fresh implementation-stage worker rehomed the existing canonical Checkbox family visual spec and baselines to the owner-local location, following the exact pattern already established by `src/shared/ui/material/components/switch/MDSwitch.visual.spec.ts`: created `components/checkbox/MDCheckbox.visual.spec.ts` with the identical test titles, story IDs, selectors, and screenshot assertions as the legacy spec, changing only the `openStory` import path from `../storybook` to the Switch-pattern relative path `../../../../../../tests/e2e/visual/storybook`; moved all four baseline PNGs byte-for-byte (verified by `md5sum` before deletion) into a new colocated `components/checkbox/MDCheckbox.visual.spec.ts-snapshots/` directory under their unchanged filenames (`md-checkbox-states-linux.png`, `md-checkbox-hover-linux.png`, `md-checkbox-focus-linux.png`, `md-checkbox-pressed-linux.png` — no rename was required because Playwright's default `snapshotPathTemplate`, unmodified in `playwright.visual.config.ts`, derives the snapshot directory from the spec file's own name and keeps the `toHaveScreenshot()` argument as the file stem); and deleted the legacy `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and its `...-snapshots/` directory entirely, leaving no compatibility re-export or duplicate spec. No production runtime file (`MDCheckbox.vue`, tokens, exports, `config/vueCustomElements.ts`) changed; no other Checkbox-owned proof file (`MDCheckbox.test.ts`, `MDCheckbox.testUtils.ts`, `MDCheckbox.browser.spec.ts`, `MDCheckbox.stories.ts`) changed. `tsconfig.app.json`, `tsconfig.storybook.json`, and `tsconfig.node.json` already exclude/include `src/**/*.visual.spec.ts` by pattern (confirmed by direct inspection), so no per-file TypeScript-config edit was needed. `playwright.visual.config.ts`'s `testMatch` already includes `src/**/*.visual.spec.ts` alongside the legacy `tests/e2e/visual/**/*.spec.ts` glob (mixed discovery), so no resolver, registry, or config change was needed to make the relocated spec discoverable — confirmed by running the focused `visual` verifier against the new path, which found and passed all four tests with zero baseline diff.

Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All of `ARCHITECTURE.md`'s "Implementation passes" #1–#9 and #11 remain implemented unchanged from the prior `IMPLEMENTATION.md` revision (`2026-08-12T20:09:02.171Z`), independently re-confirmed present during this pass by direct file inspection: adapter creation, host-attribute boundary, tri-state controlled mapping, click/Space/Enter browser proof, adjacent-label browser proof and `M3E-005` accessible-name evidence, the presentation composition fixture, component-contract proof, the `ElementInternals` test-support seam, and stories. Only pass 10 changed in this revision:

10. **Visual proof relocated to the owner-local location.** `components/checkbox/MDCheckbox.visual.spec.ts` (new, colocated) replaces the legacy `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` (deleted), following the `<Owner>.visual.spec.ts` / `<Owner>.visual.spec.ts-snapshots/` convention already established by Loading Indicator, Chips, MarkdownContent, and Switch. The relocated spec preserves, unchanged in meaning, every test from the legacy spec:
    - `MDCheckbox unselected, selected, indeterminate, disabled, and presentation states match the canonical baseline` — story `material-3-components-checkbox-mdcheckbox--visual-states`, `visual-md-checkbox-states` surface, `md-checkbox-states.png`.
    - `MDCheckbox renders visible renderer-owned hover feedback on real pointer hover` — story `material-3-components-checkbox-mdcheckbox--real-interaction-feedback`, `visual-md-checkbox-real-interaction` surface, real `.hover()`, `md-checkbox-hover.png`.
    - `MDCheckbox renders visible renderer-owned focus feedback on real keyboard focus` — same story/surface, real `Tab` keypress, `md-checkbox-focus.png`.
    - `MDCheckbox renders a visible settled state layer on real pointer press` — same story/surface, real `mouse.down()`/`mouse.up()`, `md-checkbox-pressed.png`.

    All four baseline PNGs moved byte-for-byte (checksums verified identical before the legacy files were deleted) into the new colocated `MDCheckbox.visual.spec.ts-snapshots/` directory under unchanged filenames. Coverage confirmed intact both before and after the move: unselected/selected/indeterminate/disabled/presentation states (first test); hover feedback (second test); focus feedback (third test); pressed feedback (fourth test) — matching `ARCHITECTURE.md`'s "TEST IMPACT" visual-proof-owner entry and "Acceptance criteria" visual-baseline line exactly.

## Public API implemented

Unchanged from the prior revision; this pass touched no production/runtime file:

- Canonical export: `MDCheckbox` from `@shared/ui/material`.
- Props: `checked` (`boolean`, default `false`, controlled one-directionally via `update:checked`); `indeterminate` (`boolean`, default `false`, controlled one-directionally via `update:indeterminate`, always resolves to `false` on a real user activation); `disabled` (`boolean`, default `false`); `presentation` (`boolean`, default `false`, Mioframe composition extension).
- Slots: none.
- Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`, fired together from the renderer's cancelable `beforeinput` intent, computed pre-mutation. Never fired while `presentation` is true; never reachable while `disabled` is true.
- Root: one semantic `m3e-checkbox`; no wrapper element; no `defineExpose`.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby` reach the host.

## Tokens and renderer mappings

Unchanged: no `components/checkbox/tokens.css` file and no `docs/token-api.md` change. This pass added no token and changed no renderer mapping. See the prior revision's full mapping table (`ARCHITECTURE.md`'s "Renderer mapping and gaps"), independently re-confirmed still accurate by this worker reading `MDCheckbox.vue` and `m3eCheckbox.d.ts` unchanged.

## Dependencies

Unchanged:

- Material foundation: supplies the `--md-sys-color-*` roles the renderer consumes directly; not an official component-family dependency.
- `@m3e/web@2.6.3` (`@m3e/web/checkbox`): private renderer boundary; `M3eCheckboxElement` provides package-derived glue for `checked`/`indeterminate`/`disabled` typing and the `instanceof` runtime-narrowing target for the `beforeinput` handler.
- Dependency queue: none.

## Component-owned proof

- `MDCheckbox.test.ts` (owner-local component-contract proof) — unchanged, present.
- `MDCheckbox.testUtils.ts` (family-local `ElementInternals` construction-support shim) — unchanged, present.
- `MDCheckbox.browser.spec.ts` (owner-local browser proof) — unchanged, present.
- `MDCheckbox.stories.ts` (owner-local stories) — unchanged, present.
- `MDCheckbox.visual.spec.ts` (owner-local visual proof, **new location this pass**) with colocated `MDCheckbox.visual.spec.ts-snapshots/` (four baseline PNGs, moved byte-for-byte this pass). Replaces the deleted `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and its `...-snapshots/` directory — both confirmed absent after deletion.
- `eslint.config.test.ts` line 102: `m3e-checkbox` covered by the renderer-boundary-rule test alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch` — unchanged.
- `docs/m3e-defects.md`: complete `M3E-005` entry — unchanged.

Operator visual status: no-reported-defect. The relocated spec's focused `visual` verifier run reproduced all four baselines with zero diff, confirming the move did not silently regenerate or alter coverage.

## Stage verification

Focused verifier-managed checks run this pass, all against the exact changed/created file (`src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts`) or project-wide type surface:

- `pnpm verify --only format --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed.
- `pnpm verify --only eslint --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed.
- `pnpm verify --only type-check` — passed (project-wide gate; no type error introduced).
- `pnpm verify --only visual --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed. The verifier's automatic planner recognized the colocated visual spec by its filesystem-derived convention (`trigger: changed colocated visual spec ... -> ...`, no manual registry entry required) and ran `pnpm test:visual` scoped to the new path; all four tests passed against the moved baselines with zero screenshot diff, confirming the relocation preserved pixel-identical coverage.

No other lane (unit-tests, storybook-behavior, e2e, mutation) has files in scope for this proof-relocation-only pass: no `.test.ts`/`.browser.spec.ts`/consumer/product file changed. This pass did not run the project-wide final completion gate (`pnpm verify`); that is the orchestrator's responsibility after all Material stages complete, per `src/shared/ui/material/AGENTS.md`.

## Architecture deviations

None. The relocated spec preserves the legacy spec's test titles, story IDs, selectors, and screenshot assertions unchanged in meaning; only the `openStory` import-path mechanics changed, matching the Switch precedent exactly. No new resolver, registry, generic Material visual-testing framework, or per-file TypeScript-config change was introduced or needed — `tsconfig.app.json`/`tsconfig.storybook.json`/`tsconfig.node.json`'s existing `src/**/*.visual.spec.ts` pattern rules and `playwright.visual.config.ts`'s existing mixed `testMatch` glob already cover the new path.

## Remaining blockers

None.

## Migration readiness

Ready. The canonical family's visual proof now lives entirely at the owner-local location required by the current architecture revision, with zero unresolved architecture deviation. The migration stage must, per `ARCHITECTURE.md`'s migration plan step 6, correct `docs/testing/migration-plan.md`'s stale Stage S4-B trailing sentence (which still claims the canonical family's visual proof "lives at the current central location... pending its own future Stage S4 authorization") to record the owner-local visual ownership completed here — this implementation-stage worker did not touch `docs/testing/migration-plan.md`, `REVIEW.md`, or `roadmap.md`, as those updates belong to the migration and review stages, not implementation.
