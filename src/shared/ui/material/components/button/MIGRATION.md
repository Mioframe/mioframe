# Button migration

Status: complete  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
IMPLEMENTATION.md reference: `./IMPLEMENTATION.md` (`Status: complete`, implementation correction applied)  
Migration workspace state: Button consumers, Snackbar contextual handoff, legacy ownership, consumer proof, and project verification evidence inspected; AppBar cleanup applied and verified.

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
- Removed the ineffective `--md-content-color: var(--md-sys-color-on-surface-variant);` declaration from `MDAppBar.vue`'s `&__trailing-elements` rule (`src/shared/ui/AppBar/MDAppBar.vue`). This custom property had no accepted Button or contextual-color contract behind it: every component actually rendered inside the AppBar `trailingElements` slot across all 8 consumers (`MDIconButton` directly or via `MDContextMenuButton`/`RepositoryExplorerEntryManageButton`, and `MDAssistChip` via `VfsActivityStatusChip`) sets its own `--md-content-color`/`color` chain on its own root and never relied on the inherited value from AppBar. Confirmed by consumer inspection before removal; no replacement generic descendant color bridge or new contextual-color contract was introduced, per REVIEW.md's explicit instruction.
- No compatibility aliases, raw renderer details, duplicate Button wrappers, deep imports, or obsolete Button exports remain outside the canonical family.
- Unrelated legacy native controls and other Material families were not removed.

## Proof completed

- Focused Storybook behavior verifies Snackbar surface/message/close ownership, rendered Button label color, and every selected transient contextual label/state-layer token through keyboard focus, pointer hover, and pointer press.
- Updated and inspected the affected Snackbar interaction baselines. The intended inverse-primary feedback changed while Snackbar geometry and surrounding anatomy remained unchanged.
- Focused Storybook behavior and visual project checks passed for the migrated Snackbar contract.

## Final verification

`pnpm verify` (full run, no `--only` scope, started 2026-07-30T19:20:11Z) was rerun after both the implementation visual-lane correction and this migration's AppBar cleanup were applied. Result: **passed**, all 10 checks green:

- `agent-environment`: passed
- `format`: passed (136 files, correct format)
- `oxlint`: passed
- `eslint`: passed (0 errors; 1 pre-existing warning in `scripts/agentEnvironment.mjs:394` (`jsdoc/require-jsdoc`), unrelated to this change and not in this correction's scope)
- `type-check`: passed (no errors)
- `unit-tests`: 259 passed (25 files)
- `e2e`: 110 passed (10.5m)
- `storybook-behavior`: 34 passed (1.5m)
- `visual`: 219 passed (6.5m)
- `mutation`: score 85.95, ≥ break threshold 60 — passed

An earlier full run's `e2e` check failed with a container-level `SIGTERM` (Podman container hit its resource/timeout limit mid-suite, with one `Mobile Chrome` `appSmoke` test timing out waiting for a UI label) before reaching the `storybook-behavior`, `visual`, and `mutation` checks. A focused `pnpm verify --only e2e` rerun passed cleanly, confirming the failure was a transient environment/container flake unrelated to the one-line CSS declaration removed by this change. The full `pnpm verify` gate was then rerun end-to-end and passed all 10 checks as recorded above.

## Remaining migration blockers

None. Both migration-owned findings are resolved:

- The ineffective `--md-content-color` declaration was removed from `MDAppBar.__trailing-elements` without adding a generic descendant color bridge.
- The required project verification was rerun after both correction-owned file changes (implementation visual-lane correction and this AppBar cleanup) and passed in full.

## Review readiness

Clean. The implementation correction, AppBar cleanup, and resulting full project verification are all complete and passing. Ready for a fresh independent review worker. Operator visual/motion acceptance remains a separate, later review gate not owned by this stage.
