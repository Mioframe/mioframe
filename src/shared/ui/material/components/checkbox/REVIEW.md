# Checkbox review

Artifact revision: 2026-08-13T11:00:00.000Z
DESIGN.md contract revision: 2026-08-12T14:38:31.628Z
ARCHITECTURE.md revision: 2026-08-13T06:41:40.600Z
IMPLEMENTATION.md revision: 2026-08-13T06:47:59.000Z
MIGRATION.md revision: 2026-08-13T06:51:14.000Z
Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: `RelationValueFieldData.vue` carries a pre-existing missing-accessible-name gap on its standalone relation-selection checkbox (no `aria-label`/`aria-labelledby` was ever supplied). Independently re-confirmed unchanged and untouched by this round (`RelationValueFieldData.vue` composes `MDCheckbox` with only `:checked`/`@update:checked`). Predates this family, is explicitly recorded as a deliberate, not-silently-perpetuated decision in `ARCHITECTURE.md`'s "Risks" and `MIGRATION.md`'s "Migrated consumers," and remains an explicit non-blocking product-level follow-up outside this family's own scope.

## Goal and scenarios reviewed

Fresh, isolated review worker with no memory of any prior `REVIEW.md` round or of authoring `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, or `MIGRATION.md`. This round exists because all four upstream artifacts were freshly reissued to correct a stale visual-proof-ownership claim: the prior `REVIEW.md` (`Verdict: compliant-with-listed-risks`, artifact revision `2026-08-12T20:17:22.000Z`) was written against an artifact set that placed the canonical family's visual proof at the legacy central location `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`, reasoning that owner-local placement was authorized only for the already-completed Stage S3/S4 groups. `ARCHITECTURE.md` (`Artifact revision: 2026-08-13T06:41:40.600Z`) corrected that reasoning against `docs/testing/migration-plan.md`'s "Migration constraints" and Stage S4's own rule (a canonical Material family migration may establish final owner-local visual ownership directly in its own workflow, mirroring the Stage S4-D/MDSwitch precedent, without a separate later S4 move) and selected the owner-local target. `IMPLEMENTATION.md` (`Artifact revision: 2026-08-13T06:47:59.000Z`) recorded the physical relocation. `MIGRATION.md` (`Artifact revision: 2026-08-13T06:51:14.000Z`) recorded the matching `docs/testing/migration-plan.md`/`docs/roadmap.md` documentation corrections. No consumer, `MDCheckbox.vue`, or `BooleanValueInline.vue` semantic content changed in this round — this is a proof-ownership-only correction.

Every claim below was independently re-derived from the current workspace by direct file reads, direct filesystem listings, and independently executed `pnpm verify --only <label> --files ...` commands — never trusted from any upstream artifact's prose alone, and without depending on Git status, diff, or PR metadata.

Reviewed scenarios (from `ARCHITECTURE.md` "Current scenarios," independently cross-checked against the real current consumer source files, unchanged from the prior round):

1. Editable labeled-field composition via `MDCheckboxField.vue` (`src/shared/ui/Checkbox/MDCheckboxField.vue`), feeding four downstream product consumers: `DatabaseBooleanPropertyEditSection.vue`, `BooleanPropertySettingsSection.vue`, and both `BooleanValueField.vue` files.
2. Standalone editable multi-select action (`RelationValueFieldData.vue`).
3. Decorative list-item/row `presentation` composition (`SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`).
4. Decorative read-only value display, `presentation` (`BooleanValueInline.vue`), with the legacy-capability-flag-to-canonical-rendered-state translation.

A sixth consumer not named in `ARCHITECTURE.md`'s scenario list (`MDListItemConsumerPatternsStory.vue`, a Storybook-only fixture) was independently confirmed still present, matching `MIGRATION.md`'s own disclosure. A repository-wide grep for `MDCheckbox` under `src` independently confirmed the same consumer set `MIGRATION.md` records: no untouched or stray consumer, no reappeared legacy `src/shared/ui/Checkbox/MDCheckbox.vue`.

## Official design compliance

`DESIGN.md` (`Design contract revision: 2026-08-12T14:38:31.628Z`, `Artifact revision: 2026-08-12T20:03:37.994Z`, `Status: current`) is unchanged from the prior review round — its contract revision matches `ARCHITECTURE.md`'s `DESIGN.md contract revision` reference exactly. Per this skill's rule, an unchanged design contract revision does not require re-review. No official fact used by `ARCHITECTURE.md` was found missing, mischaracterized, or unsupported.

## Architecture compliance

`ARCHITECTURE.md` (`Artifact revision: 2026-08-13T06:41:40.600Z`, `Status: ready`) was read in full, including its revision summary and the full text of pass 10 (implementation passes), the TEST IMPACT visual-proof-owner entry, and the acceptance-criteria visual-baseline line.

- **The revision's sole substantive content is the visual-proof-ownership correction.** The revision summary explicitly states that no other section changed: `BooleanValueInline.vue`'s translation (scenario 4, migration plan step 5) is unchanged and remains correct, independently re-confirmed against the same pre-migration legacy Checkbox evidence already cited in the prior revision. I independently verified this claim rather than trusting it — see "Migration and legacy removal" below.
- **The routing rationale is independently verifiable, not merely asserted.** I independently read `docs/testing/migration-plan.md`'s "Migration constraints" ("A canonical Material family migration may establish final owner-local Storybook browser/visual ownership in the same family workflow once mixed discovery can execute that convention; do not require a separate later S4 move") and Stage S4's own rule, and confirmed both support the architecture's routing decision. I independently read `src/shared/ui/material/components/switch/MDSwitch.visual.spec.ts` and confirmed the Stage S4-D (MDSwitch) precedent architecture cites is real: MDSwitch's visual proof is a colocated `<Owner>.visual.spec.ts` file using the identical `openStory`/`getByTestId`/`toHaveScreenshot` pattern the Checkbox spec now follows.
- **`MDCheckbox`'s own selected surface, public API, tokens, and renderer mapping remain unchanged from the previously-compliant state.** I independently read the current `MDCheckbox.vue` line-by-line: identical `checked`/`indeterminate`/`disabled`/`presentation` props with the documented defaults; identical `inheritAttrs: false`; identical `getForwardedAttrs()`/`getMergedAttrs()` host-attribute allow-list (`id`, `title`, `aria-label`, `aria-labelledby`, `data-*`, merged `class`/`style`); identical `onBeforeinput` handler narrowing `event.target` with `instanceof M3eCheckboxElement`, no-op under `presentation` before computing anything, otherwise `preventDefault()` before emitting `update:checked(!event.target.checked)`/`update:indeterminate(false)`. This is byte-for-byte the same contract the prior review round independently verified — no runtime/API/token/renderer-mapping change was smuggled into this "proof relocation only" round.
- **Controlled-state trace (review order step 3), re-independently confirmed.** One source of truth (`checked`/`indeterminate` props), one explicit accepted-intent path, one explicit rejected-intent path (proven non-divergent by `MDCheckbox.test.ts`'s and `MDCheckbox.browser.spec.ts`'s rejected-intent cases, both unchanged), no renderer-owned optimistic mutation.
- **No new registry, resolver, or generic visual-testing framework.** I independently read `playwright.visual.config.ts`: `testMatch: ['tests/e2e/visual/**/*.spec.ts', 'src/**/*.visual.spec.ts']`, unchanged, no Checkbox-specific entry. I independently grepped `scripts/lib/*.mjs` (excluding test fixtures) for `checkbox`/`Checkbox` and found zero non-test references — ownership resolution is purely filesystem-derived (`<spec>.visual.spec.ts` next to `<spec>.visual.spec.ts-snapshots/`), matching the existing Loading Indicator/Chips/MarkdownContent/Switch convention exactly, with no Checkbox-specific special-casing anywhere in the verifier planner.
- **`docs/component-adapter.md` compliance.** Re-confirmed: host-attribute allow-list matches the documented minimum common set plus a justified extension; no `v-bind="$attrs"` spread; controlled-state ownership record complete. Unaffected by this round's proof-relocation-only change.
- **Simplicity check.** The relocation is a plain colocated-file move (spec + four PNGs), changing only the `openStory` relative import path — no adapter, registry, or compatibility layer was introduced. No simpler viable alternative exists that still satisfies the migration-plan's owner-local-ownership rule.

No architecture defect was found.

## Implementation compliance

`IMPLEMENTATION.md` (`Artifact revision: 2026-08-13T06:47:59.000Z`, `Status: complete`) documents the visual-proof relocation. I independently verified the physical claims by direct filesystem inspection rather than trusting the prose:

- `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` exists (2,979 bytes).
- `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts-snapshots/` exists and contains exactly four baseline PNGs: `md-checkbox-states-linux.png`, `md-checkbox-hover-linux.png`, `md-checkbox-focus-linux.png`, `md-checkbox-pressed-linux.png`.
- `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and any corresponding `-snapshots/` directory do **not** exist — confirmed by directly listing `tests/e2e/visual/shared-ui/` in full: the directory contains specs/snapshots only for `md-fab-family`, `md-icon-button`, `color-ownership`, `md-menu`, `md-list`, `md-button`; no `checkbox`-named entry anywhere.
- I independently read the relocated spec in full and confirmed it preserves the same coverage as the legacy spec's documented scope: one test covering unselected/selected/indeterminate/disabled/presentation states (`visual-md-checkbox-states` surface, `md-checkbox-states.png`), plus three real-interaction tests driving actual pointer hover, keyboard `Tab` focus, and pointer press against the public `MDCheckbox` host (`visual-md-checkbox-real-interaction` surface), each captured with `animations: 'disabled'` and none inspecting the private m3e shadow DOM.
- I independently compared this structure against `MDSwitch.visual.spec.ts` and confirmed both follow an identical convention: same `openStory` import path (`../../../../../../tests/e2e/visual/storybook`), same `getByTestId`/`toHaveScreenshot` pattern, same colocated `-snapshots/` directory shape. The two differ only in scope (Checkbox proves hover/focus/pressed real-interaction feedback in addition to the states grid; Switch proves only the states grid) — a legitimate per-family coverage difference, not a structural inconsistency.
- The relocated spec's story IDs (`material-3-components-checkbox-mdcheckbox--visual-states`, `material-3-components-checkbox-mdcheckbox--real-interaction-feedback`) resolve to real exports (`VisualStates`, `RealInteractionFeedback`) in `MDCheckbox.stories.ts`, both tagged `visual`.
- `MDCheckbox.test.ts`, `MDCheckbox.testUtils.ts`, `MDCheckbox.browser.spec.ts`, `MDCheckbox.stories.ts`, and `MDCheckbox.vue` are unchanged from the previously-compliant state (confirmed by direct content comparison against the prior review round's line-by-line record, reproduced above).
- `docs/m3e-defects.md`'s `M3E-005` entry (summary row + full registry body, cross-referencing `MDCheckbox.browser.spec.ts`) is present and unaffected.

Architecture deviations: none, independently confirmed by direct file comparison.

## Migration and legacy removal

`MIGRATION.md` (`Artifact revision: 2026-08-13T06:51:14.000Z`, `Status: complete`) was independently re-verified against the current filesystem and current documentation files, not trusted from its own prose.

- **`BooleanValueInline.vue`, independently re-read in full.** The current file computes `checked = computed(() => convertedValue.value === true)` and `indeterminate = computed(() => property.value.indeterminate === true && convertedValue.value === undefined)`, using the pre-existing `convertedValue = computed(() => isBoolean(value.value) ? value.value : property.value.default)`. This exactly matches the required formula stated in the task context (`checked = effectiveValue === true`; `indeterminate = property.indeterminate === true && effectiveValue === undefined`) and is byte-for-byte unchanged from the prior review round's independently-verified record. The `presentation` prop usage and the externally-composed `MDPlainTooltip` are unchanged.
- **All six boundary combinations independently re-verified present and correct** by reading `BooleanValueInline.test.ts` in full and independently executing it (see "Proof and stage verification"): effective `true` with the capability flag enabled → `checked=true`/`indeterminate=false`; effective `false` with the flag enabled → `checked=false`/`indeterminate=false`; unresolved `undefined` with no default, flag enabled → `checked=false`/`indeterminate=true`; `undefined` resolved through a `true` default → `checked=true`/`indeterminate=false`; `undefined` resolved through a `false` default → `checked=false`/`indeterminate=false`; `undefined` with no default, flag disabled → `checked=false`/`indeterminate=false`. A seventh test independently confirms `presentation` is always forwarded `true`. All seven passed.
- **`docs/testing/migration-plan.md` no longer contains any claim that canonical Checkbox visual proof remains central or is awaiting a future S4 authorization.** I independently read the full "Completed foundation," "Still transitional," and Stage S4-B sections. Stage S4-B (line 350) is explicitly retitled "MDCheckbox visual ownership (complete, historical — legacy component removed)" and its body states plainly: "The canonical Material `checkbox` family was never itself one of the Stage S3/S4 owner-local-authorized visual groups... Instead, mirroring the Stage S4-D (MDSwitch) precedent, the canonical Material `checkbox` family established its own owner-local visual ownership directly through its own Material family migration workflow... The S4-B record below remains as the historical account of the legacy component's now-removed owner-local visual proof; it does not describe current executable state for `checkbox`." The "Still transitional" list (line 57) states: "Loading Indicator, Chips, MarkdownContent, MDSwitch, the canonical Material `checkbox` family, and (formerly) legacy MDCheckbox use the owner-local visual convention... The canonical Material `checkbox` family established its own owner-local visual ownership... directly through its own Material family migration workflow, mirroring the Stage S4-D (MDSwitch) precedent, not through a separate S4 group." No stale central/pending-S4 claim remains anywhere in the document for the canonical family.
- **`docs/roadmap.md`'s Checkbox-specific status text is corrected and consistent with the current artifact state.** Independently read in full: "Current milestone" and "Current state" both describe the visual-ownership correction as complete across architecture/implementation/migration/documentation, leaving only a fresh independent review as the remaining step — which this review now supplies.
- **Five other consumers independently re-confirmed unchanged and correct** by direct source reads: `SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`, `RelationValueFieldData.vue` (confirmed via direct read: `:checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)"`, no accessible-name attribute — the pre-existing gap remains untouched, consistent with the accepted risk), `MDCheckboxField.vue` (its own independently-derived `checked`/`showIndeterminate` translation, unaffected), `MDListItemConsumerPatternsStory.vue`.
- **Legacy ownership.** Independently re-confirmed via repository-wide grep for `MDCheckbox` under `src`: the complete consumer set matches `MIGRATION.md`'s inventory exactly. No legacy `src/shared/ui/Checkbox/MDCheckbox.vue` reappeared; `src/shared/ui/Checkbox/` still contains only `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts`.

## Proof and stage verification

Independently executed by this review (not merely re-read from `MIGRATION.md`'s or `IMPLEMENTATION.md`'s recorded results), via `pnpm verify --only <label> --files ...` per the `verification` skill:

- `pnpm verify --only unit-tests --files src/entities/databaseBoolean/BooleanValueInline.vue src/entities/databaseBoolean/BooleanValueInline.test.ts` — passed. All seven `BooleanValueInline` test cases (six boundary combinations plus the `presentation` forwarding case) passed against the real, current production file.
- `pnpm verify --only visual --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed. The verifier's filesystem-derived planner recognized the colocated visual spec (`trigger: changed colocated visual spec ... -> ...`, no manual registry entry) and ran all four tests (states grid, hover, focus, pressed) against the relocated baselines with zero diff, independently confirming the relocation preserved pixel-identical coverage.

`docs/testing/migration-plan.md` and `docs/component-adapter.md` were independently read in full; both are consistent with the current filesystem state for this family. No production, story, browser-spec, or other proof file changed in this correction round beyond the relocated visual spec and its baselines, so the prior migration pass's `type-check`, `eslint`, `oxlint`, `format`, `storybook-build`, and `e2e` results remain the last known-passing record for the files this round did not touch.

## Blockers

none

## Major issues

none

## Minor issues

none

## Accepted risks

- `RelationValueFieldData.vue`'s pre-existing missing-accessible-name gap (no `aria-label`/`aria-labelledby` was ever supplied on its standalone relation-selection checkbox). Predates this family, independently re-confirmed unchanged and untouched by this correction round, and already explicitly recorded as a deliberate non-blocking product-level follow-up in `ARCHITECTURE.md`'s "Risks" and `MIGRATION.md`'s "Migrated consumers."

## Items not required

- `error`/invalid axis, native form participation, a `readonly` axis distinct from `presentation`, an internal tooltip surface, and parent/child indeterminate-group propagation remain explicitly deferred per `ARCHITECTURE.md`'s "Non-goals," unaffected by this round.
- Promotion of the `ElementInternals` test-support shim to a shared Material test helper remains correctly deferred as an explicit follow-up, unaffected by this round.
- Broader normalization of owner-local visual ownership across all remaining central-location visual specs (`docs/testing/migration-plan.md`'s "Still transitional" list) remains later migration work outside this family's scope; this round's relocation is scoped correctly to the Checkbox family only.

## Routing evidence

Not applicable — this is a full independent review, not final-verifier routing. No `pnpm verify`/`pnpm verify:release` full-suite output was classified in this pass; the focused commands run above are this review's own independent proof, not outer-workflow final verification.
