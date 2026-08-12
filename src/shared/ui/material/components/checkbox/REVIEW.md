# Checkbox review

Artifact revision: 2026-08-13T01:15:00.000Z
DESIGN.md contract revision: 2026-08-12T14:38:31.628Z
ARCHITECTURE.md revision: 2026-08-12T22:00:00.000Z
IMPLEMENTATION.md revision: 2026-08-12T23:55:00.000Z
MIGRATION.md revision: 2026-08-13T00:05:00.000Z
Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: `src/shared/ui/material/docs/roadmap.md` (last updated 2026-08-12, outside this family's DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION artifact set) still reads "`REVIEW.md not yet run`" / "Independent review ... has not yet run for the `checkbox` family," even though a prior `REVIEW.md` round (`Artifact revision: 2026-08-13T00:25:00.000Z`, `blocked`, `self/design`, superseded by this revision) already executed and is present in the workspace. `MIGRATION.md` (`2026-08-13T00:05:00.000Z`) was authored before that first review round (`00:25:00.000Z`), so its own re-verification of `roadmap.md`'s text was accurate at the time it was written; the file has simply not been refreshed since. `roadmap.md`'s mutable status is explicitly owned by the outer `material-component` orchestrator, which updates it "when the invocation is being durably recorded" (`material-component` skill) — not by any of this family's four stage artifacts, so this is not a design/architecture/implementation/migration defect and has no Material correction route. Non-blocking: it does not affect this family's own compliance, and the orchestrator refreshes it as part of normally recording this review's completion.

## Goal and scenarios reviewed

This is a fresh, isolated review with no memory of any prior `REVIEW.md` round, any prior review round on this family, or of authoring any upstream artifact in this family. Every claim below was independently re-derived from the current workspace by direct file reads and direct grep/format-check commands — never from any upstream artifact's prose alone.

Reviewed scenarios (from `ARCHITECTURE.md` "Current scenarios," independently cross-checked against the real current consumer source files):

1. Editable labeled-field composition via `MDCheckboxField.vue` (`src/shared/ui/Checkbox/MDCheckboxField.vue`), feeding four downstream product consumers: `DatabaseBooleanPropertyEditSection.vue`, `BooleanPropertySettingsSection.vue`, and both `BooleanValueField.vue` files.
2. Standalone editable multi-select action (`RelationValueFieldData.vue`).
3. Decorative list-item/row `presentation` composition (`SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`).
4. Decorative read-only value display, `presentation` (`BooleanValueInline.vue`).

All four scenarios are implemented, migrated, and proven as described below. A sixth consumer not named in `ARCHITECTURE.md`'s scenario list (`MDListItemConsumerPatternsStory.vue`, a Storybook-only fixture) was independently confirmed migrated as legacy-removal blast radius, matching `MIGRATION.md`'s own disclosure.

## Official design compliance

`DESIGN.md` (`Design contract revision: 2026-08-12T14:38:31.628Z`, `Status: current`) was read in full. All 11 required sections are present: Source ledger, Identity and purpose, Anatomy and content, Variants and configurations, Geometry and layout, States and behavior, Usage guidance, Accessibility, Complete official token catalogue, Source conflicts and unknowns, Related official contracts. The complete 81-token `md.comp.checkbox` catalogue is present with every raw-serialization discrepancy (eight `[unresolved]` outline-width placeholders resolving to `0dp`; twenty-one `{"alpha":1}` high-contrast fragments resolving to `#000000`) explicitly recorded rather than silently corrected. The design artifact's self-critical sourcing (indeterminate-has-no-tokens conflict, the chip-terminology keyboard-table copy/paste defect preserved verbatim, unpublished role/contrast, cache-freshness acknowledgment) is complete and internally consistent. No official fact used by `ARCHITECTURE.md` was found missing, mischaracterized, or unsupported by the cited source ledger.

**Format defect resolved.** The prior review round (`REVIEW.md` `2026-08-13T00:25:00.000Z`) found `DESIGN.md` failing the `format` check due to a table-alignment issue. I independently re-ran the exact focused command myself: `pnpm verify --only format --files src/shared/ui/material/components/checkbox/DESIGN.md` — **passed**. The file's `Revision summary` states this was a metadata-only reformatting pass (`pnpm verify --fix-only`/`oxfmt`) with the `Design contract revision` explicitly preserved (`2026-08-12T14:38:31.628Z`, unchanged), and I independently confirmed the substantive content (source ledger, token catalogue, all conflict entries) is identical to what the prior compliant review already found compliant. Per this skill's rule that "a metadata-only design refresh with unchanged design contract revision does not require review" and that "a design artifact revision mismatch alone is irrelevant when design contract revision is unchanged," this refresh does not invalidate `ARCHITECTURE.md`, `IMPLEMENTATION.md`, or `MIGRATION.md`.

I additionally ran the focused format check against `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `docs/m3e-defects.md`, and `docs/testing/migration-plan.md` together — all passed.

## Architecture compliance

`ARCHITECTURE.md` (`Artifact revision: 2026-08-12T22:00:00.000Z`, `Status: ready`) was read in full and independently checked against `DESIGN.md`, the confirmed consumer set, `docs/component-adapter.md`, and `MDCheckbox.vue`'s actual current source.

- **Demand scoping.** The four current scenarios and the derived selected/deferred surface (tri-state `checked`/`indeterminate`, `disabled`, the Mioframe `presentation` extension; deferred `error`, form participation, `readonly`, tooltip, icon configuration, parent/child indeterminate propagation) are each traceable to a real confirmed consumer, independently re-confirmed by directly reading every cited consumer file's current source.
- **Controlled-state trace (review order step 3).** I independently read `MDCheckbox.vue`'s `onBeforeinput` handler directly: it narrows `event.target` with `instanceof M3eCheckboxElement`, no-ops when `presentation` is true, otherwise calls `event.preventDefault()` **before** computing or emitting anything, then emits `update:checked(!event.target.checked)` and `update:indeterminate(false)` — values computed from the still-unmutated renderer state. `MDCheckbox.test.ts`'s "rejected intent" test (directly re-read) proves that when the emitted values are not written back into the controlling props, `m3e-checkbox.checked`/`.indeterminate` remain exactly at their prior values. `MDCheckbox.browser.spec.ts`'s "rejected intent" test independently proves the identical contract against a live Storybook fixture in a real browser. This confirms one source of truth (`checked`/`indeterminate` props), one explicit accepted-intent path (consumer writes the emitted value back), one explicit rejected-intent path (proven non-divergent), and no renderer-owned optimistic mutation that can survive a rejected update.
- **`docs/component-adapter.md` compliance.** The host-attribute allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-label`, `aria-labelledby`) matches the documented minimum common allow-list plus a justified, demand-driven extension; `MDCheckbox.vue`'s `getForwardedAttrs()`/`getMergedAttrs()` implement exactly this allow-list with no `v-bind="$attrs"` spread anywhere in the file, independently confirmed by direct reading. The controlled-state ownership record (source of truth, renderer property, exact cancelable pre-mutation event, accepted/rejected paths, disabled/presentation interaction) is complete per the "Controlled state ownership" contract.
- **`M3E-005` classification.** The `divergent`/`M3E-005` row for adjacent-label accessible-name computation correctly follows the defect-registry inclusion boundary: decision is `defer` (not `temporary-renderer-workaround`), no wrapper-level accessible-name synthesis is added, and the confirmed-working `aria-label`/`aria-labelledby` backstop is required instead of relying on native `<label>` association for naming — matching the `M3E-004`/Switch precedent exactly, independently confirmed by reading both registry entries side by side.
- **Simplicity check.** The design is a thin single-host adapter with no adapter framework, no wrapper-owned shadow state, and one Mioframe extension (`presentation`) reused verbatim from the Switch precedent. No simpler viable alternative was found that still satisfies the confirmed scenarios' accessibility and controlled-state requirements.
- **Revision-correction narrative independently re-verified.** `ARCHITECTURE.md`'s header explains a prior review found an unauthorized cross-stage edit (implementation had hand-edited architecture content while reusing a stale artifact revision) and that the current revision is the authorship-corrected reissue. I did not trust this narrative on its face — I independently confirmed the underlying claim (native `for`/`id` association does not produce an accessible name for `m3e-checkbox`) by reading `MDCheckbox.browser.spec.ts`'s own `toHaveAccessibleName('')` assertion directly, and found the content correct on its merits. The correction is procedurally sound.

No architecture defect was found.

## Implementation compliance

`IMPLEMENTATION.md` (`Artifact revision: 2026-08-12T23:55:00.000Z`, `Status: complete`) documents a revalidation-only refresh correcting a prior false claim that `config/vueCustomElements.ts` "does not exist." I independently re-read the three cited files directly, not trusting either artifact's prose:

- `config/vueCustomElements.ts` exists at the repository root and exports `selectedM3eCustomElements = new Set(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])` plus `isM3eCustomElement`.
- `config/plugins/base.ts` imports `isM3eCustomElement` from `'../vueCustomElements'` and wires it into `vue({ template: { compilerOptions: { isCustomElement: isM3eCustomElement } } })`.
- `eslint.config.test.ts` (line 102) runs `it.each(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])` asserting each is accepted inside Material, and (line 112) a second `it.each` of unlisted `m3e-*`-shaped tags (`m3e-buton`, `m3e-icon-button`, `m3e-button-extra`, `x-m3e-button`, `m3e-arbitrary-element`) asserting rejection — behavior only a maintained allowlist, not a bare regex, produces.

`m3e-checkbox` is already correctly present; no production file required any change. This correction's claim is independently confirmed accurate.

Further independent checks:

- `src/shared/ui/material/m3eCheckbox.d.ts` exists at the claimed path (confirmed by direct filesystem search).
- `MDCheckbox.vue`, `index.ts`, `MDCheckbox.test.ts`, `MDCheckbox.testUtils.ts`, `MDCheckbox.browser.spec.ts`, `MDCheckbox.stories.ts` were each read in full. Every public prop (`checked`, `indeterminate`, `disabled`, `presentation`), the host-attribute allow-list, and the `beforeinput`-derived controlled-intent contract in `MDCheckbox.vue` match `ARCHITECTURE.md`'s "Public Vue API" and "Renderer mapping and gaps" tables exactly, line for line.
- `MDCheckbox.test.ts` (component contract) covers: demand-scoped defaults, Boolean-property mapping (not dashed attributes), prop reactivity, single-emission-pair `beforeinput` interception with correct computed values, rejected-intent non-mutation, `disabled` non-emission, `presentation` full suppression and non-emission, and the complete host-attribute allow/reject matrix including dynamic add/remove/re-add and listener rejection.
- `MDCheckbox.browser.spec.ts` (owner-local browser proof) covers real click/Space producing one intent pair, an explicit Enter no-op assertion (correctly differing from Switch's `allowEnter=true`), `aria-labelledby`/`aria-label` accessible-name resolution, disabled non-activation and non-focusability, the `M3E-005` native-`<label>`-does-not-name assertion, adjacent-label click-to-toggle, rejected-intent non-mutation in a live browser, `presentation`'s Tab/pointer unreachability and accessibility-tree hiding, a two-sided `presentation`-composition proof (pointer input on the decorative region reaches the fixture owner's real action, and the owner's resulting state flows back into the rendered `checked`), the 48×48dp expanded target, and host-attribute-boundary rejection under real pointer input.
- `MDCheckbox.testUtils.ts`'s `ElementInternals` shim is a family-local duplicate of `switch/MDSwitch.testUtils.ts`'s identical shim; I read both files and confirmed they are functionally identical (same `MockElementInternals` surface, same install/restore contract), matching `docs/component-adapter.md`'s promotion criterion analysis in `IMPLEMENTATION.md` — promotion would require editing the already-reviewed `switch` family's own file from an implementation-only worker, correctly deferred as an explicit follow-up rather than silently duplicated without consideration.
- `docs/m3e-defects.md`'s `M3E-005` entry (summary-table row plus full registry body) is complete, cross-references `MDCheckbox.browser.spec.ts` by its exact test name, and is structurally consistent with the `M3E-004` Switch precedent.
- `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` exists at the legacy-central location. I independently verified this placement against `docs/testing/migration-plan.md`'s current executable state (Stage S4): only Loading Indicator, Chips, and the now-removed legacy `MDCheckbox` are authorized for owner-local visual placement; the canonical Material `checkbox` family is explicitly **not** one of them (S4-B's own text: "its own visual proof therefore lives at the current central location ... pending its own future Stage S4 authorization"). `IMPLEMENTATION.md`'s claim that "owner-local visual placement is not authorized for `checkbox`" is correct, not a stale migration-era convention.
- The central visual spec's story references (`--visual-states`, `--real-interaction-feedback`) match `MDCheckbox.stories.ts`'s exported `VisualStates`/`RealInteractionFeedback` story IDs exactly, confirmed by direct comparison of both files.

Architecture deviations: none, independently confirmed by direct file comparison, not by trusting either artifact's claim.

## Migration and legacy removal

`MIGRATION.md` (`Artifact revision: 2026-08-13T00:05:00.000Z`, `Status: complete`) was independently re-verified against the current filesystem and source state, not trusted from its own prose:

- **All six consumers directly read and confirmed migrated:** `SettingsCheckboxListItem.vue` (`presentation :checked :disabled` inside `MDListItem role="checkbox"`), `DatabaseViewsSheet.vue` (`presentation :checked="viewId === effectiveViewId"`), `RelationValueFieldData.vue` (`:checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)"`), `MDCheckboxField.vue` (internally composes canonical `MDCheckbox`, translates `boolean | undefined` to `checked`/`indeterminate`, forwards `label` as `aria-label` via `v-bind="hostAttrs"` with a documented `vue/no-restricted-v-bind` exception), `BooleanValueInline.vue` (`presentation :checked :indeterminate` plus an externally composed `MDPlainTooltip`), and `MDListItemConsumerPatternsStory.vue` (imports `MDCheckbox` from `@shared/ui/material`, two `presentation :checked` usages). Every import line matches `MIGRATION.md`'s claims exactly.
- **Four downstream `MDCheckboxField` consumers** (`DatabaseBooleanPropertyEditSection.vue`, `BooleanPropertySettingsSection.vue`, both `BooleanValueField.vue` files) confirmed by direct grep to import only `MDCheckboxField` from `@shared/ui/Checkbox`, never a legacy `MDCheckbox` deep import. `EditableInlineValue.vue` confirmed to import only `toggleBoolean`.
- **Legacy directory state.** `src/shared/ui/Checkbox/` directly listed on the filesystem: contains only `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts`. `MDCheckbox.vue` and its owner-local proof/stories/baselines, and `MDCheckboxPlayground.vue`, are confirmed absent. `index.ts` (directly read) exports only `MDCheckboxField`, `toggleBoolean`, `useBooleanEdit` — no `MDCheckbox` re-export.
- **Repository-wide reference search.** `grep -rn "shared/ui/Checkbox\|Checkbox/MDCheckbox"` across `src` and `tests` found only: the expected `MDCheckboxField`/`toggleBoolean` imports in the five downstream files, the canonical family's own artifacts/story title text, and this family's own doc files (`ARCHITECTURE.md`, `MIGRATION.md`, `roadmap.md`). Zero stray legacy-component references remain anywhere in the workspace.
- **`src/app/playgroundPages.ts`** grepped for `Checkbox`: zero matches, confirming the legacy Playground registration was removed.
- **Blast-radius test proof.** `SettingsCheckboxListItem.test.ts` and `SettingsSections.test.ts` were directly read: both stub `MDCheckbox` from `@shared/ui/material` (not the legacy component), matching `MIGRATION.md`'s described stub-replacement pattern.
- **`RelationValueFieldData`'s pre-existing missing-accessible-name gap** is explicitly recorded as a deliberate, not-silently-perpetuated decision, per the required `AGENTS.md` user-action-preservation rule for scenario-affecting decisions during migration.

No consumer regressed, no legacy file reappeared, and no stray reference to the removed component exists anywhere in the workspace.

## Proof and stage verification

- `pnpm verify --only format --files src/shared/ui/material/components/checkbox/DESIGN.md` — independently run by this review — **passed**.
- `pnpm verify --only format --files <ARCHITECTURE.md, IMPLEMENTATION.md, MIGRATION.md, docs/m3e-defects.md, docs/testing/migration-plan.md>` — independently run by this review — **passed**.
- `docs/testing/migration-plan.md` was read in full: the S2-A post-migration note and S4-B historical note both correctly describe the checkbox family's current proof locations (owner-local `MDCheckbox.browser.spec.ts`; central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`), matching the actual current filesystem state I independently confirmed.
- `docs/component-adapter.md` was read in full; every applicable contract (controlled-state ownership, host-attribute boundary, test-environment seams, verification contract) is satisfied as detailed above.
- Component-owned proof (`MDCheckbox.test.ts`, `MDCheckbox.browser.spec.ts`) was read in full, not merely confirmed present; every claimed assertion in `ARCHITECTURE.md`'s "Proof ownership" and `IMPLEMENTATION.md`'s "Component-owned proof" sections is backed by an actual test in the file.
- Migration-stage focused-verification results (`type-check`, `unit-tests`, `eslint`, `oxlint`, `format`, `visual`, `e2e`, `storybook-build`) recorded in `MIGRATION.md` are the last known-passing record for the unchanged consumer/test/doc files; no migration-owned file changed since that recording, so no new run was required to prove a code change, consistent with `docs/component-adapter.md`'s verification contract.

## Blockers

none

## Major issues

none

## Minor issues

none

## Accepted risks

- `docs/roadmap.md`'s "`REVIEW.md not yet run`" bookkeeping text is stale relative to the current workspace (a prior `REVIEW.md` round already ran and is present, superseded by this revision). This is outside this family's four stage artifacts, owned by the outer orchestrator's mutable-status-recording step, not a Material correction-routable defect. Non-blocking.
- `RelationValueFieldData.vue`'s pre-existing missing-accessible-name gap (no `aria-label` was ever supplied, carried forward by explicit migration-stage decision, not introduced by this family) remains an explicit, previously-recorded, non-blocking product-level follow-up outside this family's own scope — `ARCHITECTURE.md`'s "Risks" and `MIGRATION.md`'s "Migrated consumers" both already record this decision; re-confirmed unchanged by this review.

## Items not required

- `error`/invalid axis, native form participation (`name`/`value`/`required`), a `readonly` axis distinct from `presentation`, an internal tooltip surface, and parent/child indeterminate-group propagation are all explicitly deferred per `ARCHITECTURE.md`'s "Non-goals," each tied to an absence of confirmed current demand. Independently re-confirmed: no consumer passes any of these, and the installed renderer does not model most of them as simple settable properties.
- No `--md-comp-checkbox-*` public token is selected; no current consumer overrides any Checkbox color/geometry/state value. Independently confirmed absent from the component directory (no `tokens.css`) and absent from `docs/token-api.md`.
- Owner-local visual-spec placement for `checkbox` is correctly deferred to a future Stage S4 authorization per `docs/testing/migration-plan.md`; the current central placement (`tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`) is the compliant current state, not a stale legacy pattern this family failed to migrate.
- Promotion of the `ElementInternals` test-support shim to a shared Material test helper is correctly deferred as an explicit follow-up (two independent owners now exist, satisfying the promotion criterion in principle, but promotion is out of scope for a single-family implementation pass per `docs/component-adapter.md`).

## Routing evidence

Not applicable — this is a full independent review, not final-verifier routing. No `pnpm verify`/`pnpm verify:release` output was classified in this pass; the family-scoped focused format checks run above are this review's own independent proof, not outer-workflow final verification.
