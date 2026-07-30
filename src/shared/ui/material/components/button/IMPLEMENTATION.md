# Button implementation

Status: complete, correction required  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
Implementation workspace state: canonical Button runtime, tokens, exports, component proof, and dependency artifacts inspected; visual-test ownership correction remains.

## Implemented passes

1. Audited the canonical single-host `MDButton.vue`, package-derived `@m3e/web/button@2.6.3` types, selected raw custom element, and family/root exports. The runtime adapter matches the accepted public API and renderer boundary.
2. Replaced the provisional five-token surface with the seven selected official contextual text Button tokens, added transient label mappings, removed the unconsumed icon token and old `hover`/`focus` names without aliases, and updated `docs/token-api.md` atomically.
3. Expanded component-contract proof for false Boolean property mapping, native/global fallthrough, and unchanged click payload forwarding. Revalidated defaults, selected values, native submit mapping, loading restoration, busy/decorative semantics, and disabled/loading independence.
4. Revalidated real-browser geometry, activation, form, focus, disabled, loading, target-hit, press restoration, reduced-motion, and legacy-surface coverage.
5. Added a Button-owned inverse-surface fixture and browser proof for resting, hovered, keyboard-focused, and pressed contextual label results. Added bounded visual baselines for those four states.
6. Revalidated Button Storybook behavior/visual impact selection and retained existing family mappings.

## Public API implemented

- Root-exported `MDButton` with required `label`; selected `color`, `size`, `nativeType`, `disabled`, and presentation-only `loading` props; optional leading `icon` slot; and unchanged `click(MouseEvent)` forwarding.
- Defaults remain filled, small, round, native `button`, enabled, and not loading.
- The single `m3e-button` host remains the semantic/native owner and receives global/native attribute fallthrough. Renderer-specific vocabulary remains private.
- Loading replaces and restores the leading icon, sets host `aria-busy`, composes a decorative 24 px `MDLoadingIndicator` using `currentColor`, and never implicitly disables activation.

## Tokens and renderer mappings implemented

- The public family surface is exactly the seven official text Button label/state-layer color tokens selected in `ARCHITECTURE.md`.
- Resting defaults to `--md-sys-color-primary`; transient label and state-layer tokens fall back to the resting label token.
- Private mappings target the installed renderer's exact label and state-layer inputs.
- The obsolete contextual icon token and non-official `hover`/`focus` public names have no compatibility aliases.

## Dependencies completed

- Loading Indicator `IMPLEMENTATION.md` is complete and its Button composition contract was revalidated.
- Material foundation system colors and state opacities remain the sole foundation owners.
- No new Button renderer defect was found; Loading Indicator M3E-001/M3E-002 remain dependency-owned.

## Proof completed

- `MDButton.test.ts`: selected tokens/private mappings, defaults and retained values, Boolean properties, fallthrough, native submit, event payload, label/icon, loading restoration, busy/decorative semantics, and disabled/loading independence.
- `md-button-family.spec.ts`: browser contract matrix plus rendered inverse-primary label results for resting, hover, keyboard focus, and pointer press.
- `md-button.spec.ts`: selected variants, sizes, loading, legacy surface, renderer interaction, and four contextual inverse-surface visual states.
- Package type-check, Vue raw-tag selection, renderer-boundary checks, and token catalogue agreement remain selected by workspace ownership.

## Verification performed

- Focused unit tests — passed.
- Type-check — passed.
- Focused Storybook behavior — passed, 15 tests.
- Button visual update and inspection — passed, 12 tests.
- Focused visual verification expanded to the full visual set; Button proof passed while the then-unmigrated Snackbar states identified the expected migration-stage token update.

The migration stage owns Snackbar adoption, affected consumer visual proof, and the final project verification.

## Architecture deviations

None.

## Remaining implementation blockers

- Remove `toBeFocused()` assertions from Button visual specs. The visual lane must only establish deterministic state and capture screenshots; focus success remains owned by Storybook behavior proof.

## Migration readiness

Blocked only on the visual-test ownership correction above. No public API, token, renderer mapping, or architecture change is required.
