# Button review

Reviewed workspace state: current Button `DESIGN.md`/`ARCHITECTURE.md`/`IMPLEMENTATION.md`/`MIGRATION.md`; `MDButton.vue`, `tokens.css`, `MDButton.test.ts`; `tests/e2e/visual/shared-ui/md-button.spec.ts`; `tests/e2e/storybook/md-button-family.spec.ts`; `src/shared/ui/AppBar/MDAppBar.vue`; `src/shared/ui/Snackbar/MDSnackbar.vue`; `docs/token-api.md`; `docs/roadmap.md`; the `src/shared/ui/material` `AGENTS.md` chain; and current `.verify/logs/*` (23:20–23:44, 2026-07-30) inspected directly, independent of the prior review and the two correction workers' self-reports.
Review date: 2026-07-31
DESIGN.md status: `current`
ARCHITECTURE.md status: `ready`
IMPLEMENTATION.md status: `complete`
MIGRATION.md status: `complete`
Operator visual status: required
Verdict: compliant-with-listed-risks

## Goal and scenarios reviewed

This is a re-review after the prior `REVIEW.md` (2026-07-30, verdict `blocked`) found two correction items and routed them to `implementation`. Both correction claims are independently re-verified below from the actual files, not accepted on the correction workers' prose. The full demand-scoped Button family remains in scope: filled/outlined/text color, extra-small/small size, required label with optional leading icon, native button/submit, disabled behavior, loading composition via `MDLoadingIndicator`, 48×48dp target, keyboard/pointer/focus/press/reduced-motion behavior, the seven-token Snackbar contextual contract, and current product consumers.

## Official design compliance

No design change occurred in this correction round. `DESIGN.md` still records all four official Button tabs and the complete token resource with a documented refresh attempt and no evidence of a newer revision. No design correction is required.

## Architecture compliance

No architecture change occurred in this correction round. `ARCHITECTURE.md` remains `ready`, still selects the narrowest current surface, keeps `m3e-button` as the single semantic/native host, and traces the seven contextual text tokens end to end. No architecture correction is required.

## Implementation compliance

Correction 1 re-verified directly against the file, not the implementation worker's report:

- `tests/e2e/visual/shared-ui/md-button.spec.ts` contains zero `toBeFocused()` (or any other behavioral) assertions. Both focus-adjacent tests (`...focus baseline` at line ~125 and the real-interaction focus-feedback test at line ~56) drive only a deterministic `page.keyboard.press('Tab')`, with an explicit comment attributing focus-success proof to the Storybook behavior lane, then capture the settled screenshot with `animations: 'disabled'`. This matches the required visual-lane scope: establish state, capture appearance, assert nothing behavioral.
- `MDButton.vue`, `tokens.css`, and `MDButton.test.ts` are unchanged in substance from the prior accepted implementation: the seven official contextual tokens are declared exactly as architected (verified verbatim in `tokens.css`), no leftover `hover`/`focus`-named public token or contextual icon token remains, the single `m3e-button` host receives the private renderer mappings, and `MDButton.test.ts` covers false-Boolean property mapping, `aria-busy` toggling on `loading`, and disabled-while-loading precedence exactly as `IMPLEMENTATION.md` claims.

No implementation-owned finding remains.

## Migration and legacy removal

Correction 2 re-verified directly:

- `src/shared/ui/AppBar/MDAppBar.vue`'s `&__trailing-elements` rule (lines 59–63) declares only `display`, `gap`, and `margin-right`; the `--md-content-color` declaration is gone, and no replacement generic descendant color bridge was added.
- An independent repository-wide search for `--md-content-color` found no remaining reference anywhere that depends on inheritance from `MDAppBar__trailing-elements`: every other declaration/consumption of that property (MDCard, MDChipBase, MDSwitch, MDMenuItemBase, MDNavigationRailButton/BarButton, MDSnackbar, MDBottomSheet\*, MDTable, MDSplitLayout, `ripple.css`, `RepositoryExplorerWidget`, `VfsActivityStatusChip`, etc.) sets or reads the property on its own subtree, not by inheriting AppBar's removed value. The 8 pane-level files that use the `trailingElements` slot (`HomePane`, `DocumentViewPane`, `SettingsPane`, `HelpArticlePane`, `HelpIndexPane`, `DataStoragePrivacyPane`, `RepoExplorerPane`, `AboutMioframePane`) each render `MDIconButton`, `MDContextMenuButton`, `RepositoryExplorerEntryManageButton`, or `MDAssistChip`/`VfsActivityStatusChip` content that sets its own color chain, matching `MIGRATION.md`'s claim.
- `MDSnackbar.vue`'s `&__action` rule sets exactly the seven selected contextual tokens (four label-text states, three state-layer states) to `--md-sys-color-inverse-primary`, matching the architected trace.

No migration-owned finding remains.

## Documentation consistency

`docs/token-api.md` (`populated`) lists exactly the seven accepted Button tokens with no provisional names or aliases, consistent with `tokens.css`. `docs/roadmap.md` (last updated 2026-07-30, correction round) accurately records both findings as resolved, records the real `pnpm verify` result, and correctly names "launch a new independent review worker" as the only remaining step before the operator visual/motion gate — consistent with what this review is doing. No documentation correction is required.

## Proof and verification

`.verify/logs/*` (all timestamped 2026-07-30, 23:20:xx–23:44:14, a single contiguous run) were read directly and match `MIGRATION.md`'s recorded final verification exactly:

- `format.log`, `oxlint.log`, `type-check.log`: clean.
- `eslint.log`: 0 errors, 1 pre-existing `scripts/agentEnvironment.mjs:394` `jsdoc/require-jsdoc` warning, unrelated to Button.
- `unit-tests.log`: 259 passed (25 files).
- `e2e.log`: 110 passed (10.5m).
- `storybook-behavior.log`: 34 passed (1.5m), including the `MDButton focus indicator follows real keyboard focus...` test (`--focus-indicator-target` story) and the `MDButton renders contextual text label colors in every selected state` test (`--contextual-text-tokens` story), both of which assert `toBeFocused()` directly against the actual file — confirming Storybook behavior proof independently owns keyboard-focus success for both the plain and contextual-text scenarios, so no coverage gap was introduced by removing the visual-lane assertions.
- `visual.log`: 219 passed (6.5m).
- `mutation.log`: final score 85.95 ≥ break threshold 60.

`pnpm verify:status` currently reports `idle` (no run in progress), consistent with this being a completed, settled result rather than a stale or partial one. No rerun was necessary; this review did not start a new verification run.

Automated proof does not substitute for operator assessment of appearance and renderer-owned motion.

## Blockers

None remaining from the two prior technical findings — both are resolved and independently re-verified above.

1. Record operator visual/motion acceptance for Button, standalone and Button-composed Loading Indicator, Snackbar contextual states, and the other affected color-ownership surfaces. This is the sole remaining gate; it requires a human visual/motion judgment this review cannot grant.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- Official Web Expressive availability is documented as unavailable, so the installed renderer remains accepted only for the selected subset backed by observable browser proof.
- Rapid successive activation remains a subjective motion risk because official guidance provides no normative Web timing parameters.
- The newest complete official snapshot is older than the nominal refresh threshold; refresh tooling found no evidence of a newer revision.
- Loading Indicator retains dependency-owned exact-version workarounds M3E-001 and M3E-002, which require revalidation on a renderer update.

## Items not required

- No change to `DESIGN.md`, `ARCHITECTURE.md`, the public Button API, or the accepted seven-token set.
- No toggle, additional colors/sizes/shapes, trailing-icon, link, form-data, or disabled-interactive API.
- No Button-owned operation state, status messaging, disabled guard, or re-entry guard.
- No renderer compatibility layer, interaction clone, descendant cascade, private shadow-DOM contract, or contextual icon token.
- No migration of Icon Button, FAB, navigation, menu, or ordinary native HTML controls.

## Required return stage

None. Both prior findings are resolved and independently confirmed against actual workspace state; no new technical finding requires returning to design, architecture, implementation, or migration.

## Completion status

Technically complete. The only remaining gate is operator visual/motion acceptance for Button, standalone and Button-composed Loading Indicator, Snackbar contextual states, and the other affected color-ownership surfaces — a manual judgment this review stage does not own and cannot grant.
