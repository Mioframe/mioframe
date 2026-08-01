# Button implementation

Artifact revision: 2026-08-01T12:02:58.888Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/button/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-01T11:51:42.309Z
Revision summary: Revalidated Button implementation and proof against the current Loading Indicator review without changing migration-owned Navigation Path behavior.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

1. Revalidated the single `m3e-button` host, package-derived renderer typing, selected custom-element registration, and family/root exports against installed `@m3e/web@2.6.3`.
2. Revalidated the strict host-attribute allow-list, adapter-owned binding precedence, native type and Boolean-property mapping, required label, leading icon, and Loading Indicator composition.
3. Revalidated the seven selected official text Button tokens, their private renderer mappings and fallbacks, and the matching `docs/token-api.md` catalogue entries.
4. Revalidated component-contract, real-browser, contextual rendered-anatomy, and bounded visual proof. No production, proof, mapping, or baseline correction was required. The inert Navigation Path `--md-button-horizontal-padding` declaration remains unchanged for the migration stage.

## Public API implemented

- Canonical export: `MDButton` from `@shared/ui/material`.
- Props: required `label`; `color` (`filled`, `outlined`, or `text`, default `filled`); `size` (`extra-small` or `small`, default `small`); `nativeType` (`button` or `submit`, default `button`); `disabled`; and presentation-only `loading`.
- Slot: optional leading `icon`, replaced by the decorative Loading Indicator while loading and restored afterward.
- Emit: `click(event: MouseEvent)` with the renderer host event forwarded unchanged.
- Root: one semantic `m3e-button`; no wrapper or exposed imperative API.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-controls`, `aria-describedby`, `aria-expanded`, and `aria-haspopup` reach the host. Adapter-owned `aria-busy`, disabled, type, size, round shape, non-toggle mode, variant, and click mapping retain precedence.

## Tokens and renderer mappings

`components/button/tokens.css` owns exactly these public tokens:

- `--md-comp-button-text-label-text-color`
- `--md-comp-button-text-hovered-label-text-color`
- `--md-comp-button-text-focused-label-text-color`
- `--md-comp-button-text-pressed-label-text-color`
- `--md-comp-button-text-hovered-state-layer-color`
- `--md-comp-button-text-focused-state-layer-color`
- `--md-comp-button-text-pressed-state-layer-color`

They map owner-locally to the corresponding private `--m3e-text-button-*` label and state-layer inputs. Transient tokens fall back to the resting public label token. No icon token, compatibility alias, old `hover`/`focus` public name, or renderer variable is public.

Public `color`, `size`, and `nativeType` map through exported renderer types. Round shape and `toggle=false` are private constants. `disabled` is a Boolean property. Loading sets Button `aria-busy`, projects public `MDLoadingIndicator` at 24 px with `aria-hidden="true"`, and hands off `currentColor` through the dependency's public active-indicator token without acquiring interaction or operation ownership.

## Dependencies

- `loadingIndicator`: consumed only through public `MDLoadingIndicator`. Current independent review revision `2026-08-01T11:50:04.390Z` is compliant with route `none/none`.
- Material foundation: supplies selected system color, typography, shape, elevation, state-opacity, and motion roles.
- `@m3e/web@2.6.3`: private renderer boundary; `M3eButtonElement`, `ButtonVariant`, and `ButtonSize` provide package-derived glue.

Dependency queue: none.

## Component-owned proof

- `MDButton.test.ts` proves defaults and retained mappings, Boolean-property behavior, label/icon projection, unchanged click payload, loading replacement/restoration and decorative semantics, disabled/loading independence, selected token ownership, and the exact host-attribute allow-list including dynamic add/remove/re-add and rejected attributes/listeners.
- `tests/e2e/storybook/md-button-family.spec.ts` proves native form submission, ordinary and disabled activation, loading activation ownership, geometry and target behavior, focus/pointer/keyboard behavior, dynamic renderer-surface rejection, native click bubbling, rendered label/loading color ownership, and contextual label states without private shadow-DOM inspection.
- `tests/e2e/visual/shared-ui/md-button.spec.ts` owns bounded selected variant, size, loading, interaction-state, contextual-token, and legacy-surface baselines. The current focused visual run passed all 219 selected references; no baseline changed, so no expected/actual/diff artifact required inspection.
- Loading Indicator standalone semantics, geometry, animation, renderer workarounds, and standalone visuals remain dependency-owned and are not duplicated here.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

Focused verifier-managed implementation proof completed on 2026-08-01:

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/tokens.css src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts tests/e2e/visual/shared-ui/md-button.spec.ts` — passed; `MDButton.test.ts` selected.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed; Button family behavior and Storybook smoke selected.
- `pnpm verify --only visual --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/tokens.css src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/visual/shared-ui/md-button.spec.ts` — passed; full visual fallback completed 219 references with no baseline update.

This implementation stage did not run migration, independent review, or the outer workflow's final verification.

## Architecture deviations

None.

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, tokens, exports, dependency composition, component-owned proof, and focused stage verification match `ARCHITECTURE.md` revision `2026-08-01T11:51:42.309Z`. Consumer inventory, contextual Snackbar adoption, obsolete consumer ownership removal (including Navigation Path's inert legacy padding declaration), and product-scenario verification remain exclusively in the migration stage.
