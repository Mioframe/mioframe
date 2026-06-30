# Material 3 component registry

## Principle

The shared UI kit must be tracked as a registry that maps official Material 3 surfaces to project components, Storybook pages, tokens, verification, and deviations.

Do not migrate components only by local inspection. Use the registry to keep the UI kit coherent and to avoid duplicating or partially reimplementing the same Material surface in multiple places.

## Related audit documents

- [Material 3 foundation audit](./foundation-audit.md)
- [Foundation audit details](./foundation-audit-details.md)
- [Component family audit](./component-family-audit.md)
- [Secondary component family audit](./secondary-component-family-audit.md)

## Status values

Use these status values consistently:

- `missing`: no project component exists.
- `partial`: project component exists but is not fully aligned or verified.
- `aligned`: component has docs-backed API, tokens, Storybook, verification, and documented deviations.
- `project-specific`: component is not an official Material component but uses Material foundations.
- `deprecated`: component remains only as a compatibility surface.
- `blocked`: Material guidance is missing, conflicting, or unavailable.

## Registry row fields

Each registry row should record:

- Material surface.
- Project component or components.
- Status.
- Material docs checked.
- Token status.
- Public API status.
- Storybook status.
- Visual or browser verification status.
- Deviations or unsupported features.

## Foundation audit snapshot

Rows below are intentionally conservative. `partial` does not mean Material 3 alignment. It means the project has an implementation surface that still needs source-backed API, token, Storybook, verification, and deviation work before it can be marked `aligned`.

### Primary official surfaces

- Buttons: `MDButton` is `partial`. First pilot. Verify variants, props, target area, `--md-comp-button-*`, Storybook hierarchy, and visual states.
- Icon buttons: `MDIconButton` is `partial`. Include in Buttons pilot. Verify selected/toggle behavior, icon sizing, and toolbar target behavior.
- Floating action buttons: `MDFab` and `MDFabContainer` are `partial`. Include in Buttons pilot. Separate Material FAB behavior from project placement helpers.
- Lists: `MDList`, `MDListItem`, and `MDListSelectionItem` are `partial`.
  Material docs checked: `components/lists/overview.md`, `components/lists/specs.md`, `components/lists/guidelines.md`, `components/lists/accessibility.md`, `foundations/design-tokens/overview.md`, and `foundations/interaction/states/state-layers.md`.
  Surface-context status: Lists use inherited foundation surface-context tokens `--md-current-container-color` and `--md-current-content-color`, which default to `--md-container-color` and `--md-content-color`. Standard lists and default rows stay transparent; segmented lists establish their own grouped surface context only within the list bounds.
  Token status: list surfaces reuse the exact documented Material token path such as `--md-comp-list-list-item-label-text-color`, `--md-comp-list-list-item-supporting-text-color`, `--md-comp-list-list-item-leading-icon-color`, and `--md-comp-list-list-item-trailing-icon-color`; the resolved per-state interaction color is wired through the private `--md-private-list-item-state-layer-color` since Material documents state-layer color per interaction state rather than as one generic token.
  Shape status: `MDList` owns `standard` and `segmented` list styles. Expressive list items use a 4dp default container/action shape, expand to 12dp on hover, and expand to 16dp for focused, pressed, dragged, and selected states. Segmented style adds grouped 16dp outer shape, 2dp inter-item gaps, and first/middle/last rounding. The legacy `baseline` style remains intentionally unsupported in this PR, but it is not the reason one-line rows use 56dp.
  Public API status: `MDList` exposes `listStyle: 'standard' | 'segmented'`, list semantics via `div[role=list]` by default or `ul` when requested, and controlled list-level selection through `selectionMode` plus `modelValue`. There is no public `variant` prop — the current Material / Expressive row geometry is the only supported implementation. `MDListItem` supports `static`, `single-action`, and `multi-action` modes plus Material anatomy slots `leading`, `overline`, `supportingText`, `trailing`, and `trailingAction`. `single-action` requires either an `@action` listener or an `href`; `multi-action` requires both a primary action and a `#trailingAction` slot.
  Interaction contract status: static rows never imply a row action. Single-action rows render one internal button/link surface. Multi-action rows render one primary action plus an independent trailing action. Non-selection `single-action`/`multi-action` rows share an `MDList`-owned keyboard contract: `ArrowDown`/`ArrowUp` move within the same action column, `ArrowLeft`/`ArrowRight` move between a multi-action row's primary and trailing action, and `Home`/`End` move to the first/last enabled row in the current column. `disabled` on a row disables the whole action topology (Option A): the primary action is disabled, the consumer-owned trailing action is made `inert`, and keyboard traversal skips both columns of the disabled row. Repository, local file-system, Google session, and database-property list consumers select the intended Material list style through `MDList`.
  DOM structure status: within `MDList`, non-selectable lists render list semantics on the container and stable listitem wrappers on each item. Single-action and multi-action rows render internal action elements inside the wrapper, so the final list contract is no longer `button[role=listitem]` or `a[role=listitem]`. Inside a selection list, `MDListItem` renders `role="none"` and suppresses both its primary action surface and any trailing action slot to prevent invalid interactive controls inside a listbox. Selection lists render `role="listbox"` with `role="option"` items, disabled-aware roving tab stops, and selected-state indicators that do not rely on color alone. `MDListSelectionItem` outside a selection list renders `role="presentation"` with no state layer, ripple, pointer cursor, or `tabindex` to avoid orphaned `role="option"` and false interactivity without a listbox parent. Secondary controls remain outside the primary action surface.
  Anatomy implementation status: shared List-family anatomy CSS (`listItemAnatomy.css`) is imported non-scoped by both MDListItem and MDListSelectionItem, eliminating duplicated token definitions, state modifier remaps, layout, and typography.
  Multi-action state-layer status: multi-action rows stack the primary action and the trailing action in the same CSS grid cell (`grid-area: 1 / 1`) so the primary action covers the full visual row, with its own `MDStateLayer` inside; the trailing action container is grid-stacked with `pointer-events: none` on the background so empty trailing padding and hover fall through to the primary action hit target; direct slot content (icon button) restores `pointer-events: auto` via a CSS child selector; the trailing slot content keeps its own independent state layer. Browser tests verify primary-area hover activates row state, trailing-target hover removes row state, and empty trailing padding hover falls through to primary action.
  Size status: current Expressive row heights are 56dp / 72dp / 88dp (one/two/three-line). Layout is content-driven by default, and explicit `lineCount` is limited to supported Material one-line, two-line, and three-line cases. `--md-private-list-item-min-container-height` is restricted/internal compatibility-only documentation, not a public sizing API.
  CSS unit status: `dp` units remain confined to PostCSS-processed scoped styles. Runtime sizing is passed as px-backed CSS variables where needed.
  Selection support: controlled single-select and multi-select listbox behavior is supported for primitive item values. The current selection list contract is a vertical listbox: `ArrowDown` and `ArrowUp` move roving focus between enabled options, `Home` and `End` move to the first/last enabled option, and `ArrowLeft`/`ArrowRight` are intentionally not handled as vertical navigation. Shared checkbox or radio selection controls are not yet part of the list primitive; the shared indicator is currently a check icon.
  Storybook status: `Material 3/Components/Lists/MDListItem` documents standard and segmented list styles, interaction states (including full-row multi-action state layer and independent trailing action hover), trailing-action geometry, DOM contract, selection modes, surface-context (standard List transparency on different parent surfaces and through intermediate wrappers), the Repository Explorer documents header regression case, and consumer patterns (Home actions, Google Drive profile row, Settings checkbox row, repository/file rows) using Material terminology. Baseline stories have been removed. `--md-private-list-item-min-container-height` is marked restricted/internal, and sizing guidance explains that `lineCount` is limited to supported one/two/three-line layouts rather than arbitrary height tuning.
  Visual or browser verification status: visual stories cover configurations, state geometry (including multi-action full-row hover via grid-stacked primary-action and independent trailing action hover), trailing actions, selection modes, surface context, wrapper inheritance, the Repository Explorer segmented-header regression, and real consumer patterns; browser tests cover DOM roles, no nested native actions, segmented wrapper rounding, independent trailing actions, trailing-padding-fires-primary geometry (now a hard assertion — no silent skip), primary-area hover state, trailing-target hover removal of row state (now a hard assertion), trailing empty-padding hover falls through to primary action (now a hard assertion), standard-list transparent background, standard-list transparent container, wrapper inheritance, segmented-list grouped surface scoping, Home actions two-line layout enforcement, Settings checkbox row no nested controls, disabled checkbox row no pointer cursor, consumer patterns no nested buttons, trailing action suppression in selection lists, orphan selection item state layer absence, disabled-aware listbox navigation, selected indicators, and trailing-action 48dp targets.
  Deviations or unsupported features: `baseline` is legacy/reference-only and intentionally unsupported; live Figma node verification was blocked by Figma MCP plan limits, expressive row-height verification should be re-checked against the Design Kit when Figma MCP access is available, selection rows currently use a shared checkmark indicator instead of Material-specific radio or checkbox controls, and expandable/swipe list variants remain unsupported. Lists remain `partial`.
- Dialogs: shared `Dialog/*` surfaces are `partial`. Verify modal semantics, actions, focus, scroll, adaptive layout, and destructive flows.
- Text fields: `MDTextField` and `MDFieldContainer` are `partial`. Verify labels, supporting/error text, value contract, slots, and states.
- Selection controls: `MDCheckbox`, `MDCheckboxField`, and `MDSelectBase` are `partial`. Verify checkbox/select semantics, keyboard behavior, menu ownership, and accessibility.
- Switch: `MDSwitch` is `partial`.
  Material docs checked: `components/switch/specs.md`, `components/switch/guidelines.md`, `components/switch/accessibility.md`; token tables from the official Material 3 MCP token graph (2026-06-30).
  Token status: `--md-comp-switch-*` layer implemented — track (width/height/shape/outline, all colors), handle (sizes: 16dp unselected, 20dp interactive, 24dp selected/with-icon, 28dp pressed; all colors and disabled opacities including the shared `--md-comp-switch-disabled-handle-opacity: 0.38`; `--md-comp-switch-disabled-unselected-handle-opacity` uses the shared token; `--md-comp-switch-disabled-selected-handle-opacity: 1` matches official Material token), handle elevation (`--md-sys-elevation-level1/level0`), handle shadow-color (`--md-comp-switch-handle-shadow-color` connected through the elevation foundation's `--md-private-elevation-shadow-color` bridge), focus indicator (`--md-comp-switch-focus-indicator-color/thickness/offset` forwarded to generic `--md-focus-indicator-*` vars consumed by the global focus indicator), icon (16dp size; `primary` selected, `surface-container-highest` unselected; all state colors), state-layer (40dp, all colors and opacities). Icon color is forwarded through `--md-content-color` on `.md-switch__icon` so `MDSymbol` receives the computed color.
  Public API: `selected`, `disabled`, `id`, `ariaLabel`, `ariaLabelledby`, `autofocus`, `tabIndex`, `presentation` props; `selected-icon` and `unselected-icon` slots; `update:selected` and `change` (emits next selected boolean) emits.
  Interaction: focusable `<label role="switch">` handles click/Enter/Space, pointer drag (`pointerdown`/`pointerup`/`pointercancel`; pointer drag uses the Pointer Events pointer capture API and releases capture on pointerup/pointercancel), 48dp target layer, 40dp state-layer on handle. `md-switch_with-current-icon` is applied in both interactive and presentation modes when the current state has an icon. Presentation mode: non-interactive `aria-hidden` div, no input/state-layer/ripple.
  Focus indicator: the global `useFocusIndicator` composable reads generic `--md-focus-indicator-color/thickness/offset` from the focused host and applies them as inline styles on the indicator element; MDSwitch forwards its component tokens to those generic vars on the host element; `data-md-focus-indicator-target` on the handle sets the bounding box source; no Switch-specific branches in `useFocusIndicator`. Browser test added (`FocusIndicatorTarget` story + Playwright test in `shared-ui.spec.ts`) and pending CI confirmation.
  Verification: `MDSwitch.test.ts` covers ARIA, disabled, presentation (including `md-switch_with-current-icon` in both modes), autofocus, click/keyboard (`update:selected` + `change` emits verified), drag/cancel, icon slots, and with-current-icon class toggling; `SettingsSwitchListItem.test.ts` covers the row-owned presentation-switch contract; `tests/e2e/visual/shared-ui.spec.ts` covers visual state galleries, interaction-state galleries, icon states, 48dp target, drag-to-select, drag-to-deselect, and focus indicator handle target geometry (pending CI for baseline update).
  Storybook: `shared/ui/MDSwitch` — default/on/disabled, with-icon variants, labeled example, drag story, focus indicator target story, visual state galleries (checker backdrop), interaction-state galleries (forced-state provider).
  Deviations: focus indicator browser verification pending CI; no other known deviations from official Material 3 token or interaction spec.
- Chips: `MDChipBase` and chip wrappers are `partial`. Verify strict chip type contracts and invalid combinations.
- Menus: `MDMenuBase`, `MDMenuItemBase`, and `MDContextMenuButton` are `partial`. Verify positioning, keyboard, focus, selection, and context-menu extension.
- Bottom sheets: `MDBottomSheet*` surfaces are `partial`. Verify modal/persistent behavior, drag handle, focus, scroll, back behavior, and duplicate `*2` surfaces.
- Cards: `MDCard` is `partial`. Verify variants, clickability, elevation, and content slots.
- Progress indicators: shared progress indicator surfaces are `partial`. Expand beyond the current single progress component token.
- Tooltips: `MDPlainTooltip`, `MDRichTooltip`, and `MDOverlayTooltip` are `partial`. Verify plain/rich contracts, trigger ownership, delay, and overlay containment.
- Dividers: `MDDivider` is `partial`. Verify inset/full-bleed and orientation contracts.
- Snackbars: `MDSnackbar` is `partial`. Verify action, dismiss, timeout, live-region, and queue/portal ownership.

### Mixed or project-specific surfaces

- Navigation bar and rail surfaces are `partial`. Verify official bar/rail mapping and adaptive ownership.
- Navigation path is `project-specific` unless a Material mapping is found.
- `MDAppBar` is `partial`; toolbar containers are `project-specific` unless they map to app bar guidance.
- `MDTable` is `project-specific` until current Material data-table guidance is verified.
- `MDEmptyState` is `project-specific` and should be treated as a product UX surface using Material foundations.
- `MDPane` and `MDSplitLayout` are `project-specific` adaptive layout primitives.
- `MDButtonsBar` is `project-specific` unless mapped through dialogs or buttons.

## Requirements before marking a row aligned

Before any row is marked `aligned`, it must answer:

1. Which official Material surface does this correspond to?
2. Which project component or components implement it?
3. Which Material pages were checked?
4. Which public tokens are supported?
5. Which public props are supported?
6. Which Storybook page documents it?
7. Which visual or browser checks cover it?
8. Which deviations or unsupported official features exist?

## Usage

Before starting a component family conversion:

1. Update or add the registry row.
2. Identify the Material docs to check.
3. Identify existing project components and deprecated aliases.
4. Decide whether the component is official Material-aligned or project-specific.
5. Define the verification target.

A component family is not done until the registry row can be marked `aligned` or its remaining gaps are explicitly documented.
