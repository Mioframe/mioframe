# Checkbox migration

Artifact revision: 2026-08-12T20:13:11.042Z
Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
IMPLEMENTATION.md revision: 2026-08-12T20:09:02.171Z
Revision summary: Substantive correction required by `ARCHITECTURE.md` revision `2026-08-12T20:06:50.783Z`'s newly explicit `BooleanValueInline.vue` legacy-to-canonical semantic translation (scenario 4 / migration plan step 5). Mechanical: the prior `MIGRATION.md`'s `Artifact revision` (`2026-08-13T00:05:00.000Z`) was later than the actual runtime UTC clock at validation time, making the prior artifact mechanically invalid regardless of content per `docs/component-workflow.md`'s "Mechanical invalidity" rule; this revision obtains a fresh UTC timestamp immediately before writing. Substantive: this fresh migration-stage worker independently re-read the current `BooleanValueInline.vue` and confirmed it forwarded the legacy `property.indeterminate` capability flag directly as `MDCheckbox`'s `indeterminate` prop (`:checked="convertedValue" :indeterminate="indeterminate"`, where `indeterminate = property.indeterminate`), which incorrectly rendered every resolved `true`/`false` effective value as the mixed state whenever the capability flag was enabled — contradicting the legacy component's actual observable behavior and `ARCHITECTURE.md`'s now-explicit translation requirement. This worker corrected `BooleanValueInline.vue` to compute `checked = convertedValue === true` and `indeterminate = property.indeterminate === true && convertedValue === undefined`, using the consumer's existing effective-value resolution (`convertedValue`) unchanged, and added consumer-level proof (`BooleanValueInline.test.ts`, new file) covering all six boundary combinations named in `ARCHITECTURE.md`'s translation. No other consumer, legacy-ownership, or proof claim from the prior migration pass changed; this worker independently re-verified the remaining five consumers and the legacy-removal state against the current filesystem before concluding the fix was isolated to this one file.

**Independent re-verification performed by this pass**, not trusted from the superseded artifact's prose:

- Read the current `BooleanValueInline.vue` directly and confirmed the bug: `indeterminate` was computed as `property.value.indeterminate` (the raw capability flag) and passed straight through, while `checked` used the correct `convertedValue` effective-value resolution. Fixed both derivations locally in the same file; no new abstraction, helper, or `MDCheckbox` API change was introduced.
- Grepped `shared/ui/Checkbox` and `Checkbox/MDCheckbox` repository-wide again. Results are unchanged from the prior migration pass: the only `shared/ui/Checkbox` hits are the five expected downstream consumers of the distinct non-Material `MDCheckboxField`/`toggleBoolean` exports plus `EditableInlineValue.vue` (imports only `toggleBoolean`); the only `Checkbox/MDCheckbox` hit is the canonical family's own `MDCheckbox.stories.ts` title string.
- Grepped `MDCheckbox` across `src` and confirmed the same six consumers as the prior migration pass still reference it: `SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`, `RelationValueFieldData.vue`, `MDCheckboxField.vue`, `BooleanValueInline.vue`, `MDListItemConsumerPatternsStory.vue`. No consumer count drift.
- Directly listed `src/shared/ui/Checkbox/` and confirmed it still contains only `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts` — no legacy `MDCheckbox.vue` reappeared.
- Confirmed no other file under `src/entities/databaseBoolean` changed: `BooleanValueField.vue`, `BooleanPropertySettingsSection.vue`, and `boolean.ts` are untouched; only `BooleanValueInline.vue` needed correction and only `BooleanValueInline.test.ts` (new) was added as proof.

Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Unchanged from the prior migration pass, independently re-confirmed by this pass's repository-wide search (see the revision summary): six real consumers of the canonical `MDCheckbox`, matching `ARCHITECTURE.md`'s five confirmed scenarios plus one Storybook-only fixture `ARCHITECTURE.md`'s inventory does not name:

1. `src/widgets/SettingsSections/SettingsCheckboxListItem.vue` — decorative `presentation` composition inside an `MDListItem role="checkbox"` row (ARCHITECTURE.md scenario 3).
2. `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` — decorative `presentation` composition as a view-preset selection indicator inside a `DatabaseViewListEdit` row (ARCHITECTURE.md scenario 3).
3. `src/features/relationValueEdit/RelationValueFieldData.vue` — standalone editable checked-only multi-select action inside a database table row (ARCHITECTURE.md scenario 2).
4. `src/shared/ui/Checkbox/MDCheckboxField.vue` — the separate, non-Material shared-UI family that composes an external `<label :for="id">` with a checkbox and feeds four real downstream product consumers: `DatabaseBooleanPropertyEditSection.vue` (`src/features/databaseBooleanPropertyEdit`), `BooleanPropertySettingsSection.vue` (`src/entities/databaseBoolean`), and both `BooleanValueField.vue` files (`src/features/booleanValueEdit`, `src/entities/databaseBoolean`) (ARCHITECTURE.md scenario 1).
5. `src/entities/databaseBoolean/BooleanValueInline.vue` — decorative read-only table-cell value display (ARCHITECTURE.md scenario 4). **This is the one consumer corrected by this migration pass** — see [Migrated consumers](#migrated-consumers).
6. `src/shared/ui/Lists/stories/MDListItemConsumerPatternsStory.vue` — a Storybook-only `MDListItem` fixture, not confirmed product demand.

`MDCheckboxPlayground.vue` remains removed with no replacement, unchanged from the prior pass.

## Migrated consumers

Five of six consumers are unchanged from the prior migration pass (independently re-confirmed present and correct by this pass's direct source reads):

- **`SettingsCheckboxListItem.vue`**: `<MDCheckbox v-else presentation :checked="checked" :disabled="disabled" />`. Unchanged.
- **`DatabaseViewsSheet.vue`**: `<MDCheckbox presentation :checked="viewId === effectiveViewId" />`. Unchanged.
- **`RelationValueFieldData.vue`**: `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`. Unchanged. The pre-existing missing-accessible-name gap remains deliberately not fixed by this migration, per `ARCHITECTURE.md`'s recorded decision — this is an explicit out-of-scope follow-up, not touched by this pass.
- **`MDCheckboxField.vue`**: unchanged tri-state translation (`checked = modelValue === true`; `indeterminate = props.indeterminate && modelValue === undefined`), `aria-label` accessible-name backstop, `id` forwarding, and autofocus composition. Not touched by this pass.
- **`MDListItemConsumerPatternsStory.vue`**: unchanged Storybook-only fixture usage.

**`BooleanValueInline.vue`** (corrected by this pass): the composed `checked`/`indeterminate` props now use an explicit local translation instead of forwarding the legacy capability flag directly:

```ts
const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : property.value.default,
);

const checked = computed(() => convertedValue.value === true);

const indeterminate = computed(
  () => property.value.indeterminate === true && convertedValue.value === undefined,
);
```

`convertedValue`'s existing effective-value resolution (explicit value, falling back to `property.default`) is unchanged. Only how `checked`/`indeterminate` are derived from it for `MDCheckbox`'s props changed. The externally-composed `MDPlainTooltip` and the `presentation` prop usage are unchanged; the root `<span class="boolean-value-inline">` wrapper and its scoped style are unchanged. This mapping is kept local and explicit inside `BooleanValueInline.vue`, matching `ARCHITECTURE.md`'s "this translation is owned by `BooleanValueInline.vue` itself... not by `MDCheckbox`" instruction — no generic helper, adapter, state manager, compatibility layer, or Material API extension was introduced.

## Preserved scenarios and failure paths

Unchanged from the prior migration pass for five of six consumers (Settings checkbox row, Database view preset selection, Relation multi-select action, Boolean property tri-state editing via `MDCheckboxField`, Storybook `ConsumerPatterns` fixture) — see the prior pass's action-preservation records, independently re-confirmed by this pass to still describe the current, untouched code for those files.

**Read-only boolean value display (`BooleanValueInline`), corrected scope**: the table-cell display continues to be fully non-interactive and hidden from the accessibility tree via `presentation` (unchanged). The **rendered value** now matches the legacy component's actual pre-migration behavior instead of a regression introduced by the direct-forwarding bug: an effective `true`/`false` value (including one resolved through `property.default`) always renders checked/unchecked and never mixed, regardless of whether the property's `indeterminate` capability flag is enabled; only a fully-unresolved effective `undefined` value renders mixed, and only when the capability flag is enabled. This is a correctness fix to the value actually shown to the user, not a new user action — no entry point, interaction tier, or affordance changed; the checkbox remains purely reflective and non-interactive. The bundled tooltip continues to appear on hover over the same visual area, unchanged.

## Legacy ownership removed

Unchanged from the prior migration pass. The entire legacy `src/shared/ui/Checkbox` component (`MDCheckbox.vue` and its owner-local proof/stories/`MDCheckboxPlayground.vue`) remains removed with no compatibility alias, independently re-confirmed present-as-removed by this pass's direct filesystem listing (see the revision summary). `MDCheckboxField.vue`, `index.ts`, and `toggleBoolean.ts` correctly remain as the distinct non-Material family, untouched by this pass.

## Consumer and blast-radius proof

Unchanged for five of six consumers — the prior migration pass's proof records (`SettingsCheckboxListItem.test.ts`, `SettingsSections.test.ts`, `MDCheckboxField.test.ts`, the `e2e` and `visual` lane coverage) remain accurate because none of those files changed in this pass.

**`BooleanValueInline.vue` (new proof, this pass)**: no unit test file existed for this consumer before this pass (confirmed by a direct directory search). Added `src/entities/databaseBoolean/BooleanValueInline.test.ts`, a component-contract test stubbing the canonical `MDCheckbox` (its own renderer mapping is proven once at `components/checkbox/MDCheckbox.test.ts`) and `MDPlainTooltip`, proving the corrected `checked`/`indeterminate` translation across the six boundary combinations that distinguish the legacy capability-flag meaning from the canonical current-rendered-state meaning:

1. effective `true` value, indeterminate capability enabled → `checked=true`, `indeterminate=false`.
2. effective `false` value, indeterminate capability enabled → `checked=false`, `indeterminate=false`.
3. effective `undefined` value, no default, indeterminate capability enabled → `checked=false`, `indeterminate=true`.
4. effective `undefined` value resolved via a `true` property default, indeterminate capability enabled → `checked=true`, `indeterminate=false`.
5. effective `undefined` value resolved via a `false` property default, indeterminate capability enabled → `checked=false`, `indeterminate=false`.
6. effective `undefined` value, no default, indeterminate capability disabled → `checked=false`, `indeterminate=false`.

A seventh test confirms `presentation` is always forwarded `true` (unchanged composition contract). This is the lowest faithful proof owner for this consumer-local translation per `docs/testing/architecture.md`'s one-primary-proof-owner rule — a component-level Vitest test, not a browser/e2e spec, because the defect is a pure derivation bug with no browser-only behavior (focus, pointer, layout) involved.

Focused proof run by this pass:

- `pnpm verify --only type-check` (full changed-path selection, 48 changed files against `origin/develop`) — passed.
- `pnpm verify --only unit-tests --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only eslint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed (after adding the documented `vue/one-component-per-file` disable/enable pair around the test file's inline stub components, matching the established `SettingsCheckboxListItem.test.ts` precedent).
- `pnpm verify --only oxlint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only format --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.

No browser, visual, or e2e proof was re-run because this pass touched no story, browser-spec, or route-level file, and `BooleanValueInline.vue` carries no owner-local browser/visual proof obligation of its own (it composes `presentation`-mode `MDCheckbox`, whose own renderer/visual contract is proven once at the family level). The change is a pure computed-value derivation with no new DOM structure, listener, or layout.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed (this pass).
- `pnpm verify --only unit-tests --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed (this pass).
- `pnpm verify --only eslint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed (this pass).
- `pnpm verify --only oxlint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed (this pass).
- `pnpm verify --only format --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed (this pass).

The remaining focused results recorded by the prior migration pass (unit-tests full changed-path selection, eslint/oxlint/format for the other touched consumer/test files, `storybook-build`, `visual` full lane, `e2e` 118-scenario run) remain the last known-passing record for those unchanged files, because this pass touched none of them. This pass's own new code (`BooleanValueInline.vue`'s corrected derivation and its new test file) is covered by the five focused commands listed above, all passing.

## Remaining blockers

None.

## Review readiness

Ready. The one substantive defect this pass was launched to fix — `BooleanValueInline.vue` forwarding the legacy `property.indeterminate` capability flag directly as `MDCheckbox`'s canonical current-rendered-state `indeterminate` prop — is corrected with a local, explicit translation matching `ARCHITECTURE.md`'s now-explicit scenario 4 requirement exactly, and proven by a new component-contract test covering all six required boundary combinations. All five other consumers and legacy-removal state were independently re-verified against the current filesystem and found unchanged and still correct. Focused type-check, unit-tests, eslint, oxlint, and format all passed for the corrected file and its new test. No new browser/visual/e2e obligation was introduced by this pure-derivation fix.
