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
- Switch: `MDSwitch` is `partial`, updated implementation.
  Material docs checked: `components/switch/specs.md`, `components/switch/guidelines.md`, and `components/switch/accessibility.md`; token tables fetched from the official Material 3 MCP token graph on 2026-06-30.
  Token status: `MDSwitch` defines the full official `--md-comp-switch-*` layer including: track width/height/shape/outline, all track colors (selected/unselected/hover/focus/pressed/disabled), all handle sizes (unselected 16dp, selected 24dp, with-icon 24dp, generic interactive growth 20dp, pressed 28dp), all handle colors, disabled handle colors and opacities, handle elevation (`md.comp.switch.handle.elevation → --md-sys-elevation-level1`; `md.comp.switch.disabled.handle.elevation → --md-sys-elevation-level0`), all icon size/color tokens for selected/unselected/hover/focus/pressed/disabled states (icon size = 16dp; icon colors = `primary` for selected, `surface-container-highest` for unselected — verified from official token graph, icon colors do not change on interaction states), with-icon handle dimensions (24dp), 40dp state-layer size/shape, and all state-layer colors and opacities. The resolved interaction color is mapped into `MDStateLayer` through the generic `--md-private-state-layer-color` contract. Handle size uses a two-level private-var indirection (`--md-private-switch-rest-handle-*` and `--md-private-switch-interactive-handle-*`) so hover/focus can grow the unselected handle from 16dp to 20dp without conflicting with selected (24dp) or with-icon (24dp) overrides. Pressed always overrides directly to 28dp. Shadow color (`md.comp.switch.handle.shadow-color` → `md.sys.color.shadow`) cannot be expressed as a standalone CSS custom property separate from the elevation box-shadow values — the shadow color is baked into `--md-sys-elevation-level*`. This limitation is documented inline in the component CSS and below under deviations.
  Public API status: `modelValue`, `disabled`, `id`, `ariaLabel`, `ariaLabelledby`, `autofocus`, `tabIndex`, `presentation` props; named slots `selected-icon` and `unselected-icon`; `update:modelValue` and `click` emits. `ariaLabelledby` suppresses `aria-label` when provided, following ARIA labeling precedence. Mirrors `MDCheckbox`'s interactive/presentation dual-root contract.
  Interaction contract status: the focusable host (a `<label>` with `role="switch"`, `aria-checked`, and `aria-disabled`) owns click/Enter/Space activation and intentionally prevents native label-to-input click forwarding, driving the bound `v-model` checkbox purely as a hidden state mirror. Pointer drag is implemented via `pointerdown`/`pointermove`/`pointerup`/`pointercancel` with `setPointerCapture`; a drag exceeding 4px suppresses the subsequent `click` event to prevent double-toggle; the resolved state is determined by the pointer position relative to the track midpoint on `pointerup`. Drag is disabled in presentation mode and when disabled. The interactive host keeps the 52×32 visual track, a 40dp circular state layer centered on the active handle, and an internal 48dp minimum target layer without growing the visual track height. Focus indication is intentionally delegated to the project's global focus-indicator system: `useFocusIndicator` tracks `focusin` on the focusable label host via element bounding rect and renders a fixed-position `md-focus-indicator` ring; the label's `border-radius` is read at focus time so the ring follows the track shape. No local Switch focus ring is added. Presentation mode renders a non-interactive `aria-hidden` div with `md-switch_presentation` modifier, no input, and no state layer/ripple, so row-level consumers (e.g. `SettingsSwitchListItem`) continue to own the action themselves. Icon slots render inside `.md-switch__handle` with `aria-hidden="true"` wrappers; the `md-switch_with-current-icon` root class is applied when the current state renders an icon, driving the with-icon handle size via CSS custom-property cascade.
  Focus indicator integration: the global `useFocusIndicator` composable applies correctly to focused `MDSwitch`. The indicator tracks `focusin` on the `<label>` host and follows the element's bounding rect and border-radius. Material focus-indicator tokens (`md.comp.switch.focus.indicator.color`, `md.comp.switch.focus.indicator.thickness`, `md.comp.switch.focus.indicator.offset`) map to the global system's `--md-sys-color-secondary`, `--md-sys-state-focus-indicator-thickness`, and `--md-sys-state-focus-indicator-outer-offset` tokens — these are the same sys-level tokens the global `md-focus-indicator` class consumes, so no local override is needed.
  Storybook status: `shared/ui/MDSwitch` documents default/on/disabled states, with-icon states (selected/unselected/both/disabled), a labeled example using `aria-labelledby`, drag interaction story, and visual/interaction-state galleries for no-icon and with-icon variants. Visual stories use `visual-checker-backdrop` (a neutral checkerboard alias added to `.storybook/visual.css`). The interaction-state gallery uses `MDStateLayerForcedStateProvider` (from `shared/ui/State/testing`) to force hover/focus/pressed visuals without exposing internal modifier classes as a public API.
  Visual or browser verification status: `MDSwitch.test.ts` covers ARIA role/state/labeling (`aria-label`, `aria-labelledby`), disabled behavior, presentation mode, autofocus, click/keyboard activation, drag suppression of click, icon slot rendering (`selected-icon`/`unselected-icon`), `md-switch_with-current-icon` class toggling, and icon `aria-hidden`; `SettingsSwitchListItem.test.ts` keeps the row-owned presentation-switch contract; `tests/e2e/visual/shared-ui.spec.ts` covers switch state galleries (no-icon), interaction-state galleries (no-icon), icon-state galleries, icon-interaction-state galleries, 48dp target-layer assertion, drag-to-select, and drag-to-deselect browser assertions through Storybook.
  Deviations or unsupported features: `md.comp.switch.handle.shadow-color` (aliases `md.sys.color.shadow`) cannot be represented as a standalone CSS custom property because the project's `--md-sys-elevation-level*` tokens bake shadow color into their box-shadow values and do not expose a separate color variable. Handle elevation is supported through `--md-sys-elevation-level1/level0`; only shadow-color separation is missing. Material focus-indicator tokens are handled by the global focus-indicator system; there is no Switch-specific focus ring. Switch remains `partial` rather than `aligned` because the shadow-color token cannot be fully represented in the current token pipeline.
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
