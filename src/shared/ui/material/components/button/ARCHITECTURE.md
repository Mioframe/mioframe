# Button architecture

Status: ready  
DESIGN.md reference: `./DESIGN.md` (`current`)  
Design snapshot/revision: official Button tabs snapshot `2026-07-20T16:12:33.651Z`; token resource `2026-07-01_06-10-02`  
Architecture date: 2026-07-30

## Goal

Provide one canonical, demand-scoped `MDButton` Vue adapter for Mioframe action buttons. The adapter retains the current filled, outlined, and text action scenarios; small and extra-small round geometry; native button/submit behavior; optional leading icon; disabled behavior; and short-operation Loading indicator composition. It keeps official Button semantics public, keeps `@m3e/web` private, and corrects the selected text-Button contextual token path so Snackbar actions render their intended resting and interaction-state label color.

The simplest viable design is a thin single-host adapter over `m3e-button`, plus the independently owned `MDLoadingIndicator` only when `loading` is requested. No adapter framework, wrapper-owned interaction system, token registry, or compatibility layer is required.

Design basis: [Identity and evolution](./DESIGN.md#identity-and-evolution), [Anatomy and content](./DESIGN.md#anatomy-and-content), [Variants and configurations](./DESIGN.md#variants-and-configurations), [States and behavior](./DESIGN.md#states-and-behavior), and [Accessibility and input](./DESIGN.md#accessibility-and-input).

## Non-goals

- Do not expose elevated or tonal color, medium/large/extra-large size, square shape, toggle/selection, trailing icon, links/downloads/targets, form name/value, or disabled-interactive behavior. These are official or renderer capabilities without confirmed current demand; see [Variants and configurations](./DESIGN.md#variants-and-configurations), [Anatomy and content](./DESIGN.md#anatomy-and-content), and [Accessibility and input](./DESIGN.md#accessibility-and-input).
- Do not implement Button groups, connected geometry, icon buttons, FABs, split buttons, or floating toolbars; these are related official contracts, not the selected standalone Button surface. See [Related official contracts](./DESIGN.md#related-official-contracts).
- Do not expose all official Button tokens. Select only tokens needed by a confirmed contextual consumer; renderer/system defaults own the rest.
- Do not make visual loading presentation disable activation. Feature and consumer owners retain pending state, `disabled`, re-entry prevention, result handling, and status copy.
- Do not recreate renderer-owned private DOM, focus, ripple, state layer, elevation, press geometry, shape motion, or accessibility internals.

## Current scenarios

1. Product actions across dialogs, sheets, cards, repository recovery, diagnostics, navigation, menus, and PWA install use filled, outlined, or text Buttons with a required short label and click handling.
2. Forms use `nativeType="submit"`; all other Buttons default to native type `button` to prevent accidental submission.
3. Compact filter and target-hit scenarios use extra-small Buttons; other scenarios use the default small size. Both require at least a 48 by 48 dp accessible target while preserving the official 32/40 dp visible container geometry.
4. Several actions supply one leading icon. Loading presentation replaces that icon, then restores it when loading ends.
5. Short indeterminate library work may show a decorative `MDLoadingIndicator`; the Button remains the named interactive control and exposes busy state. Browser/provider/user-controlled waits instead keep feature-owned textual pending status and disabled conflict guards.
6. `MDSnackbar` composes a text Button on an inverse surface and needs the rendered action label to remain inverse-primary in resting, hovered, focused, and pressed states. Its icon action is a separate Icon Button contract; no current contextual Button icon override exists.
7. Overlay and menu stories use the component instance as a focus/positioning target and require the Vue ref to resolve to the renderer host.

Design basis: [Anatomy and content](./DESIGN.md#anatomy-and-content), [Geometry, typography, and motion](./DESIGN.md#geometry-typography-and-motion), [States and behavior](./DESIGN.md#states-and-behavior), [Usage guidance](./DESIGN.md#usage-guidance), and [Accessibility and input](./DESIGN.md#accessibility-and-input).

## Selected and deferred Material surface

| Official surface                                                                    | Decision        | Reason                                                                     |
| ----------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| Default action Button                                                               | `implement-now` | Every confirmed consumer initiates an action.                              |
| Filled, outlined, text color configurations                                         | `implement-now` | All three have current product consumers.                                  |
| Elevated and tonal colors                                                           | `defer`         | Official, but no current consumer requires them.                           |
| Extra-small and small sizes                                                         | `implement-now` | Current compact and ordinary action scenarios require both.                |
| Medium, large, extra-large sizes                                                    | `defer`         | No confirmed current scenario requires them.                               |
| Round shape                                                                         | `implement-now` | Official default and the shape used by every current scenario.             |
| Square shape                                                                        | `defer`         | No confirmed current scenario requires it.                                 |
| Required label and optional one leading icon                                        | `implement-now` | Current consumers use both anatomy forms.                                  |
| Trailing icon                                                                       | `defer`         | Not part of the official selected anatomy and unused by current consumers. |
| Enabled, disabled, hovered, focused, pressed                                        | `implement-now` | Required interaction and accessibility states for action Buttons.          |
| Toggle selected/unselected states and alternate slots                               | `defer`         | Official Expressive capability without a current Button consumer.          |
| Native activation and `button`/`submit` form type                                   | `implement-now` | Required by action and form scenarios.                                     |
| Link/download/target/name/value and disabled-interactive                            | `defer`         | Renderer capability is not current selected demand.                        |
| 48 by 48 dp minimum target for extra-small/small                                    | `implement-now` | Required by official accessibility guidance and compact product use.       |
| Pressed shape morph, state layer, ripple, focus indication, reduced-motion response | `implement-now` | Required observable behavior, owned by the renderer.                       |

All classifications derive from [Variants and configurations](./DESIGN.md#variants-and-configurations), [Geometry, typography, and motion](./DESIGN.md#geometry-typography-and-motion), [States and behavior](./DESIGN.md#states-and-behavior), and [Accessibility and input](./DESIGN.md#accessibility-and-input).

`loading` is not an official Button configuration in the current Button design snapshot. It remains an exceptional Mioframe composition extension because a confirmed library scenario and the ready Loading Indicator dependency contract require it. It does not add operation ownership or change Button activation semantics.

## Dependency closure

| Dependency                        | Required gate                                                                            | Current status                                                                | Handoff                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Material foundation               | implemented system colors, typography, shape, elevation, state opacity, and motion roles | complete for selected Button inputs                                           | Button family maps only selected public contextual tokens; foundation keeps all `--md-sys-*` ownership.                                                                                                  |
| Loading indicator official family | current design, ready architecture, explicit Button composition boundary                 | `DESIGN.md`: current; `ARCHITECTURE.md`: ready; `IMPLEMENTATION.md`: complete | Button imports only public `MDLoadingIndicator`; dependency owns geometry, progressbar semantics, animation, public active-color token, renderer mapping, defects M3E-001/M3E-002, and standalone proof. |
| `@m3e/web/button`                 | exact installed private renderer contract                                                | `@m3e/web@2.6.3`                                                              | Not a Material family dependency; private renderer only.                                                                                                                                                 |

Dependency queue: empty. Loading Indicator has the required current design, ready architecture, and public ownership handoff, so Button architecture is not blocked.

Design basis: [Related official contracts](./DESIGN.md#related-official-contracts). Loading Indicator handoff: `../loadingIndicator/ARCHITECTURE.md`.

## Ownership

- `button` owns the public Vue API, required label and leading-icon placement, native type mapping, Button busy semantics, decorative Loading Indicator placement and state handoff, selected public Button tokens, private renderer mapping, exports, and Button-owned proof.
- `MDLoadingIndicator` owns its public API, active shape, geometry, animation, standalone semantics, renderer workarounds, tokens, and standalone proof. Button supplies `size=24`, `aria-hidden="true"`, the action label, and a composition-local `currentColor` override only.
- Product features and consumers own action logic, form submission, pending duration applicability, disabled and re-entry guards, status/error/result content, and contextual token values such as Snackbar inverse-primary.
- Material foundation owns renderer-independent reference/system tokens and default theme values.
- m3e owns native inner control behavior, private DOM/layout, state layer, ripple, focus treatment, elevation, transient press geometry, shape restoration/motion, keyboard/pointer activation, form participation, and internal accessibility implementation.

## Public Vue API

Canonical export:

```ts
import { MDButton } from '@shared/ui/material';
```

Props:

| Prop         | Type                               | Required/default   | Contract                                                                                                                                                                                   |
| ------------ | ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`      | `string`                           | required           | Visible non-wrapping action label and accessible name source.                                                                                                                              |
| `color`      | `'filled' \| 'outlined' \| 'text'` | default `'filled'` | Selected official color configuration.                                                                                                                                                     |
| `size`       | `'extra-small' \| 'small'`         | default `'small'`  | Selected official size.                                                                                                                                                                    |
| `nativeType` | `'button' \| 'submit'`             | default `'button'` | Maps to native form behavior; no reset/link/form-data expansion.                                                                                                                           |
| `disabled`   | `boolean`                          | default `false`    | Maps to the renderer's true disabled contract; blocks focus and activation.                                                                                                                |
| `loading`    | `boolean`                          | default `false`    | Mioframe composition extension for short indeterminate work. Replaces the leading icon with a decorative Loading Indicator and sets Button busy semantics. It does not disable activation. |

Slots:

- `icon`: optional one leading icon. It is hidden while `loading` is true and restored without consumer intervention when loading becomes false.
- No default label slot, selected label/icon slot, or trailing icon slot. `label` is the single visible/accessibility source.

Emits:

- `click(event: MouseEvent)`: forwards the renderer host click unchanged. Disabled suppression remains renderer/native-owned.

Refs, fallthrough, and native mapping:

- The component exposes no methods or custom `defineExpose` contract. A Vue component ref resolves through the single custom-element root for existing focus/positioning consumers.
- Global/native attributes and classes fall through to the single `m3e-button` host. Public renderer-specific attributes are not supported.
- `nativeType` maps to renderer `type`; `disabled` maps as a Boolean property; `color` maps to renderer variant; `size` maps directly; round shape and non-toggle mode are private constants.
- The renderer host is the semantic interactive owner. Do not add a nested native Button or wrapper event synthesis.

Design basis: [Anatomy and content](./DESIGN.md#anatomy-and-content), [Variants and configurations](./DESIGN.md#variants-and-configurations), and [Accessibility and input](./DESIGN.md#accessibility-and-input).

## Public token contract

The only confirmed contextual Button demand is Snackbar action-label/state-layer color for text Buttons. Select exactly seven official paths. Do not publish the unused text icon paths or tokens for filled/outlined defaults; installed renderer fallbacks already resolve those from Material system roles.

| DESIGN.md official path                         | Public Mioframe token                             | Direct renderer input                                 | Renderer fallback          | Expected rendered consumer result                                                                         | Proof owner                                                                  |
| ----------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `md.comp.button.text.label-text.color`          | `--md-comp-button-text-label-text-color`          | private `--m3e-text-button-label-text-color`          | `--md-sys-color-primary`   | Resting text-Button label uses primary by default and Snackbar inverse-primary when context overrides it. | token contract; rendered label computed-color browser proof; visual baseline |
| `md.comp.button.text.hovered.label-text.color`  | `--md-comp-button-text-hovered-label-text-color`  | private `--m3e-text-button-hover-label-text-color`    | public resting label token | Hovered label preserves the contextual Snackbar action color.                                             | rendered label hover browser proof; visual baseline                          |
| `md.comp.button.text.focused.label-text.color`  | `--md-comp-button-text-focused-label-text-color`  | private `--m3e-text-button-focus-label-text-color`    | public resting label token | Keyboard-focused label preserves the contextual Snackbar action color.                                    | rendered label keyboard-focus browser proof; visual baseline                 |
| `md.comp.button.text.pressed.label-text.color`  | `--md-comp-button-text-pressed-label-text-color`  | private `--m3e-text-button-pressed-label-text-color`  | public resting label token | Pressed label preserves the contextual Snackbar action color.                                             | rendered label pointer/Space press browser proof; visual baseline            |
| `md.comp.button.text.hovered.state-layer.color` | `--md-comp-button-text-hovered-state-layer-color` | private `--m3e-text-button-hover-state-layer-color`   | public resting label token | Hover state layer uses the contextual action color with foundation hover opacity.                         | rendered state-layer browser/visual proof                                    |
| `md.comp.button.text.focused.state-layer.color` | `--md-comp-button-text-focused-state-layer-color` | private `--m3e-text-button-focus-state-layer-color`   | public resting label token | Focus state layer uses the contextual action color with foundation focus opacity.                         | rendered state-layer browser/visual proof                                    |
| `md.comp.button.text.pressed.state-layer.color` | `--md-comp-button-text-pressed-state-layer-color` | private `--m3e-text-button-pressed-state-layer-color` | public resting label token | Pressed state layer/ripple uses the contextual action color with foundation pressed opacity.              | rendered state-layer/ripple browser/visual proof                             |

The official paths are in [Complete official component-token catalogue — Button Color Text](./DESIGN.md#button---color---text). The implementation replaces the current incorrect `hover`/`focus` public names atomically, adds the missing state label tokens, removes the unconsumed text icon token, and updates `docs/token-api.md` in the same pass. No compatibility aliases are allowed.

## Renderer mapping and gaps

Installed renderer: `@m3e/web@2.6.3`, package entry point `@m3e/web/button`, exported `M3eButtonElement`, `ButtonVariant`, `ButtonSize`, and `ButtonShape`.

| Selected contract                                                | Coverage         | Mapping or gap owner                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filled, outlined, text configurations                            | `direct`         | Map public `color` to documented renderer `variant`, constrained by exported renderer type.                                                                                                                                                                               |
| Extra-small and small geometry/typography                        | `direct`         | Map public `size` to documented renderer `size`; installed defaults match official selected geometry.                                                                                                                                                                     |
| Round shape and pressed restoration/motion                       | `direct`         | Private constant `shape="rounded"`; renderer owns state and motion. No host pseudo-class override.                                                                                                                                                                        |
| Required label and optional leading icon                         | `direct`         | Light-DOM label and documented `icon` slot; wrapper owns Vue slot adaptation only.                                                                                                                                                                                        |
| Native button/submit, click, disabled, keyboard/pointer behavior | `direct`         | Renderer public type/disabled/click contract and native internal control. Bind Boolean properties, not false-present dashed attributes.                                                                                                                                   |
| Minimum 48 by 48 target for selected sizes                       | `partial`        | Renderer supplies the visible container; existing owner-local host target geometry must be audited against browser hit/focus proof. A wrapper correction may provide only an invisible host-level target without changing renderer interaction state or visible geometry. |
| Loading presentation                                             | `not-applicable` | Non-Material Button extension composed through public `MDLoadingIndicator`; Button owns placement and busy semantics.                                                                                                                                                     |
| Text contextual resting/transient colors                         | `direct`         | Selected official public tokens map to documented variant-specific renderer CSS inputs with explicit family fallbacks.                                                                                                                                                    |
| Reduced motion and forced colors                                 | `direct`         | Renderer media-query behavior; browser proof confirms observable selected behavior.                                                                                                                                                                                       |
| Rapid repeated activation resonance guidance                     | `partial`        | Official guidance recommends modified web motion but supplies no normative parameters. Keep renderer motion; operator motion acceptance owns subjective quality. No timing hack.                                                                                          |
| Toggle, other colors/sizes/shapes, links, trailing icons         | `not-applicable` | Deferred public surface even though renderer exposes much of it.                                                                                                                                                                                                          |

No confirmed Button renderer defect requires a new `M3E-*` record. The former M3E-003 hypothesis is retired because percentage state-opacity grammar is a Mioframe foundation representation issue, already corrected. Loading Indicator defects M3E-001/M3E-002 remain dependency-owned and do not move into Button.

## State precedence and restoration

- `disabled` has interaction precedence: renderer/native behavior suppresses focus and activation regardless of `loading`; visual loading may coexist but never re-enables the control.
- `loading` has content precedence over `icon`: true renders the decorative Loading Indicator in the leading-icon position; false restores the consumer icon slot, if supplied.
- `loading` sets `aria-busy="true"` on the Button host; false removes it. The nested Loading Indicator is `aria-hidden="true"`, so the Button label remains the only accessible name and there is no nested progressbar announcement.
- `loading` does not imply `disabled`, consume clicks, or own re-entry protection. Consumers explicitly set `disabled` when their operation requires blocking.
- Hover, focus, and press may overlap according to renderer/native interaction. Disabled wins. State-specific label/state-layer tokens select their exact contextual values and fall back to the resting token when the state exits.
- Pointer/keyboard release restores round shape immediately according to renderer state; state-layer/ripple lifetime remains renderer-owned.
- `color`, `size`, `nativeType`, `disabled`, `loading`, and icon-slot updates map reactively without remounting or wrapper-owned state duplication.

## Implementation passes

1. Audit `MDButton.vue`, `m3eButton.d.ts`, `config/vueCustomElements.ts`, family/root exports, and renderer-boundary checks against the exact `2.6.3` public contract. Keep one semantic renderer host and package-derived types.
2. Correct `components/button/tokens.css` to the seven selected official names and private mappings; remove the old `hover`/`focus` names and unused icon token without aliases. Update `docs/token-api.md` atomically and retain foundation opacity ownership.
3. Audit component-contract proof for props/defaults, Boolean property mapping, click payload, native submit behavior, slot/loading restoration, busy/decorative semantics, disabled/loading independence, refs/fallthrough, and forbidden renderer surface.
4. Audit real-browser behavior for keyboard/pointer activation, disabled suppression, visible container and 48 dp target geometry, immediate pressed-shape restoration, focus, reduced motion, and loading composition. Correct only public/light-DOM integration gaps; do not recreate renderer internals.
5. Add or correct contextual Snackbar proof at the rendered label and state-layer anatomy for resting, hover, keyboard focus, and press. Update bounded Button/Snackbar visual baselines only after inspecting expected, actual, and diff.
6. Audit stories and persistent impact mappings so selected variants, sizes, icon/loading/disabled states, target geometry, themes, and contextual Snackbar states have the correct proof owners.
7. Write `IMPLEMENTATION.md` with exact files, proof, focused verify results, dependency revalidation, and architecture deviations. Deviations must be `none` before migration.

Expected implementation-stage files are limited to Button runtime/types/tokens/exports, Button component/story/browser/visual proof and mappings, `docs/token-api.md`, renderer-boundary configuration/tests when mismatched, affected Snackbar contextual proof/baselines, and `IMPLEMENTATION.md`. Product consumer migration waits for the migration stage.

## TEST IMPACT

- Contract/scenario: public props/defaults, exact values, label/icon contract, native mapping, click forwarding, disabled behavior, ref/fallthrough, and renderer privacy.
  - Primary proof owner: `components/button/MDButton.test.ts` component contract tests.
  - Additional proof: type-check and renderer-boundary tests.
  - Existing proof: current component tests and `rendererBoundary.test.ts`; audit rather than assume authority.
  - New/updated proof: state restoration, false Boolean property mapping, and ref/native-type cases only where absent.
  - Risk/platform matrix: Vue custom-element property versus attribute behavior under Chromium and exact optional typing.
  - Persistent impact metadata: unit/component lane owns family source, types, exports, and tokens.
- Contract/scenario: pointer, keyboard, form, focus, disabled, 48 dp target, pressed-shape release, reduced motion, and loading composition.
  - Primary proof owner: Button Storybook behavior spec (`tests/e2e/storybook/md-button-family.spec.ts`).
  - Additional proof: app E2E only for complete product/form scenarios not faithfully owned in Storybook.
  - Existing proof: Button family Storybook behavior and target-hit stories; inspect current coverage.
  - New/updated proof: only gaps found against the selected state matrix.
  - Risk/platform matrix: Desktop Chromium and Mobile Chrome where impact mapping requires both; keyboard and pointer paths remain distinct.
  - Persistent impact metadata: Storybook behavior mapping includes Button production/story/token/type paths and owned support.
- Contract/scenario: selected seven-token contextual trace and Snackbar inverse-primary label/state-layer result.
  - Primary proof owner: Storybook browser computed-style assertions at rendered label/state-layer anatomy in resting, hover, focus, and press.
  - Additional proof: Button/Snackbar visual baselines and token declaration/catalogue agreement tests.
  - Existing proof: current Snackbar/Button specs and baselines are provisional because they do not prove every rendered label state.
  - New/updated proof: exact anatomy assertions for all four label states and three state-layer states.
  - Risk/platform matrix: light/dark theme where owned stories support it; contextual inverse surface; forced state must represent actual renderer state.
  - Persistent impact metadata: Button token/source changes select Button behavior/visual proof and Snackbar contextual proof.
- Contract/scenario: Loading Indicator replacement/restoration, decorative semantics, 24 px geometry, `currentColor`, and independent disabled/re-entry ownership.
  - Primary proof owner: Button component contract and Storybook behavior tests.
  - Additional proof: Button visual baseline and Loading Indicator dependency proof.
  - Existing proof: `MDButton.test.ts`, Button Storybook behavior/visual specs, Loading Indicator complete implementation.
  - New/updated proof: only missing parent-handoff cases; do not duplicate standalone dependency proof.
  - Risk/platform matrix: loading motion and contrast need operator acceptance; browser/provider waits remain product-owned text/status scenarios.
  - Persistent impact metadata: Button mapping owns composed story; Loading Indicator mapping owns standalone family.
- Contract/scenario: stable appearance for selected variants/sizes/states, themes, target overlay, and contextual Snackbar action.
  - Primary proof owner: bounded visual specs under `tests/e2e/visual/shared-ui`.
  - Additional proof: manual visual/motion acceptance.
  - Existing proof: current Button and Snackbar baselines; treat affected contextual baselines as provisional until token correction.
  - New/updated proof: baseline updates only for intentional accepted output after expected/actual/diff inspection.
  - Risk/platform matrix: configured desktop/mobile/theme projects; animation disabled only where the visual lane requires deterministic pixels.
  - Persistent impact metadata: mappings must include every changed family/story/context source and no spec paths as source prefixes.

Focused implementation feedback uses verify-managed unit/component, type-check, Storybook behavior, and visual lanes selected for changed files. Migration owns the one final read-only completion gate. Because this work affects release-owned production output/token styling and the repository roadmap requires it, the expected final gate is `pnpm verify:release`.

## Migration plan

1. Inventory every `MDButton` import/instance, direct `@m3e/web/button` import, raw `m3e-button`, renderer type/token, legacy Button wrapper, and selected public token consumer outside the canonical family.
2. Confirm current consumers fit the accepted `label`, `color`, `size`, `nativeType`, `disabled`, `loading`, `icon`, and `click` API. Migrate only approved official Button consumers; leave native HTML and distinct legacy Icon Button/FAB/navigation/menu primitives with their correct owners.
3. Preserve each product scenario and failure path: dialog submit/cancel, sheet/card actions, repository recovery disabled guards and status text, diagnostics, navigation/overlay targets, PWA install, Snackbar action, and compact icon-leading actions.
4. Update `MDSnackbar` to use the seven selected contextual tokens for inverse-primary label/state-layer states. Do not add an icon token for its separately owned Icon Button.
5. Confirm short library loading uses the accepted composition only where applicable. Keep browser/provider/user-controlled waits on feature-owned pending text, disabled conflicting actions, and live status; do not migrate them to Button loading.
6. Remove obsolete Button-specific legacy ownership, old public token names, deep imports, raw renderer usage, and replaced tests/styles. Do not remove unrelated native or other Material-family components.
7. Run focused product proof, then the one final read-only current-head `pnpm verify:release`; write `MIGRATION.md` with inventory, removals, preserved scenarios, exact verification, and operator acceptance status.

## Acceptance criteria

- `MDButton` exposes exactly the accepted Vue API, defaults to filled/small/round/native button, and leaks no m3e vocabulary.
- Filled, outlined, and text actions render the selected extra-small/small geometry, one required label, optional leading icon, disabled state, 48 dp target, and renderer-owned interaction/motion behavior.
- Submit Buttons participate in native forms; ordinary Buttons never submit accidentally; click payload and disabled suppression remain native/renderer-correct.
- Loading replaces and restores the icon, is decorative, sets Button busy semantics, remains 24 px/currentColor, and never implicitly disables activation.
- The seven official text tokens are the only selected public Button tokens. Snackbar rendered label and state layer resolve to inverse-primary across resting/hover/focus/press, while ordinary text Buttons fall back to primary.
- No obsolete five-token provisional names, compatibility aliases, contextual Button icon token, raw renderer detail, or descendant color cascade remains.
- Component, real-browser, contextual, visual, and product proofs agree; final verification passes; operator visual/motion acceptance is explicitly recorded before review completion.

## Risks

- m3e is the Web renderer despite official Web Expressive availability being listed as unavailable; browser proof must validate observable parity for the selected subset.
- The renderer owns private press and state-layer timing. Rapid successive activation remains a subjective motion risk because official guidance gives no normative web parameters.
- Custom-element Boolean bindings can serialize false dashed attributes as present; implementation must bind typed properties and prove false/true updates.
- Contextual state colors can appear correct at the host while rendered label/state-layer anatomy is wrong; proof must inspect the effective rendered owner.
- Token replacement affects Snackbar screenshots and may expose unrelated baseline drift; inspect expected, actual, and diff and report flakes separately.
- Loading Indicator uses dependency-owned exact-version workarounds; every m3e update must revalidate M3E-001/M3E-002 before accepting Button composition.

## Forbidden

- Expose renderer variants/types/tags/attributes/events/CSS variables, or add renderer capability for symmetry.
- Add toggle, other colors/sizes/shapes, links, trailing icons, form-data fields, or disabled-interactive without a revised architecture and confirmed demand.
- Add host pseudo-class timing/shape overrides, wrapper press state, ripple/state-layer clones, shadow-DOM access, descendant cascades, `!important`, or timing hacks.
- Make `loading` disable the Button, swallow clicks, own operation state, or replace feature-owned browser/provider wait status.
- Publish icon tokens without a confirmed contextual icon consumer, retain old `hover`/`focus` aliases, or derive public names from m3e.
- Treat unit tests, stories, host custom properties, snapshots, green verification, or implementation evidence as substitutes for rendered-anatomy proof and operator visual/motion acceptance.
- Migrate Icon Button, FAB, navigation, menu, or native HTML families as part of Button merely because they render a `<button>`.

## Implementation readiness

Ready. The Button design is current and complete; current product/library scenarios, selected/deferred surface, dependency closure, public API, seven-token contextual contract, exact renderer mapping, gap ownership, deterministic passes, proof ownership, migration inventory, acceptance criteria, risks, and forbidden approaches are resolved. No coding decision remains open.
