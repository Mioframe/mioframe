# Checkbox migration

Artifact revision: 2026-08-13T06:51:14.000Z
Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
IMPLEMENTATION.md revision: 2026-08-13T06:47:59.000Z
Revision summary: Durable-continuation refresh required by `ARCHITECTURE.md`'s fresh `Artifact revision` (`2026-08-13T06:41:40.600Z`) and `IMPLEMENTATION.md`'s fresh `Artifact revision` (`2026-08-13T06:47:59.000Z`), both proof-ownership-only corrections that relocated the canonical family's visual proof from the legacy central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` to the owner-local `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` (colocated `MDCheckbox.visual.spec.ts-snapshots/`). This is an implementation-stage-owned file relocation, not a consumer migration — no consumer, legacy-owner, or product-scenario change was required or made by this pass. This fresh migration-stage worker independently re-read the current `ARCHITECTURE.md` and `IMPLEMENTATION.md` in full (not trusted from prior-pass prose) and independently confirmed the current filesystem state matches both: `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and its `...-snapshots/` directory are absent; `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` exists with a colocated `MDCheckbox.visual.spec.ts-snapshots/` directory containing all four baseline PNGs (`md-checkbox-states-linux.png`, `md-checkbox-hover-linux.png`, `md-checkbox-focus-linux.png`, `md-checkbox-pressed-linux.png`). This worker independently re-read all six consumer files listed in [Consumer inventory](#consumer-inventory) directly and confirmed each is byte-for-byte unchanged from the prior migration pass's record — none references the legacy central visual-spec location, none imports `@shared/ui/Checkbox`'s removed `MDCheckbox`, and the `BooleanValueInline.vue` `checked`/`indeterminate` translation remains exactly `convertedValue.value === true` / `property.value.indeterminate === true && convertedValue.value === undefined`, unchanged. Per `ARCHITECTURE.md`'s migration plan step 6, this pass also corrected `docs/testing/migration-plan.md`'s stale Stage S4-B trailing sentence (which incorrectly claimed the canonical family's visual proof "lives at the current central location... pending its own future Stage S4 authorization") and its "Still transitional" owner-local visual-pilot list (which did not yet name the canonical `checkbox` family), to instead record that the canonical Material `checkbox` family established its own owner-local visual ownership directly through its own Material family migration workflow, mirroring the Stage S4-D (MDSwitch) precedent — not through a separate S4 authorization step. Per `ARCHITECTURE.md`'s migration plan step 7, this pass also updated `docs/roadmap.md`'s Checkbox-specific status prose (mutable status text describing the visual-ownership gap as unresolved/pending correction) to reflect that the architecture/implementation correction and `docs/testing/migration-plan.md` correction are now complete, leaving only a fresh independent review as the remaining step. No production/runtime file, `MDCheckbox.vue`, any consumer `.vue` file, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `DESIGN.md`, or `REVIEW.md` was touched by this pass.

**Independent re-verification performed by this pass**, not trusted from the superseded artifact's prose:

- Read `ARCHITECTURE.md` (`Artifact revision: 2026-08-13T06:41:40.600Z`, `Status: ready`) and `IMPLEMENTATION.md` (`Artifact revision: 2026-08-13T06:47:59.000Z`, `Status: complete`, `Migration readiness: ready`) in full and confirmed both describe the same single substantive change versus the prior revisions: relocating the canonical family's visual proof to the owner-local location. Neither revised the public Vue API, tokens, renderer mapping, ownership, or the `BooleanValueInline.vue` translation formula.
- Directly confirmed via filesystem inspection: `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` does not exist; `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts-snapshots/` does not exist; `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` exists; `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts-snapshots/` exists and contains exactly the four expected baseline PNGs.
- Directly re-read all six consumer files and confirmed each matches the prior migration pass's record exactly, with no stray edit and no reference anywhere to the legacy central visual-spec path:
  - `src/widgets/SettingsSections/SettingsCheckboxListItem.vue` — `<MDCheckbox v-else presentation :checked="checked" :disabled="disabled" />`, unchanged.
  - `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` — `<MDCheckbox presentation :checked="viewId === effectiveViewId" />`, unchanged.
  - `src/features/relationValueEdit/RelationValueFieldData.vue` — `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`, unchanged; the pre-existing missing-accessible-name gap remains deliberately not fixed, per the recorded decision.
  - `src/shared/ui/Checkbox/MDCheckboxField.vue` — unchanged `checked = modelValue === true` / `showIndeterminate = !!props.indeterminate && modelValue === undefined` translation, `id`/`aria-label` host-attribute forwarding, and autofocus composition.
  - `src/entities/databaseBoolean/BooleanValueInline.vue` — unchanged `checked = convertedValue.value === true` / `indeterminate = property.value.indeterminate === true && convertedValue.value === undefined` translation, `presentation` prop, and externally-composed `MDPlainTooltip`.
  - `src/shared/ui/Lists/stories/MDListItemConsumerPatternsStory.vue` — unchanged Storybook-only fixture usage (`<MDCheckbox presentation :checked="checkboxChecked" />` and `<MDCheckbox presentation :checked="checkboxDisabledChecked" disabled />`).
- Grepped `MDCheckbox` across `src` and confirmed the same six consumers as the prior migration pass still reference it, with no consumer-count drift.
- Directly listed `src/shared/ui/Checkbox/` and confirmed it still contains only `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts` — no legacy `MDCheckbox.vue` reappeared.
- Read `docs/testing/migration-plan.md`'s full Stage S4-B section and "Still transitional" bullet, and `docs/roadmap.md`'s full "Current state" section, before editing, to keep both edits consistent in tone and structure with the existing Stage S4-D (MDSwitch) record.

Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Unchanged from the prior migration pass, independently re-confirmed by this pass's repository-wide search: six real consumers of the canonical `MDCheckbox`, matching `ARCHITECTURE.md`'s five confirmed scenarios plus one Storybook-only fixture `ARCHITECTURE.md`'s inventory does not name:

1. `src/widgets/SettingsSections/SettingsCheckboxListItem.vue` — decorative `presentation` composition inside an `MDListItem role="checkbox"` row (ARCHITECTURE.md scenario 3).
2. `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` — decorative `presentation` composition as a view-preset selection indicator inside a `DatabaseViewListEdit` row (ARCHITECTURE.md scenario 3).
3. `src/features/relationValueEdit/RelationValueFieldData.vue` — standalone editable checked-only multi-select action inside a database table row (ARCHITECTURE.md scenario 2).
4. `src/shared/ui/Checkbox/MDCheckboxField.vue` — the separate, non-Material shared-UI family that composes an external `<label :for="id">` with a checkbox and feeds four real downstream product consumers: `DatabaseBooleanPropertyEditSection.vue` (`src/features/databaseBooleanPropertyEdit`), `BooleanPropertySettingsSection.vue` (`src/entities/databaseBoolean`), and both `BooleanValueField.vue` files (`src/features/booleanValueEdit`, `src/entities/databaseBoolean`) (ARCHITECTURE.md scenario 1).
5. `src/entities/databaseBoolean/BooleanValueInline.vue` — decorative read-only table-cell value display (ARCHITECTURE.md scenario 4).
6. `src/shared/ui/Lists/stories/MDListItemConsumerPatternsStory.vue` — a Storybook-only `MDListItem` fixture, not confirmed product demand.

`MDCheckboxPlayground.vue` remains removed with no replacement, unchanged from the prior pass.

## Migrated consumers

All six consumers are unchanged from the prior migration pass, independently re-confirmed present and correct by this pass's direct source reads (see the revision summary and its independent re-verification list):

- **`SettingsCheckboxListItem.vue`**: `<MDCheckbox v-else presentation :checked="checked" :disabled="disabled" />`. Unchanged.
- **`DatabaseViewsSheet.vue`**: `<MDCheckbox presentation :checked="viewId === effectiveViewId" />`. Unchanged.
- **`RelationValueFieldData.vue`**: `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`. Unchanged. The pre-existing missing-accessible-name gap remains deliberately not fixed by this migration, per `ARCHITECTURE.md`'s recorded decision — this is an explicit out-of-scope follow-up, not touched by this pass.
- **`MDCheckboxField.vue`**: unchanged tri-state translation (`checked = modelValue === true`; `indeterminate = props.indeterminate && modelValue === undefined`), `aria-label` accessible-name backstop, `id` forwarding, and autofocus composition. Not touched by this pass.
- **`BooleanValueInline.vue`**: unchanged explicit local translation —

  ```ts
  const convertedValue = computed(() =>
    isBoolean(value.value) ? value.value : property.value.default,
  );

  const checked = computed(() => convertedValue.value === true);

  const indeterminate = computed(
    () => property.value.indeterminate === true && convertedValue.value === undefined,
  );
  ```

  `convertedValue`'s existing effective-value resolution (explicit value, falling back to `property.default`) is unchanged. The externally-composed `MDPlainTooltip` and the `presentation` prop usage are unchanged; the root `<span class="boolean-value-inline">` wrapper and its scoped style are unchanged. This mapping remains local and explicit inside `BooleanValueInline.vue`, matching `ARCHITECTURE.md`'s "this translation is owned by `BooleanValueInline.vue` itself... not by `MDCheckbox`" instruction. This translation is settled and correct; this pass did not reopen it.

- **`MDListItemConsumerPatternsStory.vue`**: unchanged Storybook-only fixture usage.

## Preserved scenarios and failure paths

Unchanged from the prior migration pass for all six consumers (Settings checkbox row, Database view preset selection, Relation multi-select action, Boolean property tri-state editing via `MDCheckboxField`, Boolean value read-only display via `BooleanValueInline`, Storybook `ConsumerPatterns` fixture) — independently re-confirmed by this pass to still describe the current, untouched code for every file. No user-facing scenario, entry point, interaction tier, or affordance changed. The read-only boolean value display continues to be fully non-interactive and hidden from the accessibility tree via `presentation`; the rendered value continues to match the legacy component's actual pre-migration behavior (an effective `true`/`false` value, including one resolved through `property.default`, always renders checked/unchecked and never mixed; only a fully-unresolved effective `undefined` value renders mixed, and only when the `indeterminate` capability flag is enabled). The bundled tooltip continues to appear on hover over the same visual area, unchanged.

This pass introduced no new scenario or failure path: the visual-proof relocation it is built on is a proof-location-only change with no effect on rendered behavior, confirmed by `IMPLEMENTATION.md`'s own record of a zero-diff visual verifier run against the moved baselines.

## Legacy ownership removed

Unchanged from the prior migration pass. The entire legacy `src/shared/ui/Checkbox` component (`MDCheckbox.vue` and its owner-local proof/stories/`MDCheckboxPlayground.vue`) remains removed with no compatibility alias, independently re-confirmed present-as-removed by this pass's direct filesystem listing (see the revision summary). `MDCheckboxField.vue`, `index.ts`, and `toggleBoolean.ts` correctly remain as the distinct non-Material family, untouched by this pass.

Separately, the canonical family's own legacy central visual-proof location — `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and its `...-snapshots/` directory — is confirmed removed by the implementation stage (`IMPLEMENTATION.md`) and independently re-confirmed absent by this pass's direct filesystem inspection. This is implementation-owned proof relocation, not a migration-stage legacy-owner removal, and required no migration-stage action; this pass's role was limited to confirming the current state and correcting `docs/testing/migration-plan.md`'s and `docs/roadmap.md`'s stale prose about it (see [Consumer and blast-radius proof](#consumer-and-blast-radius-proof)).

## Consumer and blast-radius proof

Unchanged for all six consumers — the prior migration pass's proof records (`SettingsCheckboxListItem.test.ts`, `SettingsSections.test.ts`, `MDCheckboxField.test.ts`, `BooleanValueInline.test.ts`, the `e2e` lane coverage) remain accurate because none of those files changed in this pass. `BooleanValueInline.test.ts`'s six boundary-combination coverage (effective `true`; effective `false`; unresolved `undefined`; `true`/`false` property-default fallback; capability flag enabled/disabled) remains the lowest faithful proof owner for that consumer-local translation, unaffected by this pass.

**Documentation corrections (new, this pass)**:

- `docs/testing/migration-plan.md`: corrected the Stage S4-B trailing sentence and the "Still transitional" owner-local visual-pilot bullet to record the canonical Material `checkbox` family's completed owner-local visual ownership (`src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts`, colocated `MDCheckbox.visual.spec.ts-snapshots/`), established directly through this family's own migration workflow mirroring the Stage S4-D (MDSwitch) precedent, rather than the prior stale claim that this proof still lived centrally pending a future Stage S4 authorization. No stage was renumbered and no new stage entry was created; the existing S4-B section is corrected in place as the architecture required.
- `docs/roadmap.md`: updated the Checkbox-specific "Current state" status prose and "Next operator action" list to reflect that the architecture/implementation visual-ownership correction and the `docs/testing/migration-plan.md` correction are complete, leaving only a fresh independent review, a fresh `pnpm verify`, the version bump, and ordinary merge gates as remaining steps. No unrelated section (Calibration result, Milestones, Known non-blocking follow-up) was changed.

No production, story, browser-spec, or visual-spec file was touched by this migration pass, so no new browser/visual/e2e obligation exists beyond the focused documentation checks below; the prior migration pass's `type-check` (full changed-path), `unit-tests`, `eslint`, `oxlint`, `format`, `storybook-build`, `visual`, and `e2e` results remain the last known-passing record for the files this pass did not touch. `IMPLEMENTATION.md`'s own focused `visual` verifier run (scoped to the new `MDCheckbox.visual.spec.ts` path) is the current proof that the relocation itself preserved pixel-identical coverage; this pass did not need to and did not rerun it, because no consumer, production, or spec file changed in this pass.

Focused proof run by this pass:

- `pnpm verify --only format --files src/shared/ui/material/components/checkbox/MIGRATION.md docs/testing/migration-plan.md src/shared/ui/material/docs/roadmap.md` — see [Stage verification](#stage-verification).

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only format --files src/shared/ui/material/components/checkbox/MIGRATION.md docs/testing/migration-plan.md src/shared/ui/material/docs/roadmap.md` — passed.

This pass touched only three Markdown documentation files (`MIGRATION.md`, `docs/testing/migration-plan.md`, `src/shared/ui/material/docs/roadmap.md`); no `.vue`, `.ts`, story, browser-spec, or visual-spec file changed, so no unit-tests, eslint, oxlint, type-check, storybook-behavior, visual, or e2e lane has files in scope for this pass. The remaining focused results recorded by the prior migration pass for `BooleanValueInline.vue`/`BooleanValueInline.test.ts` (type-check, unit-tests, eslint, oxlint, format) remain the last known-passing record for those unchanged files.

## Remaining blockers

None.

## Review readiness

Ready. This pass is a durable-continuation documentation refresh: it independently re-confirmed all six consumers remain correct and unchanged, independently re-confirmed the current filesystem state matches the fresh architecture/implementation visual-proof relocation, and corrected `docs/testing/migration-plan.md`'s and `docs/roadmap.md`'s stale prose about that relocation per `ARCHITECTURE.md`'s migration plan steps 6 and 7. No consumer, production, or spec file changed. `MIGRATION.md` no longer describes or accepts the old central visual-proof location anywhere in its own text. The independent review stage must run fresh against this revision plus the current `ARCHITECTURE.md`/`IMPLEMENTATION.md` revisions, since `REVIEW.md` predates all three.
