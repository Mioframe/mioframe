# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Sources and evidence status

Official Material sources, captured from `m3.material.io` on 2026-07-20 with fresh,
verified cache coverage on 2026-07-26:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Renderer contract:

- package range `@m3e/web@^2.6.2`, lockfile resolution `2.6.2`;
- stable family entry point `@m3e/web/button`;
- package exports `M3eButtonElement`, `ButtonShape`, `ButtonSize`, and `ButtonVariant`;
- declarations and documented CSS inputs in
  `node_modules/@m3e/web/dist/src/button/ButtonElement.d.ts`.

## Architecture handoff

- **Goal:** finish the Material-first Button adapter and preserve every current action scenario.
- **Current behavior:** `MDButton` delegates rendering to `m3e-button`, but exposes provisional
  renderer vocabulary and a non-Material loading presentation.
- **Non-goals:** no renderer replacement, private-DOM access, full token catalogue, other Button
  families, global theme change, or independent `AUDIT.md` edit.
- **Affected scenarios:** ordinary actions, form submit/reset, controlled toggles, links, disabled
  actions, focus/keyboard/pointer behavior, expanded target behavior, and async action presentation.
- **Ownership:** `MDButton` owns only the Material-to-Vue adapter. `@m3e/web` owns geometry,
  state layers, focus, elevation, accessibility internals, and motion. Generic shared UI owns the
  non-Material async presentation through `LoadingButton`. Consumers own async state.
- **Source of truth/state:** Material owns Button semantics; consumer props own selected/loading
  state; no adapter-local mutable state is introduced.
- **Public entries:** `@shared/ui/material` exports `MDButton`; `@shared/ui/LoadingButton` exports
  `LoadingButton`.
- **Minimum design:** normalize only the selected Material surface and compose progress outside
  `MDButton`. The simpler alternative of keeping `loading` in `MDButton` fails the Material-only
  boundary; repeating progress markup in every consumer would duplicate one shared presentation.
- **Deferred:** small-button 24dp legacy padding, public component tokens, rapid-click curve
  customization, and all Button-family components other than common Button.
- **Rejected:** approved `MD*` loading extension, copied m3e internals, raw renderer API exposure,
  compatibility aliases, and consumer-specific loading overlays.
- **Blast radius:** all `MDButton` consumers are checked; only loading consumers migrate to
  `LoadingButton`. Existing ordinary `MDButton` imports and scenarios remain unchanged.
- **Acceptance:** one canonical Material Button API; async actions keep label/accessibility,
  progress, geometry, and activation behavior; native, toggle, browser, and visual scenarios pass.
- **Risks:** Vue/custom-element property mapping, form behavior, controlled selection, mobile hit
  target, progress overlay appearance, and renderer-owned press/selection motion.
- **Verification:** component contracts, focused Storybook browser behavior, canonical visual
  baselines, package-derived type-check, and final `pnpm verify`; operator visual/motion review
  remains a manual gate.
- **Forbidden:** `@m3e/web` outside Material, `--m3e-*` leakage, private shadow DOM, parallel
  renderer behavior, `!important`, or restoring the legacy component.
- **Readiness:** product and ownership decisions are resolved; blocker `none`; verdict `ready`.

## Selected public Vue API

```text
props
  label: string
  variant?: 'default' | 'toggle' = 'default'
  color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' = 'filled'
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' = 'small'
  shape?: 'round' | 'square' = 'round'
  selected?: boolean
  disabled?: boolean
  nativeType?: 'button' | 'submit' | 'reset' = 'button'
  href?, target?, rel?, download?, name?, value?

slots
  icon
  selected
  selected-icon

emits
  click(MouseEvent)
  update:selected(boolean)
```

`selected` is meaningful only for `variant="toggle"`. Material does not support a text-style
toggle; that combination normalizes to a default action and warns in development.

## Material-m3e-Vue matrix

| Material contract and source                                                                                             | Required now and evidence                                                                   | Public Vue representation                                  | m3e 2.6.2 support                                                          | Owner                                 | Decision                                          | Verification                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| Button label; concise sentence-case visible label, matching accessible label (`overview`, `guidelines`, `accessibility`) | Every consumer                                                                              | required `label: string` rendered as default content       | `direct`: default slot and native accessible name                          | Vue mapping + m3e                     | `implement-now`                                   | component contract; browser accessibility/keyboard                          |
| Default and toggle variants (`overview`, `specs`)                                                                        | Toggle story and coherent selected API                                                      | `variant: 'default' \| 'toggle'`, default `default`        | `direct`: `toggle`, `selected`, cancellable `beforeinput`                  | Vue controlled-state adapter + m3e    | `implement-now`                                   | component controlled-state contract; browser toggle                         |
| Elevated, filled, tonal, outlined, and text color configurations; filled default (`overview`, `specs`, `guidelines`)     | Current consumers use filled, outlined, and text; full finite configuration set is coherent | `color`, default `filled`                                  | `direct`: typed `variant` values                                           | Vue typed mapping + m3e               | `implement-now`                                   | component mapping; visual matrix                                            |
| Extra-small, small, medium, large, extra-large; small default (`overview`, `specs`)                                      | Current default and medium use; full finite size set is coherent                            | `size`, default `small`                                    | `direct`: typed `size`                                                     | Vue typed mapping + m3e               | `implement-now`                                   | component mapping; size visual baseline                                     |
| Round and square; round default (`overview`, `specs`, `guidelines`)                                                      | Current stories and pressed-shape proof                                                     | `shape: 'round' \| 'square'`, default `round`              | `direct`: maps round to typed `rounded`, square directly                   | Vue typed mapping + m3e               | `implement-now`                                   | component mapping; shape visual/browser proof                               |
| One optional leading icon (`overview`, `guidelines`)                                                                     | Current icon consumers                                                                      | `icon` slot                                                | `direct`: `icon` slot                                                      | Vue slot mapping + m3e                | `implement-now`                                   | component slot contract; visuals                                            |
| Toggle label and leading icon may change with selected state (`guidelines`)                                              | Required for coherent controlled toggle API                                                 | `selected`, `selected-icon` slots                          | `direct`: documented slots                                                 | Vue slot mapping + m3e                | `implement-now`                                   | component slot contract; toggle visuals                                     |
| Disabled Button state (`specs`, `accessibility`)                                                                         | Current consumers                                                                           | `disabled?: boolean`                                       | `direct`: documented `disabled`                                            | Vue mapping + m3e                     | `implement-now`                                   | component mapping; browser non-activation; visuals                          |
| Action navigation and Space/Enter activation (`accessibility`)                                                           | Every interactive consumer                                                                  | normalized `click`; native focus/keyboard delegated        | `direct`: documented click and internal native semantics                   | Vue event normalization + m3e/browser | `implement-now`                                   | browser pointer/keyboard/focus                                              |
| Native button/form semantics                                                                                             | Submit consumer and coherent web API                                                        | `nativeType`, `name`, `value`                              | `direct`: documented `type`, `name`, `value`                               | Vue/native mapping + m3e/browser      | `implement-now`                                   | component mapping; browser submit/reset                                     |
| Link-button semantics                                                                                                    | Coherent web Button API                                                                     | `href`, `target`, `rel`, `download`                        | `direct`: documented link properties                                       | Vue/native mapping + m3e/browser      | `implement-now`                                   | component mapping; browser link smoke when used                             |
| Hover, focus, press, disabled visuals; pressed and selected shape morph (`overview`, `specs`)                            | Current interaction contract                                                                | no public state prop                                       | `direct`: renderer-owned state, shape, elevation, and motion               | m3e                                   | `implement-now`                                   | exact source inspection; browser public interaction; operator motion review |
| 48dp minimum interaction target (`guidelines`)                                                                           | Mobile/browser accessibility requirement                                                    | no public prop                                             | `direct`: renderer host hit target                                         | m3e                                   | `implement-now`                                   | real pointer hit-area browser test                                          |
| Small 16dp padding recommendation (`overview`, `specs`)                                                                  | m3e small default implements current geometry                                               | no public prop                                             | `direct`                                                                   | m3e                                   | `implement-now`                                   | size visual baseline                                                        |
| Small legacy 24dp padding                                                                                                | No current consumer; no longer recommended                                                  | none                                                       | `missing` as explicit public option                                        | none                                  | `defer`                                           | documentation only                                                          |
| Public Button component tokens (`specs`)                                                                                 | No current consumer-selected override                                                       | none                                                       | documented private CSS inputs exist                                        | none                                  | `defer`                                           | documentation only                                                          |
| Rapid-click modified curve (`accessibility`)                                                                             | Conditional guidance; no measured rapid-action requirement                                  | none                                                       | no documented selector                                                     | m3e if later selected                 | `defer`                                           | operator review if selected later                                           |
| Trailing icon                                                                                                            | Material guidance says use one leading icon and not two                                     | none                                                       | renderer has `trailing-icon`, but it is outside selected Material contract | none                                  | `defer`                                           | type-check rejects public slot                                              |
| Focusable disabled (`disabledInteractive`)                                                                               | No consumer and no official selected Material option                                        | none                                                       | renderer-specific documented extension                                     | none                                  | `defer`                                           | type-check rejects public prop                                              |
| Async/loading presentation                                                                                               | Current async action consumers; no Material Button source                                   | separate `LoadingButton` with `loading: boolean \| number` | `not-applicable`                                                           | generic shared UI                     | `wrapper-correction`; `separate-non-md-component` | component contract; browser actionability; visual baseline                  |

## Confirmed divergences

- m3e documents `text` toggles and trailing icons, while the selected official Material contract
  treats text toggles as unsupported and recommends one leading icon. These renderer capabilities
  stay private.
- Renderer-owned motion is inspected from the exact 2.6.2 bundle. The adapter does not disable,
  replace, or duplicate its press/selection transitions. Perceptual quality remains operator-owned.

## Vue component contracts

### `MDButton`

- Stable root: `m3e-button.md-button`; no wrapper.
- Props/emits/slots: exactly the selected API above; no attrs forwarding.
- Derived state: toggle validity, selected state, and typed renderer mappings are computed.
- Interaction: renderer owns native activation; adapter emits `click` and controlled selection
  intent. No direct DOM access or exposed imperative API.
- Parent owns rendering visibility. Storybook browser and visual Button specs own real behavior.

### `LoadingButton`

- Stable root: `span.loading-button` containing one `MDButton`; progress replaces the optional
  leading icon while the visible label and accessible name remain stable.
- Props: the currently consumed default-action `MDButton` subset plus `loading`; emits `click`;
  slot `icon`; no attrs forwarding.
- Derived state: active loading and determinate progress only; no state machine.
- Interaction: delegates action/native semantics to `MDButton`; loading remains actionable to
  preserve current behavior. No DOM access or imperative API.
- Parent owns rendering visibility. Component contract owns composition; Button Storybook browser
  and visual fixtures own actionability and appearance.

## Implementation preflight

- **Authoring source:** ready Material adapter matrix and architecture handoff in this file.
- **Goal/non-goals:** implement the selected API and separate loading; all other Button families and
  renderer behavior remain unchanged.
- **Owners/entries:** `MDButton` via `@shared/ui/material`; `LoadingButton` via
  `@shared/ui/LoadingButton`.
- **Passes:** (1) red component contracts; (2) normalize `MDButton`; (3) add `LoadingButton`;
  (4) migrate loading consumers; (5) align stories/browser/visual proof and impact metadata;
  (6) focused checks; (7) final verification and operator handoff.
- **Removal:** delete `MDButton.loading`, `disabledInteractive`, and `trailing-icon` plus their tests,
  stories, CSS, and public typing. No compatibility aliases remain.
- **Consumer migration:** direct loading consumers and shared `DialogForm`/menu composition use
  `LoadingButton`; ordinary consumers remain on `MDButton`.
- **Stop condition:** any consumer requiring toggle+loading, link+loading, or another unrecorded
  extension returns this contract to architecture review.

TEST IMPACT

- Contract/scenario: selected Material Vue API and exact m3e property/slot mapping
  - Primary proof owner: `src/shared/ui/material/components/button/MDButton.test.ts`
  - Additional proof: package-derived type-check
  - Existing proof: current adapter tests
  - New/updated proof: remove extension assertions; retain defaults, slots, controlled state, invalid combination, native mapping
  - Risk or platform matrix: Vue custom-element property binding
  - Persistent impact metadata: existing unit related-source resolution
- Contract/scenario: pointer, keyboard/focus, form, toggle, disabled, hit target, and press behavior
  - Primary proof owner: `tests/e2e/storybook/md-button-family.spec.ts`
  - Additional proof: deterministic `BehaviorContracts` story
  - Existing proof: current public Storybook behavior suite
  - New/updated proof: loading fixture targets `LoadingButton`; other scenarios retained
  - Risk or platform matrix: desktop Chromium and Mobile Chrome paths already owned by the suite
  - Persistent impact metadata: update `scripts/lib/storybookBehaviorRisk.mjs` for new component source
- Contract/scenario: canonical Material states and async progress composition
  - Primary proof owner: `tests/e2e/visual/shared-ui/md-button.spec.ts`
  - Additional proof: operator Material visual/motion review
  - Existing proof: Button state, size, toggle, and loading baselines
  - New/updated proof: loading story composes `LoadingButton`; no baseline refresh unless rendered output intentionally changes
  - Risk or platform matrix: stable Storybook desktop screenshot surfaces
  - Persistent impact metadata: update visual source mapping for `LoadingButton`
- Contract/scenario: current async action consumer wiring
  - Primary proof owner: existing colocated consumer component tests and type-check
  - Additional proof: final repository verification
  - Existing proof: consumer stubs and product flows
  - New/updated proof: import/component-name changes only where loading is used
  - Risk or platform matrix: no product interaction or action priority change
  - Persistent impact metadata: existing related-test and E2E fallback planning

## Completion gate

M1 completes after implementation matches this matrix, focused and final verification pass, and
the operator accepts final visual and renderer-owned motion behavior.
