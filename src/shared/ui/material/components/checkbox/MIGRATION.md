# Checkbox migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
Revision summary: Fresh, independent migration pass per `material-component-migration`, run against current `ARCHITECTURE.md` (`Status: ready`) and current `IMPLEMENTATION.md` (`Status: complete`, `Migration readiness: ready`), both freshly re-derived this invocation with no production edit needed. This pass independently re-derived the consumer inventory by grepping `MDCheckbox` across `src` from scratch (not trusted from the superseded `MIGRATION.md`'s prose) and read every matching consumer directly. All six real consumers — `SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`, `RelationValueFieldData.vue`, `MDCheckboxField.vue`, `BooleanValueInline.vue`, and the Storybook-only `MDListItemConsumerPatternsStory.vue` — already compose the canonical `MDCheckbox` from `@shared/ui/material` exactly per current `ARCHITECTURE.md`'s four confirmed scenarios and required legacy-to-canonical translations. The legacy `src/shared/ui/Checkbox/MDCheckbox.vue` remains confirmed absent (directory listing shows only `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts`). `m3e-checkbox` remains registered in `config/vueCustomElements.ts`, and `MDCheckbox` remains exported from the root `@shared/ui/material` barrel. No consumer, legacy-owner, or product-scenario defect was found, so no production, story, browser-spec, or visual-spec file was edited by this pass. `docs/testing/migration-plan.md`'s Stage S4-B section and "Still transitional" list, and `docs/roadmap.md`'s Checkbox status text, were independently re-read in full and confirmed already accurate for the current filesystem state (owner-local visual proof at `components/checkbox/MDCheckbox.visual.spec.ts`, legacy central `md-checkbox-family.spec.ts` absent, `roadmap.md`'s `blocked` status correctly reflecting that independent review has not yet run fresh against this invocation's architecture/implementation/migration revisions) — neither required a correction by this pass. This revision drops the legacy `Artifact revision`/`IMPLEMENTATION.md revision` timestamp fields the simplified workflow no longer defines as control fields. Final-verifier routing (post-review) found the outer `pnpm verify` `format` check failing solely on this stage's own `docs/roadmap.md` table-column whitespace-alignment edit (`Milestones` table cell padding drifted after prose edits, no content change); this was a formatting-only defect in a file this stage owns, corrected directly with `pnpm verify --fix-only --files src/shared/ui/material/docs/roadmap.md`, and reconfirmed passing with `pnpm verify --only format --files src/shared/ui/material/docs/roadmap.md`.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Independently re-derived this pass via `grep -rln "MDCheckbox" src` followed by a direct read of every match. Six real consumers of the canonical `MDCheckbox`, matching `ARCHITECTURE.md`'s four confirmed scenarios plus one Storybook-only fixture:

1. `src/widgets/SettingsSections/SettingsCheckboxListItem.vue` — decorative `presentation` composition inside an `MDListItem mode="single-action" role="checkbox"` row (ARCHITECTURE.md scenario 3).
2. `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` — decorative `presentation` composition as a view-preset selection indicator inside a `DatabaseViewListEdit` row's `leading` slot (ARCHITECTURE.md scenario 3).
3. `src/features/relationValueEdit/RelationValueFieldData.vue` — standalone editable checked-only multi-select action inside a `DatabaseDataTable`'s `action` slot (ARCHITECTURE.md scenario 2).
4. `src/shared/ui/Checkbox/MDCheckboxField.vue` — the separate, non-Material shared-UI family that composes an external `<label :for="id">` with a checkbox and feeds four real downstream product consumers, none of which reference `MDCheckbox` directly: `DatabaseBooleanPropertyEditSection.vue` (`src/features/databaseBooleanPropertyEdit`), `BooleanPropertySettingsSection.vue` (`src/entities/databaseBoolean`), and both `BooleanValueField.vue` files (`src/features/booleanValueEdit`, `src/entities/databaseBoolean`) — each imports and renders only `MDCheckboxField` from `@shared/ui/Checkbox` (ARCHITECTURE.md scenario 1, confirmed by independently grepping `MDCheckbox` in all four files and finding only the `MDCheckboxField` identifier).
5. `src/entities/databaseBoolean/BooleanValueInline.vue` — decorative read-only table-cell value display, `presentation` (ARCHITECTURE.md scenario 4).
6. `src/shared/ui/Lists/stories/MDListItemConsumerPatternsStory.vue` — a Storybook-only `MDListItem` fixture, not confirmed product demand; not named in `ARCHITECTURE.md`'s scenario list.

`MDCheckboxPlayground.vue` remains removed with no replacement (confirmed absent from `src/shared/ui/Checkbox/`).

No stray, untracked, or newly introduced consumer was found. No consumer count drift versus `ARCHITECTURE.md`'s "Current scenarios" and "Migration plan" sections.

## Migrated consumers

All six consumers independently re-read this pass and confirmed to already correctly compose the canonical `MDCheckbox` per current `ARCHITECTURE.md`. No production edit was required or made.

- **`SettingsCheckboxListItem.vue`**: `<MDCheckbox v-else presentation :checked="checked" :disabled="disabled" />` inside `MDListItem`'s `trailing` slot. `MDListItem` owns the `checkbox` ARIA role, `aria-checked`, and the click-driven `@action` toggle; `MDCheckbox` only reflects `checked`/`disabled`, matching `ARCHITECTURE.md`'s "Ownership" section.
- **`DatabaseViewsSheet.vue`**: `<MDCheckbox presentation :checked="viewId === effectiveViewId" />` inside `DatabaseViewListEdit`'s `leading` slot. The row's own click handling (`@click-view="onSelectViewPreset"`) owns the real selection; `MDCheckbox` only reflects the derived boolean.
- **`RelationValueFieldData.vue`**: `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`. Standalone editable, checked-only, no `indeterminate`. Confirmed no `aria-label`/`aria-labelledby` is supplied — this is the pre-existing accessible-name gap `ARCHITECTURE.md`'s "Risks" section explicitly records as a deliberate, not-silently-perpetuated, out-of-scope product follow-up (also recorded in `docs/roadmap.md`'s "Known non-blocking follow-up"). This migration pass did not add one, matching that recorded decision — silently "fixing" it here would itself be an undocumented behavior change.
- **`MDCheckboxField.vue`**: composes canonical `MDCheckbox` internally with the required tri-state translation — `checked = computed(() => modelValue.value === true)`; `showIndeterminate = computed(() => !!props.indeterminate && modelValue.value === undefined)` — and forwards `id` (native `<label :for="id">` association) plus `aria-label: props.label` (the confirmed-working accessible-name backstop for the `M3E-005` native-label-association gap) via `v-bind="hostAttrs"`. `onActivate` uses `update:checked` only as a one-per-activation trigger and calls the field's own `toggleBoolean` cycling logic rather than writing the renderer-derived value back directly — this is `MDCheckboxField`'s own tri-state cycle ownership, unrelated to `MDCheckbox`'s one-directional controlled-state contract. Autofocus is applied via a template ref watcher, consistent with `ARCHITECTURE.md`'s host-attribute boundary (no raw `$attrs` spread; explicit typed props only).
- **`BooleanValueInline.vue`**: `<MDCheckbox presentation :checked="checked" :indeterminate="indeterminate" />` plus an externally-composed `<MDPlainTooltip :text="name" />`. Explicit local translation, independently re-read this pass:

  ```ts
  const convertedValue = computed(() =>
    isBoolean(value.value) ? value.value : property.value.default,
  );

  const checked = computed(() => convertedValue.value === true);

  const indeterminate = computed(
    () => property.value.indeterminate === true && convertedValue.value === undefined,
  );
  ```

  This is the required legacy-to-canonical translation from `ARCHITECTURE.md`'s "Current scenarios" scenario 4 and "Migration plan" step 5: `property.indeterminate` is a **capability/configuration flag** (only permits the effective value to remain `undefined`), not the canonical `MDCheckbox.indeterminate` prop's **current rendered mixed state**. See [Preserved scenarios and failure paths](#preserved-scenarios-and-failure-paths) for the boundary-combination proof this distinction requires.

- **`MDListItemConsumerPatternsStory.vue`**: Storybook-only fixture, `<MDCheckbox presentation :checked="checkboxChecked" />` and `<MDCheckbox presentation :checked="checkboxDisabledChecked" disabled />`, unchanged.

## Preserved scenarios and failure paths

No user-facing scenario, entry point, interaction tier, or affordance changed by this pass, because no consumer file was edited. Each preserved scenario, independently re-confirmed against current source:

- **Settings checkbox row** (`SettingsCheckboxListItem.vue`): clicking anywhere on the `MDListItem` row (label, supporting text, or the decorative checkbox area) toggles the setting via `@action`; `loading` swaps the trailing slot to a progress indicator instead of the checkbox; `disabled`/`loading` both suppress the emitted `change`.
- **Database view preset selection** (`DatabaseViewsSheet.vue`): clicking a view row selects that view preset via `DatabaseViewListEdit`'s own `@click-view`; the decorative checkbox visually reflects `viewId === effectiveViewId` with no independent interaction.
- **Relation multi-select action** (`RelationValueFieldData.vue`): clicking the checkbox in the action column adds/removes the relation item from `selectedValue` via `onSelect`; the pre-existing missing-accessible-name gap is preserved exactly as-is (not fixed, not newly regressed).
- **Boolean property tri-state editing via `MDCheckboxField`** (four downstream consumers): clicking the checkbox or its associated `<label>` cycles the tri-state `boolean | undefined` model via `toggleBoolean`; `disabled` and `autofocus` composition are preserved; the accessible name resolves from the forwarded `aria-label`.
- **Boolean value read-only display** (`BooleanValueInline.vue`): the checkbox remains fully non-interactive and hidden from the accessibility tree via `presentation`; hovering the bundled area shows the externally-composed tooltip. The rendered value continues to match the legacy pre-migration component's actual behavior: an effective `true`/`false` value (including one resolved through `property.default`) always renders checked/unchecked and never mixed; only a fully-unresolved effective `undefined` value renders mixed, and only when the `indeterminate` capability flag is enabled. This boundary-distinguishing behavior is exercised by `BooleanValueInline.test.ts`'s seven cases (six boundary combinations — effective `true`; effective `false`; unresolved `undefined` with flag enabled; `undefined` resolved through a `true` default; `undefined` resolved through a `false` default; `undefined` with no default and flag disabled — plus the `presentation` forwarding case), independently re-run by this pass (see [Consumer and blast-radius proof](#consumer-and-blast-radius-proof)) and confirmed passing against the current, unedited production file.
- **Storybook `ConsumerPatterns` fixture** (`MDListItemConsumerPatternsStory.vue`): unchanged demonstration usage, not a product scenario.

## Legacy ownership removed

Confirmed already removed, with no compatibility alias, by direct filesystem inspection this pass: `src/shared/ui/Checkbox/` contains exactly `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts` — no `MDCheckbox.vue`, no `MDCheckboxPlayground.vue`, no owner-local proof/stories for a legacy `MDCheckbox`. `src/shared/ui/Checkbox/index.ts` exports only `MDCheckboxField` and `toggleBoolean`/`useBooleanEdit`. `MDCheckboxField.vue`, `index.ts`, and `toggleBoolean.ts` correctly remain as the distinct non-Material shared-UI family per `ARCHITECTURE.md`'s "Ownership" and "Migration plan" step 6 — they are not legacy Checkbox ownership and were not touched.

The canonical family's own owner-local proof/visual ownership (`components/checkbox/MDCheckbox.visual.spec.ts`, colocated `MDCheckbox.visual.spec.ts-snapshots/`) and the legacy central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` removal are implementation-stage-owned facts (`IMPLEMENTATION.md`), independently re-confirmed present/absent respectively by this pass's own review of `IMPLEMENTATION.md`'s "Component-owned proof" section; no migration-stage action was required for them.

## Consumer and blast-radius proof

For each materially distinct consumer path, previous/canonical ownership, preserved behavior, and proof owner — all independently re-confirmed unchanged this pass:

| Consumer                              | Previous ownership                                                           | Canonical ownership                                                                                                               | Token/composition handoff                                                                                                                          | Proof owner                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `SettingsCheckboxListItem.vue`        | legacy `MDCheckbox` (`@shared/ui/Checkbox`)                                  | canonical `MDCheckbox presentation` (`@shared/ui/material`); `MDListItem` owns role/aria/action                                   | none (default appearance only)                                                                                                                     | `SettingsCheckboxListItem.test.ts`, `SettingsSections.test.ts` (component contract)                                              |
| `DatabaseViewsSheet.vue`              | legacy `MDCheckbox` (`@shared/ui/Checkbox`)                                  | canonical `MDCheckbox presentation`; row owns click handling                                                                      | none                                                                                                                                               | widget-level type-check; no dedicated unit test file (thin composition, no `MDCheckbox`-specific branch)                         |
| `RelationValueFieldData.vue`          | legacy `MDCheckbox` (`@shared/ui/Checkbox`)                                  | canonical `MDCheckbox`, `checked`/`update:checked` only                                                                           | none                                                                                                                                               | feature-level type-check; accessible-name gap tracked as accepted risk, not proof-owned here                                     |
| `MDCheckboxField.vue`                 | internally composed legacy `MDCheckbox`                                      | internally composes canonical `MDCheckbox`; translates `boolean\|undefined`↔`checked`/`indeterminate`; forwards `id`/`aria-label` | `hostAttrs` computed (`id`, `aria-label`) via `v-bind`, not raw `$attrs`                                                                           | `MDCheckboxField.test.ts` (component contract)                                                                                   |
| `BooleanValueInline.vue`              | legacy `MDCheckbox` `readonly`+`tabIndex="-1"`+`aria-hidden`+bundled tooltip | canonical `MDCheckbox presentation`; tooltip moved to external `MDPlainTooltip`                                                   | explicit `checked`/`indeterminate` translation from `BooleanProperty`'s capability-flag vocabulary (see [Migrated consumers](#migrated-consumers)) | `BooleanValueInline.test.ts` (seven boundary-combination cases, lowest faithful proof owner for this consumer-local translation) |
| `MDListItemConsumerPatternsStory.vue` | legacy `MDCheckbox`                                                          | canonical `MDCheckbox presentation`                                                                                               | none                                                                                                                                               | Storybook fixture only; not a product scenario                                                                                   |

Boundary combinations that distinguish old and canonical state/value meaning (`BooleanValueInline.vue`'s capability-flag-to-rendered-state translation) are exercised by `BooleanValueInline.test.ts`'s six cases plus the `presentation`-forwarding case, all independently re-run by this pass and passing against the current, unedited production file (see below).

Focused proof run fresh by this pass (`verification` skill, `pnpm verify --only <label> --files ...`):

- `pnpm verify --only type-check` — passed (55 changed files versus `origin/develop` in this working tree; no error attributable to any Checkbox consumer or the canonical family).
- `pnpm verify --only unit-tests --files src/widgets/SettingsSections/SettingsCheckboxListItem.vue src/widgets/SettingsSections/SettingsCheckboxListItem.test.ts src/widgets/SettingsSections/SettingsSections.test.ts src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts src/shared/ui/Checkbox/MDCheckboxField.vue src/shared/ui/Checkbox/MDCheckboxField.test.ts src/features/relationValueEdit/RelationValueFieldData.vue src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` — passed (`SettingsCheckboxListItem.test.ts`, `SettingsSections.test.ts`, `MDCheckboxField.test.ts`, `BooleanValueInline.test.ts` all green against current, unedited production files).

No consumer, legacy-owner, or spec file changed in this pass, so `IMPLEMENTATION.md`'s own component-owned proof (`MDCheckbox.test.ts`, `MDCheckbox.browser.spec.ts`, `MDCheckbox.visual.spec.ts`, `eslint.config.test.ts`) remains the last known-passing record for the canonical family's own files, unaffected by this pass and not re-run here (migration-stage proof is scoped to consumer/legacy-owner/migration-proof concerns per `material-component-migration`, not a re-audit of already-complete implementation-owned proof).

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files <nine consumer/test paths listed above>` — passed.

This pass edited only `src/shared/ui/material/components/checkbox/MIGRATION.md` itself; no `.vue`, `.ts`, story, browser-spec, visual-spec, or other documentation file changed, so no format/eslint/oxlint/storybook-behavior/visual/e2e lane has files in scope for this pass beyond the two checks above, which independently reconfirm the untouched consumers still compile and pass their existing proof.

## Remaining blockers

None.

## Review readiness

Ready. This is a fresh, independent migration-stage pass against current `ARCHITECTURE.md` and `IMPLEMENTATION.md` (both freshly re-derived this invocation). It independently re-derived the consumer inventory from a fresh repository-wide grep rather than trusting the superseded `MIGRATION.md`, read all six consumers directly, confirmed each already correctly composes the canonical `MDCheckbox` with no drift from `ARCHITECTURE.md`'s selected scenarios and required translations, confirmed the legacy `src/shared/ui/Checkbox/MDCheckbox.vue` has not reappeared, and independently re-ran focused type-check and unit-test proof against the current, unedited consumer files. No production, story, browser-spec, or visual-spec file required an edit. The independent review stage must run fresh against this revision plus the current `ARCHITECTURE.md`/`IMPLEMENTATION.md` revisions, since the existing `REVIEW.md` predates all three.
