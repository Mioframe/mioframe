# Checkbox review

Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Independently re-derived, not trusted from upstream prose. The canonical `MDCheckbox` (`src/shared/ui/material/components/checkbox/MDCheckbox.vue`) is a thin one-host adapter over `m3e-checkbox` (`@m3e/web@2.6.3`, `@m3e/web/checkbox`, `M3eCheckboxElement`). Four scenarios were verified against current source, not only against `ARCHITECTURE.md`'s prose:

1. Editable labeled-field composition — `MDCheckboxField.vue` (`src/shared/ui/Checkbox/MDCheckboxField.vue`), feeding four downstream consumers that only reference `MDCheckboxField`, confirmed by direct read of `DatabaseBooleanPropertyEditSection.vue`, `BooleanPropertySettingsSection.vue`, and both `BooleanValueField.vue` files.
2. Standalone editable multi-select action — `RelationValueFieldData.vue` (`src/features/relationValueEdit`), read directly: `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`, no `aria-label` supplied (confirmed pre-existing, not silently perpetuated — recorded in `ARCHITECTURE.md` Risks and `docs/roadmap.md`).
3. Decorative list-item/row composition (`presentation`) — `SettingsCheckboxListItem.vue` and `DatabaseViewsSheet.vue`, both read directly and confirmed to compose `MDCheckbox presentation` inside an owner (`MDListItem role="checkbox"` / a selectable row) that owns the real interaction.
4. Decorative read-only value display (`presentation`, consolidated) — `BooleanValueInline.vue`, read directly: `checked = convertedValue === true`; `indeterminate = property.indeterminate === true && convertedValue === undefined`. This is the required legacy-capability-flag-to-rendered-state translation, independently re-verified against `BooleanValueInline.test.ts`'s seven boundary-combination cases (all passing, see Proof section).

No consumer, current or default-scenario, was found outside these four. `MDListItemConsumerPatternsStory.vue` is a Storybook-only fixture, correctly not treated as product demand.

## Official design compliance

`DESIGN.md` records the complete 81-token `md.comp.checkbox` catalogue with `unresolvedTokenCount: 0`, a full source ledger, and 11 explicitly logged source conflicts/unknowns (indeterminate has no dedicated tokens, unresolved outline-width serialization, high-contrast alpha-fragment serialization, missing high-contrast values on `selected.disabled.icon.color`, the official "focusd" typo, the chip-terminology keyboard table, unpublished motion/role/contrast statements, unstated unselected-icon visibility, and cache-freshness bookkeeping). These are preserved verbatim rather than silently resolved, consistent with source-fidelity requirements. `Status: current`; no blocker recorded. Independently spot-checked: the token catalogue's disabled-state color role reassignments (unselected disabled outline → `on-surface`, selected disabled container → `on-surface`, selected disabled icon → `surface` with no HC values) are correctly carried into `ARCHITECTURE.md`'s renderer-mapping row and are not reproduced as public Mioframe tokens, matching the "no scenario requires them" selection rule.

## Architecture compliance

Independently re-derived from `MDCheckbox.vue`, `m3eCheckbox.d.ts`, `config/vueCustomElements.ts`, and all four consumer scenarios, not accepted from `ARCHITECTURE.md`'s own revision-summary claims.

- **Renderer routing is independently verifiable.** `config/vueCustomElements.ts`'s `selectedM3eCustomElements` set contains `m3e-checkbox` (confirmed by direct read); `m3eCheckbox.d.ts` declares `RendererCheckboxProps = Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>` and an explicit `onBeforeinput?: (event: Event) => void` (correctly typed as a plain `Event`, not the ambient `InputEvent`, matching the renderer's actual dispatch).
- **Controlled-state lifecycle independently traced.** `MDCheckbox.vue`'s `onBeforeinput` handler: narrows `event.target instanceof M3eCheckboxElement`, no-ops when `props.presentation` (no `preventDefault()`, no emit — verified against source line-by-line), otherwise calls `event.preventDefault()` before computing `!event.target.checked` / `false` and emitting both `update:checked`/`update:indeterminate`. No wrapper-owned duplicate `ref`, no `watch`/`watchEffect` repair exists anywhere in the file. One source of truth (`checked`/`indeterminate` props → renderer, one-directionally) is independently confirmed, not merely asserted.
- **Accepted-intent path proven:** `MDCheckbox.test.ts` "re-controls the renderer checked/indeterminate properties when the props change" independently exercises writing the emitted value back into props and confirms the renderer property updates.
- **Rejected-intent path proven, not merely asserted:** `MDCheckbox.test.ts`'s "rejected intent" case dispatches `beforeinput`, confirms the emission, and then independently asserts the renderer's `checked`/`indeterminate` properties remain at their prior values because the props were never written back — matching `MDCheckbox.browser.spec.ts`'s real-browser equivalent (`RejectedIntent` story). No surviving optimistic drift exists.
- **Host-attribute boundary matches the selected allow-list exactly.** `getForwardedAttrs()` forwards only `id`, `title`, `aria-label`, `aria-labelledby`, and `data-*`; `class`/`style` are merged in the template so the adapter-owned class always wins. Independently confirmed against `ARCHITECTURE.md`'s allow-list table with no drift in either direction.
- **Simplest-viable-alternative check:** a thin single-host adapter with one `beforeinput` listener and no adapter framework is the minimum complete design for the four confirmed scenarios; no unjustified abstraction (registry, generic controlled-state framework, tooltip anatomy) was added.
- **Renderer revision (`@m3e/web@2.6.3`) matches the installed package** (confirmed via the same import path used across `MDCheckbox.vue`, `m3eCheckbox.d.ts`, and `MDSwitch`'s sibling family for comparison).

No architecture defect found.

## Implementation compliance

Every one of `ARCHITECTURE.md`'s 11 implementation passes was independently checked against current files, not accepted from `IMPLEMENTATION.md`'s claims:

- Pass 1 (adapter creation): confirmed — `components/checkbox/index.ts` exports `MDCheckbox`; root `src/shared/ui/material/index.ts` re-exports it; `m3e-checkbox` registered in `config/vueCustomElements.ts`.
- Pass 2/3 (host-attribute boundary, one-directional mapping, `beforeinput` handler): confirmed by direct source read (see Architecture compliance above).
- Pass 4 (click/Space/Enter proof): confirmed present and independently re-run (`storybook-behavior`, passed — see Proof section); Enter-no-op assertion present (`changeCount` stays `'0'`).
- Pass 5 (adjacent-label + accessible-name proof): `AdjacentLabel` and `BehaviorContracts` stories/specs present; the native-`<label>`-name-gap check is present and correctly resulted in the `M3E-005` entry in `docs/m3e-defects.md` (independently read in full — complete, cross-referenced, `Mioframe status: workaround-active`).
- Pass 6 (presentation composition fixture): `PresentationComposition` story + browser spec test present, independently re-run and passing.
- Pass 7 (component-contract proof audit): `MDCheckbox.test.ts` independently read in full (278 lines) — covers defaults, Boolean-property (not attribute) mapping, single-emission-pair intent computed pre-mutation, rejected-intent non-mutation, `presentation`/`disabled` non-emission, the complete host-attribute allow-list/rejection matrix including dynamic add/remove/re-add and duplicate-listener rejection, and forbidden renderer surface (`name`, `value`, `required`).
- Pass 8 (test-environment seam decision): `MDCheckbox.testUtils.ts` independently read — a Checkbox-local duplicate of the Switch shim with an explicit, reasoned rationale for not promoting it (editing another already-reviewed family's file from a single-family worker is out of scope). This is a legitimate documented decision, not a silent duplication.
- Pass 9 (stories): `MDCheckbox.stories.ts` independently read in full (335 lines) — covers exactly the selected surface plus `Presentation`, `PresentationComposition`, `RejectedIntent`, `BehaviorContracts`, `AdjacentLabel`, `TabOrderFixture`, `TargetHitArea`, `HostAttributeBoundary`, `VisualStates`, `RealInteractionFeedback`. No icon/error/readonly/form-participation story exists, matching the Non-goals.
- Pass 10 (visual proof): `MDCheckbox.visual.spec.ts` present at the owner-local location with colocated `MDCheckbox.visual.spec.ts-snapshots/` containing four baseline PNGs (`states`, `hover`, `focus`, `pressed`); independently re-run and passing with zero baseline diff (see Proof section).
- Pass 11 (`IMPLEMENTATION.md`): present, `Status: complete`, `Architecture deviations: none`.

No `components/checkbox/tokens.css` file exists and no `docs/token-api.md` entry references Checkbox (independently confirmed by grep), matching the zero-token architecture decision.

No architecture deviation found; implementation matches every selected decision.

## Migration and legacy removal

Independently re-derived by grepping `MDCheckbox` across `src` from scratch and reading every match directly, not trusted from `MIGRATION.md`'s consumer inventory.

- **Legacy `src/shared/ui/Checkbox/MDCheckbox.vue` is confirmed absent.** Directory listing shows exactly `MDCheckboxField.vue`, `MDCheckboxField.test.ts`, `index.ts`, `toggleBoolean.ts` — no legacy `MDCheckbox.vue`, no `MDCheckboxPlayground.vue`, no legacy owner-local proof.
- **All six real/fixture consumers independently read and confirmed to compose the canonical `MDCheckbox` correctly**, with no drift from `ARCHITECTURE.md`'s scenarios or required translations:
  - `SettingsCheckboxListItem.vue`: `<MDCheckbox v-else presentation :checked="checked" :disabled="disabled" />` inside `MDListItem`'s `trailing` slot; `MDListItem` owns role/`aria-checked`/`@action`. Matches.
  - `DatabaseViewsSheet.vue`: `<MDCheckbox presentation :checked="viewId === effectiveViewId" />` inside `DatabaseViewListEdit`'s `leading` slot; the row's own `@click-view` owns selection. Matches.
  - `RelationValueFieldData.vue`: `<MDCheckbox :checked="selectedValue.includes(itemId)" @update:checked="onUpdateSelectedValue(itemId)" />`; no `aria-label`, confirmed a pre-existing, explicitly recorded gap (not silently perpetuated — see `ARCHITECTURE.md` "Risks" and `docs/roadmap.md` "Known non-blocking follow-up"). Matches.
  - `MDCheckboxField.vue`: composes canonical `MDCheckbox`, `checked = modelValue === true`, `showIndeterminate = !!props.indeterminate && modelValue === undefined`, forwards `hostAttrs = { id, 'aria-label': props.label }` via `v-bind`, uses `update:checked` only as a one-per-activation trigger for its own `toggleBoolean` cycle. This is the correct required translation and correct accessible-name backstop. Matches.
  - `BooleanValueInline.vue`: `<MDCheckbox presentation :checked="checked" :indeterminate="indeterminate" />` plus an externally composed `<MDPlainTooltip :text="name" />`; `checked = convertedValue === true`; `indeterminate = property.indeterminate === true && convertedValue === undefined`. This is the exact required capability-flag-to-rendered-state translation, and `boolean.ts` confirms `indeterminate: optional(boolean())` is indeed a plain capability flag, not rendered state, so this translation is not merely name/type coincidence — it is independently re-derived and re-verified against `BooleanValueInline.test.ts`'s seven boundary-combination cases (all passing). Matches.
  - `MDListItemConsumerPatternsStory.vue`: Storybook-only fixture, `<MDCheckbox presentation ... />`, not a product scenario, correctly excluded from the scenario list.
- **No stray, untracked, or unaccounted consumer found.** The grep hits on `EditableInlineValue.vue`, `DatabaseBooleanPropertyEditSection.vue`, both `BooleanValueField.vue` files, and `BooleanPropertySettingsSection.vue` were independently confirmed to be substring matches on `MDCheckboxField`/`toggleBoolean`, not direct `MDCheckbox` usage — consistent with `MIGRATION.md`'s claim that those four consumers only reference `MDCheckboxField`.
- **`docs/testing/migration-plan.md`'s Stage S4-B and S2-A entries** were independently read in full and correctly describe the legacy component's removal and the canonical family's owner-local visual/browser ownership as complete, historical facts (not stale pending-authorization claims).
- **`docs/roadmap.md`'s Checkbox state** was independently read: correctly records the `RelationValueFieldData.vue` accessible-name gap as a recorded, not-silently-perpetuated follow-up, and (pre-review) records milestone status pending this fresh review pass — mutable status ownership belongs to `roadmap.md`, not a review-owned finding.

No legacy-to-canonical semantic-translation defect found; no consumer left un-migrated; no compatibility alias survives.

## Proof and stage verification

Independently executed this pass (not accepted from any upstream artifact's "passed" claims):

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/checkbox/MDCheckbox.test.ts src/widgets/SettingsSections/SettingsCheckboxListItem.test.ts src/widgets/SettingsSections/SettingsSections.test.ts src/entities/databaseBoolean/BooleanValueInline.test.ts src/shared/ui/Checkbox/MDCheckboxField.test.ts eslint.config.test.ts config/vueCustomElements.test.ts` — passed.
- `pnpm verify --only eslint --files <10 checkbox-family/config files>` — passed.
- `pnpm verify --only format --files <8 checkbox-family files>` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/checkbox/MDCheckbox.browser.spec.ts` — passed (real Chromium run, all scenarios including click/Space/Enter, adjacent-label, accessible name, rejected intent, tab order, presentation isolation and composition, 48dp target, host-attribute boundary).
- `pnpm verify --only visual --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed (zero baseline diff against the four colocated snapshots).

Proof ownership matches `docs/testing/migration-plan.md`'s current executable state: owner-local colocated `*.browser.spec.ts`/`*.visual.spec.ts` discovery is confirmed executable by these passing runs, not merely claimed.

Operator visual status: no-reported-defect. No concrete operator-reported visual/motion defect was supplied for this review; per `src/shared/ui/material/AGENTS.md`, absence of positive visual acknowledgement does not block completion.

## Blockers

none

## Major issues

none

## Minor issues

none

## Accepted risks

none

## Items not required

- Component-specific `--md-comp-checkbox-*` tokens: no confirmed contextual-override scenario exists; correctly not added.
- `error`/`readonly`/tooltip/form-participation/icon-configuration surface: no confirmed scenario; correctly not added, and correctly forbidden by `ARCHITECTURE.md`'s "Forbidden" section.
- Parent/child indeterminate-group propagation: correctly deferred to a future composing owner; no current consumer needs it.
- Promotion of the `ElementInternals` test shim to a shared Material test helper: a legitimate, explicitly reasoned duplicate-not-promote decision; not required for this review's completion.

## Routing evidence

No defect was found at any stage, so no route is assigned. Verified directly, independent of upstream artifact prose:

- Design: source ledger, token catalogue (`unresolvedTokenCount: 0`), and 11 logged conflicts/unknowns independently spot-checked against `ARCHITECTURE.md`'s use of them — no missing/incorrect official fact found.
- Architecture: renderer routing (`config/vueCustomElements.ts`), controlled-state lifecycle (`MDCheckbox.vue` `onBeforeinput`), and host-attribute allow-list independently traced against source, not accepted from prose — no incorrect demand/API/ownership/renderer-strategy/proof-ownership/migration-plan defect found.
- Implementation: every architecture-selected pass independently matched against current `MDCheckbox.vue`, `m3eCheckbox.d.ts`, test/story/spec files — no component-code, token, mapping, export, or local-proof defect found.
- Migration: every one of six consumers independently re-derived via fresh grep and read directly — no consumer, legacy-removal, or migration-proof defect found.
- Focused verifier commands independently re-executed by this review (not reused from any upstream artifact's logs) — all six passed.
