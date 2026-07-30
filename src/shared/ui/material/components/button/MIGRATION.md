# Button migration

Status: complete, correction required  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
IMPLEMENTATION.md reference: `./IMPLEMENTATION.md` (`Status: complete`, implementation correction required)  
Migration workspace state: Button consumers, Snackbar contextual handoff, legacy ownership, consumer proof, and project verification evidence inspected; AppBar cleanup remains.

## Consumer inventory

- Audited all source files that import the root-exported `MDButton`, including product actions in entities, features, widgets, and pages; shared Dialog, Snackbar, navigation, menu, tooltip, overlay, and state-layer compositions; and canonical product stories.
- Confirmed dialog submit/cancel, sheet/card actions, repository recovery, diagnostics, PWA install, Snackbar action, overlay/navigation targets, compact icon-leading actions, and short-operation loading fit the accepted public contract.
- Confirmed no consumer outside `src/shared/ui/material` imports the renderer Button package, renders its raw element, uses renderer Button types, or consumes private renderer Button variables.
- Left native HTML and distinct Icon Button, FAB, navigation, and menu ownership unchanged.

## Migrated consumers

- Existing Button instances already consumed the canonical root-exported `MDButton`; no adapter or prop migration was required.
- Migrated `src/shared/ui/Snackbar/MDSnackbar.vue` from obsolete provisional Button token names to the seven selected official contextual text Button tokens.
- Snackbar supplies inverse-primary for resting, hovered, focused, and pressed label colors and for hovered, focused, and pressed state-layer colors. Its separately owned Icon Button remains on the Icon Button token contract.

## Preserved scenarios and failure paths

- Dialog submit/cancel semantics, loading-owned disabled guards, and native submit behavior are unchanged.
- Repository recovery retains feature-owned pending text, disabled conflicting actions, re-entry protection, and live status; no browser/provider-controlled wait was converted to Button loading.
- Diagnostics, PWA install, sheet/card, navigation/overlay, Snackbar callback, compact icon-leading, and short library-operation scenarios retain their product owners and action paths.
- Snackbar action and close behavior are unchanged; only the contextual Button token handoff changed.

## Legacy ownership removed

- Removed Snackbar's obsolete provisional Button token overrides.
- No compatibility aliases, raw renderer details, duplicate Button wrappers, deep imports, or obsolete Button exports remain outside the canonical family.
- Unrelated legacy native controls and other Material families were not removed.

## Proof completed

- Focused Storybook behavior verifies Snackbar surface/message/close ownership, rendered Button label color, and every selected transient contextual label/state-layer token through keyboard focus, pointer hover, and pointer press.
- Updated and inspected the affected Snackbar interaction baselines. The intended inverse-primary feedback changed while Snackbar geometry and surrounding anatomy remained unchanged.
- Focused Storybook behavior and visual project checks passed for the migrated Snackbar contract.

## Final verification

The recorded full project verification passed before the two follow-up corrections were identified. It must be rerun after the visual-test ownership correction and AppBar cleanup.

## Remaining migration blockers

- Remove the ineffective `--md-content-color` declaration from `MDAppBar.__trailing-elements` without adding a generic descendant color bridge.
- Rerun the required project verification after both correction-owned file changes are complete.

## Review readiness

Blocked until the implementation correction, AppBar cleanup, and resulting project verification are complete. Operator visual/motion acceptance remains a later review gate.
