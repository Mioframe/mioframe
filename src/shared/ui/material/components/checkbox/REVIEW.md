# Checkbox review

Artifact revision: 2026-08-12T20:17:22.000Z
DESIGN.md contract revision: 2026-08-12T14:38:31.628Z
ARCHITECTURE.md revision: 2026-08-12T20:06:50.783Z
IMPLEMENTATION.md revision: 2026-08-12T20:09:02.171Z
MIGRATION.md revision: 2026-08-12T20:13:11.042Z
Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: `RelationValueFieldData.vue` carries a pre-existing missing-accessible-name gap on its standalone relation-selection checkbox (no `aria-label`/`aria-labelledby` was ever supplied). This is explicitly recorded as a deliberate, not-silently-perpetuated decision in `ARCHITECTURE.md`'s "Risks" and `MIGRATION.md`'s "Migrated consumers"; it predates this family and is unrelated to the `BooleanValueInline.vue` correction reviewed here. Independently re-confirmed unchanged and untouched by this pass (`RelationValueFieldData.vue` composes `MDCheckbox` with only `:checked`/`@update:checked`, no accessible-name attribute). Non-blocking product-level follow-up outside this family's own scope.

## Goal and scenarios reviewed

Fresh, isolated review with no memory of any prior `REVIEW.md` round or of authoring any upstream artifact in this family. This round exists because all four upstream artifacts were freshly reissued: `DESIGN.md` (metadata-only refresh, contract revision unchanged), `ARCHITECTURE.md` (added an explicit legacy-to-canonical `checked`/`indeterminate` translation for `BooleanValueInline.vue`, scenario 4 / migration plan step 5), `IMPLEMENTATION.md` (revalidation-only, no `MDCheckbox` code changed), `MIGRATION.md` (applied the translation to `BooleanValueInline.vue` and added `BooleanValueInline.test.ts`).

Every claim below was independently re-derived from the current workspace by direct file reads, direct greps, and independently executed `pnpm verify --only <label> --files ...` commands — never trusted from any upstream artifact's prose alone.

Reviewed scenarios (from `ARCHITECTURE.md` "Current scenarios," independently cross-checked against the real current consumer source files):

1. Editable labeled-field composition via `MDCheckboxField.vue` (`src/shared/ui/Checkbox/MDCheckboxField.vue`), feeding four downstream product consumers: `DatabaseBooleanPropertyEditSection.vue`, `BooleanPropertySettingsSection.vue`, and both `BooleanValueField.vue` files.
2. Standalone editable multi-select action (`RelationValueFieldData.vue`).
3. Decorative list-item/row `presentation` composition (`SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`).
4. Decorative read-only value display, `presentation` (`BooleanValueInline.vue`) — the corrected scenario for this round.

A sixth consumer not named in `ARCHITECTURE.md`'s scenario list (`MDListItemConsumerPatternsStory.vue`, a Storybook-only fixture) was independently confirmed still migrated, matching `MIGRATION.md`'s own disclosure. A repository-wide `grep -rl "MDCheckbox" src` independently confirmed the complete consumer set: exactly the files named by `MIGRATION.md`, no untouched or stray consumer.

## Official design compliance

`DESIGN.md` (`Design contract revision: 2026-08-12T14:38:31.628Z`, `Status: current`) was read in full. All 11 required sections are present. The revision summary describes a metadata-only refresh (prior artifact revision was later than the runtime clock, making it mechanically invalid) with the design contract revision explicitly preserved and the 81-token catalogue re-confirmed byte-identical. Per this skill's rule, a metadata-only refresh with unchanged contract revision does not itself require re-review and does not invalidate downstream artifacts. No official fact used by `ARCHITECTURE.md` was found missing, mischaracterized, or unsupported.

Independently ran `pnpm verify --only format --files src/shared/ui/material/components/checkbox/DESIGN.md` together with the other three artifacts — passed (see Proof and stage verification).

## Architecture compliance

`ARCHITECTURE.md` (`Artifact revision: 2026-08-12T20:06:50.783Z`, `Status: ready`) was read in full and independently checked against `DESIGN.md`, the confirmed consumer set, `docs/component-adapter.md`, and `MDCheckbox.vue`'s actual current source.

- **`MDCheckbox`'s own selected surface, public API, tokens, and renderer mapping are unchanged from a prior compliant state.** I independently read `MDCheckbox.vue` line-by-line: `checked`/`indeterminate`/`disabled`/`presentation` props with the documented defaults; `inheritAttrs: false`; the `getForwardedAttrs()`/`getMergedAttrs()` host-attribute allow-list (`id`, `title`, `aria-label`, `aria-labelledby`, `data-*`, merged `class`/`style`); the `onBeforeinput` handler that narrows `event.target` with `instanceof M3eCheckboxElement`, no-ops under `presentation` before computing anything, otherwise calls `preventDefault()` before emitting `update:checked(!event.target.checked)`/`update:indeterminate(false)`. This matches `ARCHITECTURE.md`'s "Public Vue API," "Host-attribute boundary," and "State precedence and restoration" sections exactly. `git status` independently confirms `MDCheckbox.vue`, `MDCheckbox.test.ts`, and `MDCheckbox.browser.spec.ts` are not modified in this working tree — the only substantive change versus the prior architecture revision is scoped to scenario 4 / migration plan step 5, a consumer-owned translation, consistent with the claim that no Checkbox-owned file needed to change.
- **The one substantive change: scenario 4's legacy-to-canonical `indeterminate` translation.** I independently re-derived this from first principles rather than trusting the artifact's narrative. `BooleanProperty.indeterminate` (`src/entities/databaseBoolean/boolean.ts`) is a Zod-optional boolean capability/configuration flag on the property schema — it says "this property is allowed to have an unresolved/mixed value," not "the currently displayed value is mixed." The canonical `MDCheckbox.indeterminate` prop, per this same architecture's "Public Vue API," is the current rendered mixed state. These are different meanings of similar-sounding booleans, and the required translation (`checked = effectiveValue === true`; `indeterminate = property.indeterminate === true && effectiveValue === undefined`) correctly derives the canonical rendered-state meaning from the capability-flag meaning plus the already-existing effective-value resolution. This is not a case of trusting matching prop names: the two `indeterminate` values (property-level capability flag vs. component-level rendered state) are genuinely distinct concepts that happen to share a name, and the architecture correctly treats them as such.
- **Controlled-state trace (review order step 3), re-independently confirmed.** Unchanged from `MDCheckbox.vue`'s own contract (see above): one source of truth (`checked`/`indeterminate` props), one explicit accepted-intent path, one explicit rejected-intent path proven non-divergent by both `MDCheckbox.test.ts` and `MDCheckbox.browser.spec.ts`'s rejected-intent tests, no renderer-owned optimistic mutation.
- **`docs/component-adapter.md` compliance.** Re-confirmed: host-attribute allow-list matches the documented minimum common set plus a justified extension; no `v-bind="$attrs"` spread; controlled-state ownership record complete.
- **Simplicity check.** The `BooleanValueInline.vue` fix is a two-line local `computed()` correction using the consumer's pre-existing effective-value resolution (`convertedValue`) — no generic helper, adapter, state manager, or compatibility layer was introduced. No simpler viable alternative exists that still correctly distinguishes the two `indeterminate` meanings.

No architecture defect was found.

## Implementation compliance

`IMPLEMENTATION.md` (`Artifact revision: 2026-08-12T20:09:02.171Z`, `Status: complete`) documents a revalidation-only refresh with zero code changes. I independently re-read `MDCheckbox.vue`, `components/checkbox/index.ts`, `m3eCheckbox.d.ts`, `config/vueCustomElements.ts`, and `docs/m3e-defects.md`'s `M3E-005` entry directly (not trusting the artifact's prose), and independently ran `git status` to confirm no Checkbox-owned production/test/story file is modified in the working tree. Every public prop, the host-attribute allow-list, and the `beforeinput`-derived controlled-intent contract match `ARCHITECTURE.md`'s "Public Vue API" and "Renderer mapping and gaps" tables exactly. `docs/m3e-defects.md`'s `M3E-005` entry (summary row + full registry body, cross-referencing `MDCheckbox.browser.spec.ts`) is present and unaffected by this pass. `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` remains at the legacy central location, correctly consistent with `docs/testing/migration-plan.md`'s current executable state (Stage S4-B: the canonical Material `checkbox` family is explicitly not one of the owner-local-authorized visual groups).

Architecture deviations: none, independently confirmed by direct file comparison.

## Migration and legacy removal

`MIGRATION.md` (`Artifact revision: 2026-08-12T20:13:11.042Z`, `Status: complete`) was independently re-verified against the current filesystem, not trusted from its own prose.

- **`BooleanValueInline.vue` correction, independently re-read in full.** The current file computes `checked = computed(() => convertedValue.value === true)` and `indeterminate = computed(() => property.value.indeterminate === true && convertedValue.value === undefined)`, using the pre-existing `convertedValue = computed(() => isBoolean(value.value) ? value.value : property.value.default)`. This exactly matches `ARCHITECTURE.md`'s required formula (the file uses the name `convertedValue` where the architecture prose says `effectiveValue`; same computation, and `MIGRATION.md` explicitly discloses this naming). The `presentation` prop usage (`<MDCheckbox presentation :checked="checked" :indeterminate="indeterminate" />`) and the externally-composed `MDPlainTooltip` are unchanged from before this correction — independently confirmed by reading the full current file, which retains both.
- **All six required boundary combinations independently verified present and correct in `BooleanValueInline.test.ts`** by reading the test file in full and independently running it: (1) `value=true`, `property.indeterminate=true` → `checked=true`/`indeterminate=false`; (2) `value=false`, `property.indeterminate=true` → `checked=false`/`indeterminate=false`; (3) `value=undefined`, no default, `property.indeterminate=true` → `checked=false`/`indeterminate=true`; (4) `value=undefined`, `default=true`, `property.indeterminate=true` → `checked=true`/`indeterminate=false`; (5) `value=undefined`, `default=false`, `property.indeterminate=true` → `checked=false`/`indeterminate=false`; (6) `value=undefined`, no default, `property.indeterminate=false` → `checked=false`/`indeterminate=false`. A seventh test independently confirms `presentation` is always forwarded `true`. Each test mounts the real `BooleanValueInline.vue` (not a re-implementation of its logic) against a stubbed `MDCheckbox`/`MDPlainTooltip`, so the assertions exercise the actual production derivation.
- **Five other consumers independently re-confirmed unchanged and correct** by direct source reads: `SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`, `RelationValueFieldData.vue` (confirmed via direct read: `:checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)"`, no accessible-name attribute — the pre-existing gap remains untouched, consistent with the explicit accepted-risk record), `MDCheckboxField.vue` (confirmed via direct read: its own correct, independently-derived `checked`/`showIndeterminate` translation for its distinct `boolean | undefined` model-value vocabulary, `hostAttrs` with `id`/`aria-label`, unaffected by this pass), `MDListItemConsumerPatternsStory.vue`.
- **`git status` independently confirms the exact claimed diff footprint**: `BooleanValueInline.vue` modified, the four checkbox family artifacts modified, `BooleanValueInline.test.ts` added — nothing else. No stray edit to `MDCheckbox.vue`, `MDCheckboxField.vue`, `RelationValueFieldData.vue`, or any other consumer.
- **Legacy ownership.** Independently re-confirmed via repository-wide `grep -rl "MDCheckbox" src`: the complete consumer set matches `MIGRATION.md`'s inventory exactly (six top-level consumers plus four downstream `MDCheckboxField` consumers, all confirmed importing `MDCheckboxField`, never a raw legacy import). No legacy `src/shared/ui/Checkbox/MDCheckbox.vue` reappeared.

## Proof and stage verification

Independently executed by this review (not merely re-read from `MIGRATION.md`'s recorded results):

- `pnpm verify --only unit-tests --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only type-check --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only eslint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only oxlint --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed.
- `pnpm verify --only format --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts src/shared/ui/material/components/checkbox/DESIGN.md src/shared/ui/material/components/checkbox/ARCHITECTURE.md src/shared/ui/material/components/checkbox/IMPLEMENTATION.md src/shared/ui/material/components/checkbox/MIGRATION.md` — passed.

`docs/testing/migration-plan.md` and `docs/component-adapter.md` were independently read in full; both are consistent with the current filesystem state for this family (owner-local `MDCheckbox.browser.spec.ts`; central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`; no seam/token/host-attribute deviation). No production, story, browser-spec, or visual-spec file was touched by this migration pass, so no new browser/visual/e2e obligation exists beyond the focused checks above; the prior migration pass's `type-check` (full changed-path), `storybook-build`, `visual`, and `e2e` results remain the last known-passing record for the files this pass did not touch, consistent with `docs/component-adapter.md`'s verification contract scoping focused proof to what a given pass supplies.

## Blockers

none

## Major issues

none

## Minor issues

none

## Accepted risks

- `RelationValueFieldData.vue`'s pre-existing missing-accessible-name gap (no `aria-label`/`aria-labelledby` was ever supplied on its standalone relation-selection checkbox). Predates this family, independently re-confirmed unchanged and untouched by this correction pass, and already explicitly recorded as a deliberate non-blocking product-level follow-up in `ARCHITECTURE.md`'s "Risks" and `MIGRATION.md`'s "Migrated consumers."

## Items not required

- `docs/roadmap.md` (outside this family's four stage artifacts) still contains prose describing the `BooleanValueInline.vue` regression as unfixed and instructing a return to architecture. `roadmap.md`'s mutable status/next-action text is explicitly owned by the outer `material-component` orchestrator, not by any of this family's four stage artifacts, so refreshing it is not a family-review-owned action and does not affect this review's verdict.
- `error`/invalid axis, native form participation, a `readonly` axis distinct from `presentation`, an internal tooltip surface, and parent/child indeterminate-group propagation remain explicitly deferred per `ARCHITECTURE.md`'s "Non-goals," unaffected by this pass.
- Owner-local visual-spec placement for `checkbox` remains correctly deferred to a future Stage S4 authorization per `docs/testing/migration-plan.md`; unaffected by this pass.
- Promotion of the `ElementInternals` test-support shim to a shared Material test helper remains correctly deferred as an explicit follow-up; unaffected by this pass.

## Routing evidence

Not applicable — this is a full independent review, not final-verifier routing. No `pnpm verify`/`pnpm verify:release` full-suite output was classified in this pass; the focused commands run above are this review's own independent proof, not outer-workflow final verification.
