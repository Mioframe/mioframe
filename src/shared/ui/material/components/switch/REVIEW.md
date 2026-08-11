# Switch review

Artifact revision: 2026-08-11T10:42:00.000Z
DESIGN.md contract revision: 2026-08-10T19:28:25.068Z
ARCHITECTURE.md revision: 2026-08-11T06:25:34.000Z
IMPLEMENTATION.md revision: 2026-08-11T07:30:01.000Z
MIGRATION.md revision: 2026-08-11T08:00:00.000Z
Verdict: blocked
Required return family: self
Required return stage: implementation
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: no-reported-defect
Blockers: required disabled pointer browser proof uses forbidden Playwright force and must be replaced with ordinary real pointer input
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Reviewed the complete current Switch family after the controlled-state calibration correction, including the canonical adapter, exact `@m3e/web@2.6.3` renderer lifecycle, standalone controlled interaction, disabled behavior, decorative `presentation` composition, current consumers, legacy removal, owner-local Storybook browser proof, visual proof, test-environment scope, and the calibration rule changes introduced by this PR.

The selected scope remains the simplest viable design: one thin `MDSwitch` adapter with `selected`, `disabled`, `presentation`, and `update:selected`; no icons, drag, form participation, speculative tokens, renderer exposure, or generic adapter framework.

## Official design compliance

`DESIGN.md` contract revision `2026-08-10T19:28:25.068Z` remains current for the selected family surface. The previously recorded `M3E-004` native-label accessible-name divergence remains correctly separated from the selected working `aria-label` / `aria-labelledby` mechanisms.

No new design-contract defect was found.

## Architecture compliance

The corrected `ARCHITECTURE.md` revision `2026-08-11T06:25:34.000Z` resolves the prior state-ownership defect correctly.

`selected` is now the sole source of truth. The exact installed renderer dispatches a bubbling cancelable `beforeinput` before its own `checked` mutation; the adapter intercepts that intent, calls `preventDefault()`, emits the requested next value, and lets only a later controlling prop update write renderer `checked`.

The architecture also correctly records owner-local browser proof after Storybook S2, a Switch-local `ElementInternals` test seam, and positive `presentation` composition handoff proof. No unresolved architecture decision or unnecessary abstraction remains.

## Implementation compliance

`MDSwitch.vue` implements the corrected controlled contract directly: `:checked="props.selected"` is the only renderer-state writer, `onBeforeinput` runtime-narrows the renderer host, cancels the renderer mutation before emitting `update:selected`, and no wrapper-local selection state, watcher, delayed repair, or private renderer DOM access exists.

Component-contract proof includes accepted intent, rejected intent, external prop updates, disabled non-emission, presentation non-emission, and the host-attribute boundary. Rejected intent keeps renderer `checked` equal to the unchanged `selected` prop.

The former global `attachInternals()` compatibility shim is removed from `src/setupVitest.ts`. `MDSwitch.testUtils.ts` installs the minimal renderer-construction seam only for Switch tests and restores the prototype afterward.

Storybook behavior proof is correctly owner-local in `MDSwitch.browser.spec.ts`; the obsolete central Switch registry relation is removed. The stale DialogForm/Button registry debt found while exercising the fail-closed resolver was corrected to the already-established S2 ownership rather than weakening the resolver.

One implementation-proof defect remains: the disabled activation test calls `disabled.click({ force: true })`. Current `ui-browser-behavior` explicitly forbids `force`, broad retries, and recovery loops. A forced Playwright click bypasses the very actionability contract this browser proof is supposed to exercise, so this assertion cannot satisfy the required disabled pointer proof even though the final checked value remains false.

The correction belongs to implementation/proof ownership, not architecture. Use ordinary real pointer input without `force` (for example `page.mouse.click` at the rendered disabled Switch coordinates), then assert no public intent/state change.

## Migration and legacy removal

`MIGRATION.md` revision `2026-08-11T08:00:00.000Z` correctly revalidates both current consumers against the corrected implementation.

`SettingsSwitchListItem` and `AppUpdateSettings` continue to use `MDSwitch presentation` as a purely decorative trailing visual while their enclosing `MDListItem` owns `role="switch"`, accessible state/name, and the actual action. The controlled-interaction correction is unreachable from those presentation-only consumers and the unconditional `selected`/`disabled` reflection remains intact.

Legacy `src/shared/ui/Switch` remains fully removed with no compatibility alias. No consumer migration defect was found.

## Proof and stage verification

The implementation record reports passing focused type-check, format/lint, 16 Switch unit tests, full unit-suite revalidation after removing the global shim, 8 owner-local Storybook behavior tests, and 212 visual checks. The agent also ran `pnpm verify` and reported all 11 checks passing.

That green result is useful evidence but is not the final Material workflow gate because it ran before this required fresh independent review. The canonical `material-component` state machine allows final workflow verification only after current successful reviews.

GitHub Actions `verify` for head `4d4f0ab1ea43b6a39575c163d7335adf741baebc` was still in progress when this review was written. CI status does not alter the finding above.

## Blockers

- Replace the disabled Switch `click({ force: true })` browser proof with ordinary real pointer input and prove the disabled renderer produces no selection intent/state change.
- Refresh `IMPLEMENTATION.md` after the proof change, then revalidate `MIGRATION.md` if required by the revision chain and run a fresh independent review.
- After a compliant current review, run the ordinary final `pnpm verify` again; the pre-review run cannot be reused as the final gate.

## Major issues

None beyond the blocker above.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No architecture redesign.
- No new public Switch API.
- No generic controlled-component or m3e adapter framework.
- No change to `scripts/playwrightContainer.mjs` based on the previously unverified wrong-worktree diagnosis.
- No reintroduction of drag, icons, form participation, legacy aliases, or component tokens.

The Material workflow already states that final verification follows current successful reviews. The agent's premature final run is an execution-order mistake, not evidence that another duplicate workflow rule is needed.

## Routing evidence

The current architecture and runtime correction are sound; the only unresolved finding is a component-owned browser-proof implementation defect in `src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts`.

Route: `self / implementation`.
