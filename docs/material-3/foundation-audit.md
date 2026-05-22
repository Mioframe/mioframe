# Material 3 foundation audit

## Scope

This audit starts Phase 2 from [Material 3 adoption plan](./adoption-plan.md). It records the current foundation state before any component-family migration.

This document is intentionally documentation-only. It must not migrate component implementations, rename public props, reorganize shared UI source files, or update visual snapshots.

## Source status

- Project policy sources checked: every policy listed by `.agents/skills/material3-guidelines/SKILL.md` remains the project contract for UI work.
- Repository implementation sources checked: `src/shared/lib/md/tokens.css`, `postcss.config.js`, existing `src/shared/ui/**/MD*.vue` surfaces found through repository search, and representative Storybook files such as `src/shared/ui/Button/MDButton.stories.ts`.
- Official Material 3 MCP status: not available in the current execution environment.
- Fallback cache status: `Vyachean/m3-docs-cache/index.json` is available, captured from `https://m3.material.io` at `2026-05-19T05:56:22.642Z`, with 357 captured pages, 609 attempted pages, and 20 failed pages.
- Fallback cache warning: the cache marks several old or internal routes as suspicious/not-found. Use stable cache paths such as `components/buttons/overview.md`, `components/buttons/guidelines.md`, `components/buttons/specs.md`, and `components/buttons/accessibility.md`, not the failed `google-material-3/pages/...` or `m3/pages/...` routes.

## Confirmed foundation state

### Tokens

`src/shared/lib/md/tokens.css` already contains a single-root Material token bundle with:

- reference palette tokens for primary, secondary, tertiary, error, neutral, and neutral variant colors;
- reference typeface tokens;
- system shape corner tokens;
- light system color role mappings;
- dark system color role overrides under `@media (prefers-color-scheme: dark)`;
- system elevation tokens;
- system typescale tokens;
- system state opacity and focus-indicator tokens;
- system motion duration and easing tokens;
- one component token: `--md-comp-progress-indicator-active-indicator-color`.

Current gaps:

- Component-family tokens are mostly still local implementation variables inside components, for example `MDButton.vue` uses local `--md-button-*` variables instead of canonical public `--md-comp-button-*` tokens.
- `--unknownColor` is a debug fallback and should not be treated as a production token.
- `--md-sys-color-surface-tint-color` is explicitly marked deprecated and should be removed or isolated as a compatibility alias during a focused token cleanup.
- The token bundle is monolithic. The adoption plan already says structural cleanup should happen later, after the foundation audit and pilot prove the pattern.
- Baseline theme has light and dark system color mappings, but the audit has not yet proven full parity against every official Material role.

### Units and typography

`postcss.config.js` currently converts these custom units:

- `step` through `--one-step`;
- `pt` through `--one-pt`;
- `dp` through `--one-dp`.

Confirmed gap:

- `sp` support is not currently present in PostCSS.
- `src/shared/lib/md/tokens.css` still defines Material typescale sizes, tracking, and line heights with `pt`.
- The next typography foundation task should add `sp` conversion first, then migrate Material typography authoring values from `pt` to `sp` without changing rendered output unintentionally.

### State layers

The shared state primitives exist as `src/shared/ui/State/MDStateLayer.vue`, `useStateLayer`, and `useRipple`, and they are already used by `MDButton.vue` for hover, focus, pressed, disabled, and ripple behavior.

Current gaps:

- State layer behavior is not yet documented as the canonical primitive for every interactive `MD*` component family.
- Existing visual stories cover some state surfaces, but the registry must make coverage explicit per component family.
- Dragged and selected states need per-component review rather than assuming a global state-layer mapping.

### Icons

`src/shared/ui/Icon/MDSymbol.vue` exists as the Material Symbol primitive.

Current gaps:

- The audit has not yet verified whether every icon-bearing Material component uses `MDSymbol` directly or accepts icon slots that can preserve Material Symbol sizing.
- The public icon API strategy should be documented per component family: slot-only, symbol-name prop, or project-specific wrapper.

### Overlays

The adoption plan states that overlay ownership already exists through `useOverlayContainer`, `TeleportContainer`, child teleported container registration, and outside-interaction containment. The audit should preserve this model.

Current gaps:

- Overlay component families still need per-surface review: dialogs, menus, tooltips, bottom sheets, select menus, and context menus.
- Any remaining local z-index usage should be inventoried and either justified as local stacking inside an owned overlay or scheduled for replacement through the existing containment model.
- Escape/back stacking and focus-trap behavior should be verified by browser smoke or Playwright checks when a specific overlay family is migrated.

### Storybook

Confirmed state from representative stories:

- `src/shared/ui/Button/MDButton.stories.ts` exists and includes visual stories tagged with `visual` for button states and interaction states.
- Some current Storybook titles still use paths such as `shared/ui/MDButton` rather than the policy target `Material 3/Components/...` or `Project UI/...`.
- Several visual helper stories already exist for buttons, icon buttons, chips, lists, and target-hit areas.

Current gaps:

- Story hierarchy is not yet normalized to look like Material 3 documentation.
- Stories do not consistently record checked Material docs, token status, public API notes, and deviations.
- Legacy playground components still exist and should not be expanded as the primary documentation surface.

### Visual regression

Confirmed state:

- Visual stories are already present for some high-risk UI surfaces.
- The repository policy requires Playwright screenshots through Storybook for visual appearance, not Vue unit tests.

Current gaps:

- The project does not yet have a registry-level map from component family to visual coverage.
- The next visual coverage work should prioritize shared UI primitives, Material state visuals, target hit areas, overlays, and mobile/desktop adaptive surfaces. It should not add screenshots for every component by default.

## Component-family baseline

The expanded registry lives in [Component registry](./component-registry.md). At this audit stage, most components are `partial` because they exist but do not yet have docs-backed API, canonical component tokens, normalized Storybook docs, visual/browser verification, and documented deviations.

The first implementation family should remain Buttons unless a deeper source-backed review contradicts this. Buttons already have a clear implementation surface, Storybook visual states, target-hit stories, and representative Material variants.

## Token inventory plan

Use this classification during component-family conversion:

| Token category | Definition | Current examples | Required action |
| --- | --- | --- | --- |
| Reference token | Material reference palette or typeface value. | `--md-ref-palette-primary40`, `--md-ref-typeface-plain` | Keep under Material vocabulary; verify against official roles. |
| System token | Material system role consumed by many components. | `--md-sys-color-primary`, `--md-sys-shape-corner-large`, `--md-sys-state-hover-state-layer-opacity` | Keep public and stable; fill missing roles only from official docs. |
| Public component token | Canonical component boundary token. | `--md-comp-progress-indicator-active-indicator-color` | Expand per component family using `--md-comp-*`. |
| Private implementation variable | Local component CSS variable with no public contract. | `--md-button-height`, `--md-button-padding` | Either convert to `--md-comp-*` or keep private with non-public naming during family migration. |
| App-specific token | Project/application value outside Material token vocabulary. | `--app-*` target namespace from policy | Move non-Material app values here instead of inventing `--md-*`. |
| Compatibility alias | Temporary alias for old in-repo usage. | `--md-sys-color-surface-tint-color` | Remove when possible; document if temporarily retained. |
| Obsolete/debug token | Not part of production contract. | `--unknownColor` | Remove or isolate from production token API. |
| Unresolved token | Material-looking token without verified source or clear ownership. | Any newly found ad hoc `--md-*` | Block alignment until classified. |

## Typography migration plan

1. Add PostCSS conversion for `sp` through a stable base variable such as `--one-sp`.
2. Define `--one-sp` where the other unit base variables are defined.
3. Convert Material typescale token authoring values from `pt` to `sp` in a focused PR.
4. Verify that rendered typography does not change unless the PR intentionally updates Material values.
5. Keep non-Material text sizing outside Material tokens unless it maps to an official typescale role.

## Baseline theme gap analysis

| Area | Current state | Gap | Follow-up |
| --- | --- | --- | --- |
| Reference palette | Partial palette is present. | Not proven complete against every Material role/tone. | Audit against cache/MCP color role pages. |
| System color | Light and dark mappings exist. | Needs full role parity check and removal of deprecated alias. | Token validation PR. |
| Typography | Typescale tokens exist. | Uses `pt`; no `sp` unit conversion. | `sp` foundation PR before typography migration. |
| Shape | Core corner tokens exist. | Mixed `px`, `dp`, and `cqmin`; needs source-backed review. | Shape token audit. |
| Elevation | Levels 0-5 exist. | Dark-mode overrides are partial; surface tint behavior not fully verified. | Elevation/color validation. |
| Motion | Duration and easing tokens exist. | Token names and component usage need source-backed verification. | Motion token audit during component migration. |
| State | Opacity/focus indicator tokens exist. | Dragged/selected/loading coverage is per-component, not global. | Per-family checklist. |
| Component tokens | Almost absent globally. | Component CSS owns local variables. | Introduce `--md-comp-*` during each family conversion. |

## Overlay review plan

Preserve the existing overlay ownership model by default. For each overlay family, audit:

- the owning rendered DOM hierarchy;
- teleport container ownership;
- outside-interaction containment;
- escape/back stacking;
- focus trap and restoration;
- scroll-container behavior;
- local z-index usage;
- mobile viewport behavior.

Do not introduce a numeric z-index ownership model unless a concrete reviewed gap cannot be solved through existing overlay containment.

## Shared UI API migration list

Initial public API risks to review during component-family conversion:

- Buttons: `color` should be reviewed against Material variant vocabulary; `formAction` hides native `type` semantics and should be reviewed; `type="toggle"`, `shape`, `size`, `selected`, and `loading` need official-doc-backed classification as Material, extension, or project-specific behavior.
- Icon buttons: verify variant, selected/toggle, target area, and icon sizing contracts.
- FAB: verify size, label/extended behavior, placement helpers, and container responsibilities.
- Lists: verify interactive list item contract, trailing action behavior, density, supporting text, leading/trailing content, and target-area rules.
- Dialogs: verify action count, destructive flows, focus behavior, modal semantics, adaptive behavior, and scroll behavior.
- Text fields/select/checkbox: verify value/update contracts, error/supporting text, labels, accessibility, and menu ownership.
- Chips/menus/tooltips/snackbars/navigation/sheets: classify project extensions and missing official variants before public API changes.

Do not keep old shared UI APIs only for internal compatibility. Migrate in-repository consumers in the same focused family PR unless a compatibility alias is technically necessary and documented.

## Storybook coverage plan

Use these target roots:

- `Material 3/Components/<Surface>` for official Material-aligned components;
- `Project UI/<Surface>` for project-specific components that only use Material foundations.

Every aligned component-family story should document:

- official Material pages checked;
- supported variants/configurations;
- public props and slots;
- public component tokens;
- states and accessibility notes;
- unsupported official features;
- project-specific deviations.

Do not expand legacy playgrounds as the primary documentation surface. Convert useful playground examples into deterministic CSF stories.

## Visual regression coverage plan

Prioritize visual screenshots for:

1. Button, icon button, and FAB variants/states/target areas.
2. List item states, density, leading/trailing content, and trailing action combinations.
3. Dialog and sheet responsive layouts, focus surfaces, and scroll boundaries.
4. Text field/select/checkbox states, error/supporting text, and disabled states.
5. Navigation bar/rail/app bar responsive switching and selected states.
6. Chips/menus/tooltips/snackbars only where CSS-heavy states or overlays are likely to regress.

Avoid generic screenshots for every component. Each visual story must prove a high-value Material state, layout, target-area, overlay, or previously broken surface.

## Prioritized conversion order

Keep the adoption-plan order:

1. Buttons pilot: `MDButton`, `MDIconButton`, `MDFab`, `MDFabContainer`, deprecated button compatibility exports.
2. Lists: `MDList`, `MDListItem`, `MDListContainer`.
3. Dialogs and overlays needed by dialogs.
4. Text fields and selection controls: `MDTextField`, `MDFieldContainer`, `MDSelectBase`, `MDCheckbox`, `MDCheckboxField`.
5. Chips and menus: `MDChipBase`, chip wrappers, `MDMenuBase`, `MDMenuItemBase`, context menus.
6. Navigation, app bars, toolbars, and sheets: navigation bar/rail/path, `MDAppBar`, toolbar containers, bottom sheets.
7. Cards, progress indicators, tooltips, dividers, snackbars, tables, empty states, panes, and project-specific surfaces.

## Next implementation PR

The smallest safe next implementation PR is the Buttons pilot.

Before editing Button code, the agent must:

- check `components/buttons/overview.md`, `components/buttons/guidelines.md`, `components/buttons/specs.md`, and `components/buttons/accessibility.md` through Material MCP or `m3-docs-cache` fallback;
- update the Buttons registry row from `partial` toward `aligned`;
- define public `--md-comp-button-*` tokens at the component boundary;
- classify every current public prop and slot;
- document invalid combinations or project-specific extensions;
- normalize Storybook hierarchy and docs;
- keep existing target-hit visual coverage and add only missing high-value visual/browser checks.
