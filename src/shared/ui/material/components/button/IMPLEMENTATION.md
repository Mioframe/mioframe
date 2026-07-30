# Button implementation

Status: complete  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
Implementation commit/ref: working tree on `refactor/material-docs-ownership`, 2026-07-30

## Implemented passes

1. Audited the canonical single-host `MDButton.vue`, package-derived `@m3e/web/button@2.6.3` types, selected raw custom element, and family/root exports. The existing runtime adapter already matches the accepted public API and renderer boundary.
2. Replaced the provisional five-token surface with the seven selected official contextual text Button tokens, added the transient label mappings, removed the unconsumed icon token and old `hover`/`focus` names without aliases, and updated `docs/token-api.md` atomically.
3. Expanded component-contract proof for false Boolean property mapping, native/global fallthrough, and unchanged click payload forwarding. Revalidated defaults, selected values, native submit mapping, loading restoration, busy/decorative semantics, and disabled/loading independence.
4. Revalidated existing real-browser geometry, activation, form, focus, disabled, loading, target-hit, press restoration, reduced-motion, and legacy-surface coverage.
5. Added a Button-owned inverse-surface fixture and browser proof for resting, hovered, keyboard-focused, and pressed contextual label results. Added and inspected bounded visual baselines for those four states so renderer-owned state-layer output is proven without private shadow-DOM access.
6. Revalidated Button Storybook behavior/visual impact selection and retained the existing family mappings.

## Public API implemented

- Root-exported `MDButton` with required `label`; selected `color`, `size`, `nativeType`, `disabled`, and presentation-only `loading` props; optional leading `icon` slot; and unchanged `click(MouseEvent)` forwarding.
- Defaults remain filled, small, round, native `button`, enabled, and not loading.
- The single `m3e-button` host remains the semantic/native owner and receives global/native attribute fallthrough. Renderer-specific vocabulary remains private.
- Loading replaces and restores the leading icon, sets host `aria-busy`, composes a decorative 24 px `MDLoadingIndicator` using `currentColor`, and never implicitly disables activation.

## Tokens and renderer mappings implemented

- The public family surface is exactly the seven official text Button label/state-layer color tokens selected in `ARCHITECTURE.md`.
- Resting defaults to `--md-sys-color-primary`; transient label and state-layer tokens fall back to the resting label token.
- Private mappings target the installed renderer's exact `label-text`, `hover-label-text`, `focus-label-text`, `pressed-label-text`, and corresponding state-layer inputs.
- The obsolete contextual icon token and non-official `hover`/`focus` public names have no compatibility aliases.

## Dependencies completed

- Loading Indicator `IMPLEMENTATION.md` is complete and its Button composition contract was revalidated.
- Material foundation system colors and state opacities remain the sole foundation owners.
- No new Button renderer defect was found; Loading Indicator M3E-001/M3E-002 remain dependency-owned.

## Proof completed

- `MDButton.test.ts`: selected tokens/private mappings, defaults and retained values, Boolean properties, fallthrough, native submit, event payload, label/icon, loading restoration, busy/decorative semantics, and disabled/loading independence.
- `md-button-family.spec.ts`: existing browser contract matrix plus rendered inverse-primary label results for resting, hover, keyboard focus, and pointer press.
- `md-button.spec.ts`: existing selected variants/sizes/loading/legacy-surface and renderer interaction baselines plus four inspected contextual inverse-surface baselines.
- Package type-check, Vue raw-tag selection, renderer-boundary checks, and token catalogue agreement remain selected by existing repository ownership.

## Verification performed

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/tokens.css src/shared/ui/material/docs/token-api.md` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --files src/shared/ui/material/components/button/MDButton.stories.ts src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/tokens.css tests/e2e/storybook/md-button-family.spec.ts --profile local --only storybook-behavior` — passed, 15 tests.
- `pnpm test:visual:update tests/e2e/visual/shared-ui/md-button.spec.ts` — passed, 12 tests; four new baselines were inspected.
- `pnpm verify --only visual --files src/shared/ui/material/components/button/MDButton.stories.ts src/shared/ui/material/components/button/tokens.css tests/e2e/visual/shared-ui/md-button.spec.ts` — Button proof passed, but the current resolver expanded to 219 tests and the three existing Snackbar interaction baselines failed because that consumer still sets the obsolete token names. This is the expected migration-stage change recorded in `ARCHITECTURE.md`; 216 tests passed.

The migration stage owns the Snackbar token switch, affected Snackbar baseline update after inspection, product-consumer proof, and the single final `pnpm verify:release` completion gate.

## Architecture deviations

None.

## Remaining implementation blockers

None. Snackbar adoption of the new public tokens is migration-owned. Operator visual/motion acceptance remains a later review gate.

## Migration readiness

Ready. Canonical Button runtime, tokens, mappings, exports, component-owned proof, and the complete Loading Indicator handoff agree with the accepted architecture.
