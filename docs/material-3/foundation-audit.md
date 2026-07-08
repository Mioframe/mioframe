# Material 3 foundation audit

## Scope

This audit starts Phase 2 from [Material 3 adoption plan](./adoption-plan.md). It records the current foundation state before any component-family migration.

This document is documentation-only. It must not migrate component implementations, rename public props, reorganize shared UI source files, or update visual snapshots.

Detailed findings are split across related documents:

- [Foundation audit details](./foundation-audit-details.md)
- [Component family audit](./component-family-audit.md)
- [Secondary component family audit](./secondary-component-family-audit.md)
- [Component registry](./component-registry.md)

## Source status

Project sources checked:

- Material 3 project policies listed by `.agents/skills/material3-guidelines/SKILL.md`.
- `src/shared/lib/md/tokens.css`.
- `postcss.config.js`.
- Existing `src/shared/ui/**/MD*.vue` surfaces found through repository search.
- Representative Storybook files such as `src/shared/ui/Button/MDButton.stories.ts`.
- `tests/e2e/visual/shared-ui.spec.ts`.

Material source checked:

- `Vyachean/m3-docs-cache`, captured from `https://m3.material.io` at `2026-05-19T05:56:22.642Z`.
- Component cache pages for Buttons, Icon buttons, FAB, Lists, Dialogs, Text fields, Checkbox, Chips, Menus, Navigation bar, Bottom sheets, Cards, Progress indicators, Tooltips, and Snackbar.

Use stable cache paths under `pages/components/...`. Avoid old failed or suspicious `google-material-3/pages/...` and `m3/pages/...` routes from the cache quality report.

## Confirmed foundation state

### Tokens

`src/shared/lib/md/tokens.css` already contains a single-root Material token bundle with:

- reference palette tokens for primary, secondary, tertiary, error, neutral, and neutral variant colors;
- reference typeface tokens;
- system shape corner tokens;
- light system color role mappings;
- dark system color role overrides under `prefers-color-scheme`;
- system elevation tokens;
- system typescale tokens;
- system state opacity and focus-indicator tokens;
- system motion duration and easing tokens;
- one component token: `--md-comp-progress-indicator-active-indicator-color`.

Current gaps:

- Component-family tokens are mostly still local implementation variables inside components. For example, `MDButton.vue` uses local `--md-button-*` variables instead of canonical public `--md-comp-button-*` tokens.
- Debug fallback color is isolated under the app/debug namespace `--app-debug-unknown-color`, not as a public Material token.
- `--md-sys-color-surface-tint-color` is explicitly marked deprecated and should be removed or isolated as a compatibility alias during focused token cleanup.
- The token bundle is monolithic. Keep it until the audit and pilot prove the next structure.
- Baseline theme has light and dark system color mappings, but full parity with every Material role is not yet validated by tooling.

### Units and typography

`postcss.config.js` currently converts:

- `step` through `--one-step`;
- `pt` through `--one-pt`;
- `sp` through `--one-sp`;
- `dp` through `--one-dp`.

Confirmed state:

- `sp` support is present in PostCSS and in the shared base-unit definition.
- `tokens.css` defines Material typescale sizes, tracking, and line heights with `sp`.
- The current mapping keeps rendered typography stable by defining `--one-sp: 1px` for now.

### State layers

The shared state primitives exist as `MDStateLayer`, `useStateLayer`, and `useRipple`. They are already used by key interactive components.

Current gaps:

- `MDStateLayer` now consumes the declared `--md-sys-state-*-state-layer-opacity` tokens for hover, focus, and pressed.
- Dragged now uses the official system token `--md-sys-state-dragged-state-layer-opacity` (`0.16`), and `MDStateLayer` resolves every state opacity through generic private bridge vars before falling back to the system tokens.
- Selected states still need per-component review rather than a global assumption.
- State-layer behavior should be documented as the canonical primitive for every interactive `MD*` component family.

### Icons

`MDSymbol` exists as the Material Symbol primitive.

Current gaps:

- Not every icon-bearing component has a verified public icon API strategy.
- Each family should decide between slot-only, symbol-name prop, or project-specific wrapper APIs.
- Icon sizes must be checked per family against Material cache pages.

### Overlays

The project already has overlay ownership policy around `useOverlayContainer`, teleport containers, child teleported container registration, and outside-interaction containment.

Current gaps:

- Menus use the shared overlay and teleport model.
- Dialogs currently use a separate native dialog and fixed scrim path.
- Bottom sheets, tooltips, select menus, and context menus still need per-surface overlay review.
- Escape/back stacking, focus trap, scroll locking, and local z-index usage need browser verification when a specific overlay family is migrated.

### Storybook

Current state:

- Representative shared UI stories exist.
- Visual helper stories already exist for buttons, icon buttons, chips, lists, and target-hit areas.
- Some stories still use titles such as `shared/ui/MDButton` rather than `Material 3/Components/...` or `Project UI/...`.

Current gaps:

- Story hierarchy is not yet normalized to look like Material 3 documentation.
- Stories do not consistently record checked Material docs, token status, public API notes, and deviations.
- Legacy playground components should not be expanded as the primary documentation surface.

### Visual regression

Current state:

- Visual tests already cover important state surfaces for Buttons, Icon buttons, FABs, Chips, Checkboxes, List items, and State layers.
- Playwright through Storybook is the correct verification path for visual appearance.

Current gaps:

- Dialogs, text fields, menus, sheets, navigation, cards, tooltips, snackbars, and progress indicators need registry-backed Storybook and visual or browser coverage.
- Visual coverage should stay focused on high-value states, target areas, overlays, and responsive surfaces. It should not become screenshot coverage for every component by default.

## Token inventory plan

Use this classification during component-family conversion:

- Reference tokens: Material reference palette or typeface values, such as `--md-ref-palette-primary40` and `--md-ref-typeface-plain`. Keep under Material vocabulary and verify against official roles.
- System tokens: Material system roles consumed by many components, such as `--md-sys-color-primary`, `--md-sys-shape-corner-large`, and `--md-sys-state-hover-state-layer-opacity`. Keep public and stable.
- Public component tokens: component boundary tokens such as `--md-comp-progress-indicator-active-indicator-color`. Expand per component family using `--md-comp-*`.
- Private implementation variables: local component variables such as `--md-button-height` and `--md-button-padding`. Convert to `--md-comp-*` only when they are part of the public component contract.
- App-specific tokens: project values outside Material vocabulary. Move them to `--app-*` instead of inventing new `--md-*` tokens.
- Compatibility aliases: temporary aliases for old in-repo usage, such as `--md-sys-color-surface-tint-color`. Remove when possible and document if temporarily retained.
- Obsolete or debug tokens: values such as old `--unknownColor`. Remove or isolate from production token API.
- Unresolved tokens: Material-looking variables without verified source or clear ownership. Block alignment until classified.

## Typography migration result

1. PostCSS conversion for `sp` is wired through `--one-sp`.
2. `--one-sp` is defined with the other shared base-unit variables.
3. Material typescale token authoring values use `sp`, not `pt`.
4. Rendered typography remains intentionally unchanged in this foundation pass because `--one-sp` currently maps to `1px`.
5. Non-Material text sizing should still stay outside Material tokens unless it maps to an official typescale role.

## Baseline theme gap analysis

- Reference palette: partial palette is present, but completeness across every role and tone is not validated.
- System color: light and dark mappings exist; full role parity and deprecated alias removal need a token validation PR.
- Typography: typescale tokens now use `sp`; future work can focus on source validation and any intentional scaling policy rather than unit migration.
- Shape: core corner tokens exist, but mixed `px`, `dp`, and `cqmin` values need source-backed review.
- Elevation: levels 0-5 exist, but dark-mode overrides and surface tint behavior need validation.
- Motion: duration and easing tokens exist, but names and component usage need verification during component migration.
- State: opacity and focus-indicator tokens exist, but dragged, selected, and loading coverage is per-component rather than global.
- Component tokens: component CSS still owns most local variables. Introduce `--md-comp-*` during each family conversion.

## Shared UI API migration list

Initial public API risks to review during component-family conversion:

- Buttons: review `color`, `formAction`, `type`, `shape`, `size`, `selected`, and `loading` against Material vocabulary and project extensions.
- Icon buttons: verify variant, selected/toggle, target area, width, shape, tooltip, and icon sizing contracts.
- FAB: verify size, color naming, placement helpers, loading, and container responsibilities.
- Lists: verify interactive list item contract, trailing action behavior, density, supporting text, leading/trailing content, and target-area rules.
- Dialogs: verify action count, destructive flows, focus behavior, modal semantics, adaptive behavior, and scroll behavior.
- Text fields and selection controls: verify value/update contracts, error/supporting text, labels, accessibility, and menu ownership.
- Chips, menus, tooltips, snackbars, navigation, and sheets: classify project extensions and missing official variants before public API changes.

Do not keep old shared UI APIs only for internal compatibility. Migrate in-repository consumers in the same focused family PR unless a compatibility alias is technically necessary and documented.

## Storybook coverage plan

Use these target roots:

- `Material 3/Components/<Surface>` for official Material-aligned components.
- `Project UI/<Surface>` for project-specific components that only use Material foundations.

Every aligned component-family story should document:

- official Material pages checked;
- supported variants and configurations;
- public props and slots;
- public component tokens;
- states and accessibility notes;
- unsupported official features;
- project-specific deviations.

Do not expand legacy playgrounds as the primary documentation surface. Convert useful playground examples into deterministic CSF stories.

## Visual regression coverage plan

Prioritize visual screenshots for:

1. Button, icon button, and FAB variants, states, and target areas.
2. List item states, density, leading/trailing content, and trailing action combinations.
3. Dialog and sheet responsive layouts, focus surfaces, and scroll boundaries.
4. Text field, select, and checkbox states, error/supporting text, and disabled states.
5. Navigation bar, rail, and app bar responsive switching and selected states.
6. Chips, menus, tooltips, and snackbars only where CSS-heavy states or overlays are likely to regress.

Avoid generic screenshots for every component. Each visual story must prove a high-value Material state, layout, target-area, overlay, or previously broken surface.

## Prioritized conversion order

Keep the adoption-plan order:

1. Buttons pilot: `MDButton`, `MDIconButton`, `MDFab`, `MDFabContainer`, and deprecated button compatibility exports.
2. Lists: `MDList` and `MDListItem`.
3. Dialogs and overlays needed by dialogs.
4. Text fields and selection controls: `MDTextField`, `MDFieldContainer`, `MDSelectBase`, `MDCheckbox`, and `MDCheckboxField`.
5. Chips and menus: `MDChipBase`, chip wrappers, `MDMenuBase`, `MDMenuItemBase`, and context menus.
6. Navigation, app bars, toolbars, and sheets.
7. Cards, progress indicators, tooltips, dividers, snackbars, tables, empty states, panes, and project-specific surfaces.

## Next implementation PR

The smallest safe next implementation PR is foundation token wiring, followed by the Buttons pilot.

Foundation token wiring should:

- preserve the current `sp`/state-layer/debug-token foundation;
- keep dragged documented as a private extension until a shared official token name is verified in the Material source;
- avoid reintroducing public debug Material tokens;
- run focused visual checks for state-layer consumers when the foundation changes again.

Buttons pilot should:

- check the relevant Material cache pages;
- update the Buttons registry row from `partial` toward `aligned`;
- define public `--md-comp-button-*`, `--md-comp-icon-button-*`, and `--md-comp-fab-*` tokens;
- classify every current public prop and slot;
- document invalid combinations or project-specific extensions;
- normalize Storybook hierarchy and docs;
- keep existing target-hit visual coverage and add only missing high-value visual or browser checks.
