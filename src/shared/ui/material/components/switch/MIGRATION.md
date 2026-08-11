# Switch migration

Artifact revision: 2026-08-11T05:15:00.000Z
Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/switch/IMPLEMENTATION.md`
IMPLEMENTATION.md revision: 2026-08-11T05:00:00.000Z
Revision summary: Revalidation-only refresh against the corrected `IMPLEMENTATION.md` revision (routed `self/implementation` correction from `REVIEW.md`: two forbidden `as` type assertions fixed in `MDSwitch.vue`'s `onChange` and in `tests/e2e/storybook/md-switch-family.spec.ts`, a template-literal warning fix extracted `getMergedAttrs()`, plus five formatting-only files; no architecture, public API, token, or behavioral change). Direct inspection of the corrected `MDSwitch.vue` and both migrated consumers confirms this correction does not apply to them: both consumers render `MDSwitch presentation :selected :disabled`, and `onChange`'s `if (props.presentation) { return; }` guard runs before the corrected `instanceof M3eSwitchElement` narrowing, so the changed code path is never reached from either consumer. Neither consumer imports or references the touched spec file. No consumer code changed; focused type-check and unit-tests for both consumers reran clean as confirmation.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Revalidation note (2026-08-11T05:15:00.000Z)

`IMPLEMENTATION.md` was revalidated against a corrected artifact revision (`2026-08-11T05:00:00.000Z`), routed from `REVIEW.md`'s `self/implementation` correction: a fresh outer `pnpm verify` run had surfaced two forbidden `as` type-assertion errors (`@typescript-eslint/consistent-type-assertions`). `MDSwitch.vue:55`'s `onChange` now narrows `event.target` with a runtime `instanceof M3eSwitchElement` guard instead of an `as M3eSwitchElement` cast; `tests/e2e/storybook/md-switch-family.spec.ts:92` now uses Playwright's generic `Locator.evaluate<R, E>()` element-type parameter instead of a double `as` assertion; a template literal warning was independently resolved by extracting a `getMergedAttrs()` helper; five files received formatting-only fixes. `ARCHITECTURE.md` revision (`2026-08-11T02:00:00.000Z`), public API, tokens, and migration readiness (`ready`) are all unchanged from the prior revalidation.

This worker directly re-read the corrected `MDSwitch.vue` and both migrated consumers rather than assuming the prior migration content still applied unchanged:

- Both consumers (`SettingsSwitchListItem.vue`, `AppUpdateSettings.vue`) render `MDSwitch presentation :selected="..." :disabled="..."`. In `MDSwitch.vue`'s `onChange`, the `if (props.presentation) { return; }` early-return executes before the corrected `instanceof M3eSwitchElement` narrowing is ever reached, so neither consumer's runtime path touches the changed lines at all.
- The `getMergedAttrs()` extraction changes only how the existing host-attribute allow-list and presentation-suppression attrs are combined for `v-bind`; the merged attribute set and precedence are unchanged, and neither consumer forwards any attribute through `MDSwitch` beyond `presentation`/`selected`/`disabled`.
- Neither consumer imports, mocks, or otherwise depends on `tests/e2e/storybook/md-switch-family.spec.ts`, the only other file the correction touched.

Because the corrected code path is structurally unreachable from either consumer's usage, this correction has no consumer-facing effect. No consumer file changed. `pnpm verify --only type-check` and `pnpm verify --only unit-tests --files src/widgets/SettingsSections/SettingsSwitchListItem.vue src/widgets/SettingsSections/SettingsSwitchListItem.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.vue src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts` both reran clean as fresh confirmation. All content below this note (consumer inventory, migrated consumers, preserved scenarios, legacy removal, prior revalidation note, and the original stage verification) was produced by prior migration passes and remains accurate; it is preserved unchanged as the durable record of that work.

## Revalidation note (2026-08-11T02:30:00.000Z)

`IMPLEMENTATION.md` was revalidated against a corrected `ARCHITECTURE.md` revision (`2026-08-11T02:00:00.000Z`): a documentation-accuracy correction reclassified native `<label>` wrapping/explicit `for`/`id` accessible-name association for `m3e-switch` from `direct` to `divergent` (`M3E-004`). No runtime, token, mapping, story, spec, or public-API change occurred at implementation, and migration readiness remained `ready`.

This worker directly re-inspected both migrated consumers (`SettingsSwitchListItem.vue`, `AppUpdateSettings.vue`) against the corrected classification rather than assuming the prior migration content still applied unchanged:

- Neither consumer wraps `MDSwitch` in a native `<label>` element or pairs an `id` with a `for` attribute to derive an accessible name for the switch.
- Both render `MDSwitch presentation :selected="..." :disabled="..."` — `presentation` mode makes the rendered `m3e-switch` `aria-hidden="true"` and `tabindex="-1"`, fully removed from the accessibility tree and keyboard order.
- In both consumers, `role="switch"`, `aria-checked`, `aria-disabled`, and the accessible name (`label-text`) belong to the enclosing `MDListItem` row, not to `MDSwitch`. The row, not the switch, is the interactive and nameable element.

Because the reclassified accessible-naming mechanism is never exercised by either consumer, this correction has no consumer-facing effect. No consumer file changed. `pnpm verify --only type-check` and `pnpm verify --only unit-tests --files src/widgets/SettingsSections/SettingsSwitchListItem.vue src/widgets/SettingsSections/SettingsSwitchListItem.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.vue src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts` both reran clean as fresh confirmation. All content below this note (consumer inventory, migrated consumers, preserved scenarios, legacy removal, and the original stage verification) was produced by the prior migration pass and remains accurate; it is preserved unchanged as the durable record of that work.

## Consumer inventory

A repository-wide search for `shared/ui/Switch` and `shared-ui-mdswitch` (the legacy Storybook title slug) found exactly two product consumers of the legacy `MDSwitch` (`src/shared/ui/Switch/MDSwitch.vue`), matching ARCHITECTURE.md's confirmed inventory exactly:

- `src/widgets/SettingsSections/SettingsSwitchListItem.vue` — renders `MDSwitch presentation :selected="checked" :disabled="disabled"` as the trailing visual inside an `MDListItem` that owns `mode="single-action" role="switch" :aria-checked` and the click-driven toggle.
- `src/widgets/AppUpdateSettings/AppUpdateSettings.vue` — renders `MDSwitch presentation :selected="mode === 'automatic'" :disabled="isAutomaticToggleDisabled"` as the trailing visual inside an equivalent `MDListItem` "Automatic updates" row.

Three additional non-product references to the legacy import path were found and are not consumers of runtime behavior: `src/widgets/SettingsSections/SettingsSections.test.ts` and `src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts` mocked `@shared/ui/Switch` for their respective widget's own test isolation, and `src/shared/ui/State/MDStateLayer.test.ts` listed `src/shared/ui/Switch/MDSwitch.vue` in a static `productionSharedUiFiles` array used to assert an old opacity-alias is absent from production shared-UI source files.

No other product, shared-UI, story, or spec source under `src` or `tests` imported the legacy component, referenced its Storybook title (`shared-ui-mdswitch--*` / `shared/ui/MDSwitch`), or used its `.md-switch__target` / `.md-switch__handle` private class vocabulary, apart from the legacy component's own files and the legacy shared multi-component visual spec described below. No raw `m3e-switch`, `M3eSwitchElement`, or private `--m3e-*` Switch token existed outside `src/shared/ui/material` before or after this migration.

## Migrated consumers

Both confirmed consumers now import the canonical `MDSwitch` from `@shared/ui/material` instead of the legacy `@shared/ui/Switch`:

- `SettingsSwitchListItem.vue`: import changed from `import { MDSwitch } from '@shared/ui/Switch';` to `import { MDSwitch } from '@shared/ui/material';`. The template usage (`presentation :selected="checked" :disabled="disabled"`) is unchanged — ARCHITECTURE.md confirmed both consumers already fit the new `presentation`/`selected`/`disabled` contract exactly, with no consumer-side behavior change required.
- `AppUpdateSettings.vue`: the separate `import { MDSwitch } from '@shared/ui/Switch';` line was removed and `MDSwitch` merged into the existing `import { MDButton } from '@shared/ui/material';` line (now `import { MDButton, MDSwitch } from '@shared/ui/material';`). The template usage (`presentation :selected="mode === 'automatic'" :disabled="isAutomaticToggleDisabled"`) is unchanged.

Neither consumer used any legacy-only capability (icon slots, drag-to-toggle, `ariaLabel`) not selected by the new architecture, confirming ARCHITECTURE.md's migration-plan step 2 audit.

## Preserved scenarios and failure paths

- `SettingsSwitchListItem`'s single-action list-item toggle retains its headline/supporting-text/disabled/line-count composition; the row (not the switch) continues to own `role="switch"`, `aria-checked`, `aria-disabled`, and the click-driven `@action` → `change` emit. The trailing switch visual remains purely reflective.
- `AppUpdateSettings`'s "Automatic updates" toggle retains its busy/disabled/`aria-checked` behavior driven by `mode`, `isAutomaticToggleDisabled`, and `onToggleAutomaticUpdates`; the surrounding install/retry/cancel/check actions and status/feedback regions are unchanged (`MDSwitch` migration touched only the trailing visual import).
- Real-browser proof (`tests/e2e/appSmoke.spec.ts` "toggles Error diagnostics in Settings with Space and Enter when available") confirms the row-level `role="switch"` toggle still responds to focus, Space, and Enter and still reports the correct `aria-checked` transitions with the new `MDSwitch` composed inside as a presentation-only visual — this is the exact user-facing action surface identified by the action-preservation review below, and it is unchanged end to end.
- Real-browser proof (`tests/e2e/appUpdatesNavigation.spec.ts`, auto-selected by the verifier as the app-updates settings entry/pane scenario) confirms the Automatic-updates row and pane navigation are unaffected.
- Action preservation matrix (both consumers): old action = toggle a settings switch row; old entry point = the same `MDListItem` row; old interaction tier = primary (single-action list row, Tab-reachable, Space/Enter-operable); new entry point = the identical `MDListItem` row (unchanged); new interaction tier = primary (unchanged); verification path = `SettingsSwitchListItem.test.ts` / `AppUpdateSettings.test.ts` component-level click assertions plus `appSmoke.spec.ts` real-browser Space/Enter proof. No action moved, was renamed, merged, or hidden; only the internally-composed decorative visual's renderer changed.
- One intentional, non-behavior-affecting attribute change: the decorative switch visual's `presentation` mode now explicitly sets `tabindex="-1"` and `aria-hidden="true"` on the rendered `m3e-switch` host (per ARCHITECTURE.md "State precedence and restoration"), whereas the legacy component's presentation branch rendered a plain non-focusable `<div>` with only `aria-hidden="true"` and no `tabindex` attribute at all. Both are equally unreachable by Tab and hidden from the accessibility tree; only the underlying mechanism differs. `SettingsSwitchListItem.test.ts` is updated accordingly (see below) since it previously asserted the absent-`tabindex` legacy mechanism directly.

## Legacy ownership removed

The entire legacy `src/shared/ui/Switch` directory is removed with no compatibility alias: `MDSwitch.vue`, `MDSwitch.test.ts`, `MDSwitch.stories.ts`, and `index.ts`.

The legacy shared multi-component visual spec `tests/e2e/visual/shared-ui.spec.ts` (which also owns MDChip, MDCheckbox, MDCard, MDStateLayer, and MarkdownContent visual/behavior proof, none of which are touched by this migration) had its seven MDSwitch-only tests removed: visual-states, interaction-states, icon-states, and icon-interaction-states baselines; the 48dp target-hit-area test; both drag-interaction tests; and the focus-indicator-target test. These all opened legacy `shared-ui-mdswitch--*` Storybook stories that no longer exist after the legacy component and its stories file were removed. The four corresponding legacy baseline PNGs under `tests/e2e/visual/shared-ui.spec.ts-snapshots/` (`md-switch-states-linux.png`, `md-switch-interaction-states-linux.png`, `md-switch-icon-states-linux.png`, `md-switch-icon-interaction-states-linux.png`) were deleted. The new family's own `tests/e2e/visual/shared-ui/md-switch.spec.ts` and its baseline (added in the implementation stage) are untouched and remain the current Switch visual proof; drag-to-toggle and icon-state proof are not carried forward since the new architecture deferred both surfaces (no current consumer or default-scenario demand).

`src/shared/ui/State/MDStateLayer.test.ts`'s static `productionSharedUiFiles` listing had its `'src/shared/ui/Switch/MDSwitch.vue'` entry removed, since that file no longer exists.

No compatibility alias, duplicate wrapper, deep import, raw renderer usage outside `src/shared/ui/material`, or replaced consumer test/style remains. No other legacy owner or reference to the removed component was found.

## Consumer and blast-radius proof

- `SettingsSwitchListItem.test.ts`: added a `@shared/ui/material` `MDSwitch` stub (props `selected`/`disabled`/`presentation`, matching the canonical public API) replacing the previous real-render of the legacy component's internal DOM. The two behavior tests now assert the widget's own composition contract — `presentation` is always forwarded true, `selected`/`disabled` reflect the given props, the row retains `role="switch"`/`aria-checked`/`aria-disabled`, no native `input`/`label` leaks from the row, and a row click still emits `change` (or is correctly blocked when disabled) — instead of re-asserting `MDSwitch`'s own internal tabindex/no-input suppression mechanics, which are now proven once at `MDSwitch.test.ts` per `docs/testing/architecture.md`'s one-primary-proof-owner rule.
- `SettingsSections.test.ts`: the existing `MDSwitch` stub's mock path moved from `@shared/ui/Switch` to `@shared/ui/material`; its unused `ariaLabel` prop (not part of the new component's public API) was dropped. No assertion changed — this file only checks that the "Error diagnostics" row exists with `role="switch"` and toggles correctly through `SettingsSwitchListItem`'s own click wiring, which is unaffected.
- `AppUpdateSettings.test.ts`: the separate `@shared/ui/Switch` mock was merged into the existing `@shared/ui/material` mock (which already stubbed `MDButton`), so the single mock factory now stubs both `MDButton` and `MDSwitch`. No assertion changed.
- `tests/e2e/appSmoke.spec.ts` "toggles Error diagnostics in Settings with Space and Enter when available": real-browser proof, unmodified, exercised as blast-radius confirmation that the row-level switch action (focus, Space, Enter, `aria-checked`) is unaffected by the internal visual's renderer change.
- `tests/e2e/appUpdatesNavigation.spec.ts`: real-browser proof, unmodified, exercised as blast-radius confirmation for the Automatic-updates settings entry and pane.
- `tests/e2e/visual/shared-ui.spec.ts` full run (212/212 passed): confirms removing the seven MDSwitch-only tests and four baselines did not affect the file's other component coverage (MDChip, MDCheckbox, MDCard, MDStateLayer, MarkdownContent).

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/State/MDStateLayer.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.vue src/widgets/SettingsSections/SettingsSections.test.ts src/widgets/SettingsSections/SettingsSections.vue src/widgets/SettingsSections/SettingsSwitchListItem.test.ts src/widgets/SettingsSections/SettingsSwitchListItem.vue` — passed.
- `pnpm verify --only visual --files tests/e2e/visual/shared-ui.spec.ts` — passed (212/212, full visual lane selected by the verifier's own trigger rule for a changed visual spec; no baseline drift in the remaining MDChip/MDCheckbox/MDCard/MDStateLayer/MarkdownContent coverage).
- `pnpm verify --only e2e --files tests/e2e/appSmoke.spec.ts src/widgets/SettingsSections/SettingsSwitchListItem.vue src/widgets/AppUpdateSettings/AppUpdateSettings.vue` — passed (`appSmoke.spec.ts` plus verifier-auto-selected `appUpdatesNavigation.spec.ts`).
- `pnpm verify --only format --files <the 7 touched files>` — passed.
- `pnpm verify --only oxlint --files <the 7 touched files>` — passed.
- `pnpm verify --only eslint --files <the 7 touched files>` — passed.

This stage did not run independent review or the outer workflow's final verification.

Revalidation rerun (2026-08-11T02:30:00.000Z, against corrected `IMPLEMENTATION.md` revision `2026-08-11T02:15:00.000Z`, no consumer code changed):

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/widgets/SettingsSections/SettingsSwitchListItem.vue src/widgets/SettingsSections/SettingsSwitchListItem.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.vue src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts` — passed.
- Visual, e2e, format, oxlint, and eslint were not rerun: no consumer, story, or spec file changed since their last passing runs recorded above, and this revalidation's direct inspection (see "Revalidation note" above) confirms neither consumer exercises the reclassified native-`<label>` accessible-naming mechanism.

Revalidation rerun (2026-08-11T05:15:00.000Z, against corrected `IMPLEMENTATION.md` revision `2026-08-11T05:00:00.000Z`, no consumer code changed):

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/widgets/SettingsSections/SettingsSwitchListItem.vue src/widgets/SettingsSections/SettingsSwitchListItem.test.ts src/widgets/AppUpdateSettings/AppUpdateSettings.vue src/widgets/AppUpdateSettings/AppUpdateSettings.test.ts` — passed.
- Visual, e2e, format, oxlint, and eslint were not rerun: no consumer, story, or spec file changed since their last passing runs recorded above, and this revalidation's direct inspection (see "Revalidation note (2026-08-11T05:15:00.000Z)" above) confirms the corrected `onChange` narrowing and spec-file assertion-style fix are structurally unreachable from either consumer's usage.

## Remaining blockers

None.

## Review readiness

Ready. Both confirmed consumers are migrated to the canonical `MDSwitch` with identical observable product behavior (component-level and real-browser proof both confirm the row-level toggle action, tier, and entry point are unchanged); the legacy `src/shared/ui/Switch` component, its test, its stories, and its barrel are removed with no compatibility alias and no remaining reference anywhere in the workspace; the legacy shared multi-component visual spec's Switch-only tests and baselines are removed without affecting its other component coverage; `MDStateLayer.test.ts`'s stale file listing is corrected; focused type-check, unit-tests, visual, e2e, format, oxlint, and eslint all passed; the first revalidation's direct re-inspection against the corrected `ARCHITECTURE.md` accessible-naming reclassification confirmed neither consumer is affected; this second revalidation's direct re-inspection against the corrected `IMPLEMENTATION.md` type-assertion/formatting fix (revision `2026-08-11T05:00:00.000Z`) confirms the changed code path is structurally unreachable from either consumer's `presentation`-mode usage, with fresh focused type-check and unit-tests proof; and the route is `none/none`.
