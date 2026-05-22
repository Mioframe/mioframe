# Material 3 foundation audit details

This file extends [Material 3 foundation audit](./foundation-audit.md) with source-backed findings from the current code and the local Material 3 cache.

## Sources checked

Project sources:

- `src/shared/lib/md/tokens.css`
- `postcss.config.js`
- `src/shared/ui/Button/MDButton.vue`
- `src/shared/ui/Button/MDIconButton.vue`
- `src/shared/ui/Button/MDFab.vue`
- `src/shared/ui/Lists/MDListItem.vue`
- `src/shared/ui/Dialog/DialogForm.vue`
- `src/shared/ui/TextField/MDTextField.vue`
- `src/shared/ui/TextField/MDFieldContainer.vue`
- `src/shared/ui/Chips/MDChipBase.vue`
- `src/shared/ui/Menu/MDMenuBase.vue`
- `src/shared/ui/State/MDStateLayer.vue`
- `src/shared/ui/State/useStateLayer.ts`
- `tests/e2e/visual/shared-ui.spec.ts`

Material 3 cache pages:

- `pages/components/buttons/overview.md`
- `pages/components/buttons/specs.md`
- `pages/components/icon-buttons/overview.md`
- `pages/components/floating-action-button/overview.md`
- `pages/components/lists/overview.md`
- `pages/components/dialogs/overview.md`
- `pages/components/chips/overview.md`
- `pages/components/menus/overview.md`

The cache is treated as the readable Material 3 source for this project.

## Executive result

The project can proceed with gradual Material 3 normalization, but not with broad restyling.

The main problem is not missing components. The main problem is that the foundation is only partially normalized:

- system tokens exist, but public component tokens are mostly missing;
- Material typography still uses legacy `pt` because `sp` conversion is absent;
- state-layer system tokens are declared but not directly consumed by `MDStateLayer`;
- Storybook and visual tests exist for the strongest pilot families, but the hierarchy still uses legacy `shared/ui/...` names;
- overlay ownership is inconsistent: menus use the shared overlay/teleport model, while dialogs currently use a separate fixed native-dialog path.

## Foundation findings

### Tokens

`tokens.css` already contains Material reference palette, typeface, system color, shape, elevation, typescale, state, and motion tokens. It also contains one progress-indicator component token.

Gaps:

- most component-family values remain local variables such as `--md-button-*`, `--md-icon-button-*`, `--md-fab-*`, `--md-list-item-*`, and field-local border/padding variables;
- `--unknownColor` is a debug fallback and should not become public API;
- `--md-sys-color-surface-tint-color` is already marked deprecated;
- light/dark theme exists through `prefers-color-scheme`, but there is no explicit app-level theme override contract;
- token validation does not yet enforce completeness or component-token shape.

Decision: keep the monolithic token file until the Buttons pilot proves the token pattern. Add `--md-comp-*` tokens during each component-family migration.

### Units and typography

`postcss.config.js` converts `step`, `pt`, and `dp`. It does not convert `sp`.

`tokens.css` still authors typescale sizes, line heights, and tracking with `pt`.

Decision: add `sp` support before typography migration. Do not hide typography migration inside an unrelated component PR.

### State layers

`MDStateLayer` supports hover, focused, pressed, dragged, and disabled. `useStateLayer` centralizes hover, focus-visible, pressed, and dragged state, and is already used by the important interactive primitives.

Gap: `tokens.css` declares `--md-sys-state-hover-state-layer-opacity`, `--md-sys-state-focus-state-layer-opacity`, and `--md-sys-state-pressed-state-layer-opacity`, but `MDStateLayer` consumes local aliases such as `--md-state-hover-layer-opacity` with fallback values.

Decision: wire `MDStateLayer` to the declared system state tokens before or during the Buttons pilot. If local aliases remain, document them as private compatibility aliases. Dragged state should be source-backed or explicitly documented as a project extension.

### Storybook and visual coverage

Current stories still use legacy titles such as `shared/ui/MDButton` instead of `Material 3/Components/...` or `Project UI/...`.

Visual tests already cover:

- `MDButton` states, interaction states, target layers, and expanded hit area;
- `MDIconButton` states, target layers, compact toolbar layout, and dense toolbar behavior;
- `MDChip` states;
- `MDCheckbox` states;
- `MDFab` states;
- `MDListItem` states and trailing action layout;
- `MDStateLayer` states and host integrations.

Gaps: dialogs, text fields, menus, sheets, navigation, cards, tooltips, snackbars, and progress indicators do not yet have equivalent registry-backed coverage.

Decision: rename Storybook hierarchy during each component-family migration and update Playwright story IDs in the same PR.

## Cross-family risks

1. Storybook hierarchy migration will change story IDs and must update visual tests at the same time.
2. Overlay ownership is inconsistent across menus and dialogs.
3. Units are mixed: px, dp, pt, and raw values. Do not mechanically replace them; preserve rendered output unless a PR intentionally changes Material values.
4. Several public APIs expose project extensions. Keep them only when documented as project-specific and verified.

## Recommended next work

### PR 1: foundation token wiring

Small focused implementation before the Buttons pilot:

- add PostCSS `sp` support and the matching base variable;
- wire `MDStateLayer` to system state opacity tokens;
- decide/document dragged state as a project extension or source-backed token;
- isolate/remove `--unknownColor` from public production token API if it is not intentionally public;
- run focused visual checks for state-layer consumers.

### PR 2: Buttons pilot

Scope:

- `MDButton`;
- `MDIconButton`;
- `MDFab`;
- `MDFabContainer` only as project-specific placement infrastructure;
- related Storybook and visual tests.

The pilot must introduce public `--md-comp-*` tokens, block or document invalid combinations, move stories to `Material 3/Components/...`, and keep visual/browser coverage green.
