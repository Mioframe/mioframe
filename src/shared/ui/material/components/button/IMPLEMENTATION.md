# Button implementation

Artifact revision: 2026-08-18
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/button/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-14T12:28:07.000Z
Revision summary: Revalidated the installed 2.7.4 Button boundary and Loading Indicator composition. The selected public token semantics are unchanged; the repository-wide component-token cascade correction now places family defaults on `:root` in `tokens.css` and keeps private renderer bridges in `MDButton.vue` CSS. M3E-006 remains a private, documented small-spacing mapping.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

1. Revalidated the single `m3e-button` host, package-derived renderer typing, selected custom-element registration, and family/root exports against installed `@m3e/web@2.7.4`.
2. Confirmed M3E-006: installed small Button defaults use 20dp leading/trailing spacing rather than the selected 16dp values. `MDButton.vue` keeps the two documented size-specific renderer inputs at 16px inside the family boundary; they are private implementation CSS, not public token declarations.
3. Revalidated the strict host-attribute allow-list, adapter-owned binding precedence, native type and Boolean-property mapping, required label, leading icon, and Loading Indicator composition.
4. Revalidated the seven selected official text Button tokens and the matching `docs/token-api.md` catalogue entries. Their Material defaults are declared once on `:root` in `tokens.css`; `MDButton.vue` maps those public tokens to the private renderer inputs without repeating defaults.
5. Revalidated the component and real-browser regression proof for the selected 16dp small geometry. The inert Navigation Path `--md-button-horizontal-padding` declaration remains unchanged for the migration stage.
6. Applied the repository component-token cascade correction: public family defaults no longer compete with contextual descendant overrides, and Loading Indicator composition uses one normal `.md-button__loading-indicator` override with no specificity escalation or source-order dependency.

## Public API implemented

- Canonical export: `MDButton` from `@shared/ui/material`.
- Props: required `label`; `color` (`filled`, `outlined`, or `text`, default `filled`); `size` (`extra-small` or `small`, default `small`); `nativeType` (`button` or `submit`, default `button`); `disabled`; and presentation-only `loading`.
- Slot: optional leading `icon`, replaced by the decorative Loading Indicator while loading and restored afterward.
- Emit: `click(event: MouseEvent)` with the renderer host event forwarded unchanged.
- Root: one semantic `m3e-button`; no wrapper or exposed imperative API.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-controls`, `aria-describedby`, `aria-expanded`, and `aria-haspopup` reach the host. Adapter-owned `aria-busy`, disabled, type, size, round shape, non-toggle mode, variant, and click mapping retain precedence.

## Tokens and renderer mappings

`components/button/tokens.css` owns exactly these public tokens and declares their selected Material defaults on `:root`:

- `--md-comp-button-text-label-text-color`
- `--md-comp-button-text-hovered-label-text-color`
- `--md-comp-button-text-focused-label-text-color`
- `--md-comp-button-text-pressed-label-text-color`
- `--md-comp-button-text-hovered-state-layer-color`
- `--md-comp-button-text-focused-state-layer-color`
- `--md-comp-button-text-pressed-state-layer-color`

`MDButton.vue` owns the corresponding private `--m3e-text-button-*` label and state-layer bridges. Transient public defaults resolve through the resting public label token. No icon token, compatibility alias, old `hover`/`focus` public name, or renderer variable is public.

The same component-local implementation CSS sets `--m3e-button-small-leading-space` and `--m3e-button-small-trailing-space` to 16px for the selected small renderer host (M3E-006). These documented renderer inputs are not public Mioframe tokens and do not add a Vue prop.

Public `color`, `size`, and `nativeType` map through exported renderer types. Round shape and `toggle=false` are private constants. `disabled` is a Boolean property. Loading sets Button `aria-busy`, projects public `MDLoadingIndicator` at 24 px with `aria-hidden="true"`, and hands off `currentColor` through the dependency's public active-indicator token without acquiring interaction or operation ownership. The dependency's family `:root` default remains available whenever the contextual Button override is absent.

## Dependencies

- `loadingIndicator`: consumed only through public `MDLoadingIndicator`. Current independent review revision `2026-08-01T11:50:04.390Z` is compliant with route `none/none`.
- Material foundation: supplies selected system color, typography, shape, elevation, state-opacity, and motion roles.
- `@m3e/web@2.7.4`: private renderer boundary; `M3eButtonElement`, `ButtonVariant`, and `ButtonSize` provide package-derived glue.

Dependency queue: none.

## Component-owned proof

- `MDButton.test.ts` proves defaults and retained mappings, Boolean-property behavior, label/icon projection, unchanged click payload, loading replacement/restoration and decorative semantics, disabled/loading independence, selected token ownership, private renderer-bridge ownership, M3E-006 mapping ownership, the ordinary non-doubled Loading Indicator contextual selector, and the exact host-attribute allow-list including dynamic add/remove/re-add and rejected attributes/listeners.
- `MDButton.browser.spec.ts` proves native form submission, ordinary and disabled activation, loading activation ownership, selected small geometry, target behavior, focus/pointer/keyboard behavior, dynamic renderer-surface rejection, native click bubbling, rendered label/loading color ownership, the contextual Loading Indicator token handoff, and contextual label states without private shadow-DOM inspection.
- `MDButton.visual.spec.ts` owns bounded selected variant, size, loading, interaction-state, contextual-token, and legacy-surface baselines under the family-local visual ownership convention. `md-button-loading-linux.png` remains the rendered proof for Button loading composition.
- Loading Indicator standalone semantics, default/public token behavior, geometry, animation, renderer workarounds, and standalone visuals remain dependency-owned and are not duplicated here.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## @m3e/web 2.7.4 compatibility revalidation

The installed public Button types remain compatible with the existing package-derived mapping. Installed `2.7.4` changes the small leading/trailing fallback from 16dp to 20dp, while preserving the documented size-specific CSS inputs; M3E-006 keeps the selected 16dp geometry through those inputs within `MDButton.vue` implementation CSS. PressedController, ripple, and StateLayer implementation changes remain renderer-private: `MDButton` keeps one semantic renderer host and does not expose or recreate those details. Pointer, keyboard, focus, loading, disabled, geometry, and visual proof remain the contract owners.

## Stage verification

Focused verifier-managed compatibility proof completed on 2026-08-14:

- The verifier-managed format lane passed for every changed canonical-family artifact after a safe format-only correction and read-only rerun.
- The verifier-managed ESLint and Oxlint lanes passed for changed runtime, proof, declaration, and renderer-boundary files.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/tokens.css` — passed; mapping ownership selected.
- The verifier-managed unit/component lane passed for the Loading Indicator, Button, Switch, Checkbox, and renderer-boundary tests; `pnpm verify --only type-check` passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.browser.spec.ts src/shared/ui/material/components/button/MDButton.browser.spec.ts src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts src/shared/ui/material/components/checkbox/MDCheckbox.browser.spec.ts` — passed; all 37 affected-family browser contracts passed.
- `pnpm verify --only visual --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.visual.spec.ts src/shared/ui/material/components/switch/MDSwitch.visual.spec.ts src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts tests/e2e/visual/shared-ui/md-button.spec.ts` — passed; verifier-selected 214-reference visual suite passed with no baseline update.

For the later S4-E ownership/cascade correction, the coding-agent handoff reports final `pnpm verify` passed. Exact-head GitHub CI remains the architect-owned final gate and is not recorded as passed here until the current PR head completes it successfully.

## Architecture deviations

None. The later public-default/private-bridge placement follows the repository-wide cascade contract in `../../docs/component-tokens.md` and does not change the selected public token semantics.

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, tokens, exports, dependency composition, component-owned proof, and selected public semantics remain aligned with `ARCHITECTURE.md`; cascade/default placement additionally follows the repository-wide `docs/component-tokens.md` contract. Consumer inventory, contextual Snackbar adoption, obsolete consumer ownership removal (including Navigation Path's inert legacy padding declaration), and product-scenario verification remain exclusively in the migration stage.
