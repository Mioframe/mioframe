# Button migration

Status: complete  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
IMPLEMENTATION.md reference: `./IMPLEMENTATION.md` (`Status: complete`, deviations none, migration ready)  
Migration commit/ref: working tree on `refactor/material-docs-ownership`, 2026-07-30

## Consumer inventory

- Audited all 22 source files that import the root-exported `MDButton`, including product actions in entities, features, widgets, and pages; shared Dialog, Snackbar, navigation, menu, tooltip, overlay, and state-layer compositions; and canonical product stories.
- Confirmed dialog submit/cancel, sheet/card actions, repository recovery, diagnostics, PWA install, Snackbar action, overlay/navigation targets, compact icon-leading actions, and short-operation loading all fit the accepted `label`, `color`, `size`, `nativeType`, `disabled`, `loading`, `icon`, and `click` contract.
- Confirmed no consumer outside `src/shared/ui/material` imports `@m3e/web/button`, renders `m3e-button`, uses renderer Button types, or consumes private `--m3e-*` Button variables.
- Left native HTML and distinct Icon Button, FAB, navigation, and menu ownership unchanged.

## Migrated consumers

- Existing Button instances already consumed the canonical root-exported `MDButton`; no adapter or prop migration was required.
- Migrated `src/shared/ui/Snackbar/MDSnackbar.vue` from the obsolete provisional Button token names to the seven selected official contextual text Button tokens.
- Snackbar now supplies inverse-primary for resting, hovered, focused, and pressed label colors and for hovered, focused, and pressed state-layer colors. Its separately owned Icon Button remains on the Icon Button token contract.

## Preserved scenarios and failure paths

- Dialog submit/cancel semantics, loading-owned disabled guards, and native submit behavior are unchanged.
- Repository recovery retains feature-owned pending text, disabled conflicting actions, re-entry protection, and live status; no browser/provider-controlled wait was converted to Button loading.
- Diagnostics, PWA install, sheet/card, navigation/overlay, Snackbar callback, compact icon-leading, and short library-operation scenarios retain their existing product owners and action paths.
- Snackbar action and close behavior are unchanged; only the contextual Button token handoff changed.

## Legacy ownership removed

- Removed Snackbar's obsolete `--md-comp-button-text-icon-color`, `--md-comp-button-text-hover-state-layer-color`, and `--md-comp-button-text-focus-state-layer-color` overrides.
- No compatibility aliases, raw renderer details, duplicate Button wrappers, deep imports, or obsolete Button exports remain outside the canonical family.
- Unrelated legacy native controls and other Material families were not removed.

## Proof completed

- Focused Storybook behavior proof verifies Snackbar surface/message/close ownership, rendered Button label color, and every selected transient contextual label/state-layer token through keyboard focus, pointer hover, and pointer press.
- Updated and inspected the three affected Snackbar interaction baselines for hover, keyboard focus, and press. The intended inverse-primary label/state-layer feedback changed while the 268 by 48 pixel Snackbar geometry and surrounding anatomy remained unchanged.
- `pnpm verify --files src/shared/ui/Snackbar/MDSnackbar.stories.ts src/shared/ui/Snackbar/MDSnackbar.vue tests/e2e/storybook/colorOwnership.spec.ts --profile local --only storybook-behavior` passed.
- `pnpm test:visual:update tests/e2e/visual/shared-ui/color-ownership.spec.ts` passed, 5 tests; exactly three Snackbar interaction baselines changed.
- `pnpm verify --only visual --files src/shared/ui/Snackbar/MDSnackbar.vue src/shared/ui/Snackbar/MDSnackbar.stories.ts tests/e2e/visual/shared-ui/color-ownership.spec.ts` passed, 219 tests.

## Final verification

- `pnpm verify:release` — passed on the current working tree after fresh design and architecture
  workers corrected the two upstream artifact formatting failures from the prior attempt.

## Remaining migration blockers

None. Operator visual/motion acceptance remains required by the architecture before independent
review can complete; it is not fabricated by this migration stage.

## Review readiness

Ready for a fresh independent `material-component-review` worker, with operator visual/motion
acceptance still required.
