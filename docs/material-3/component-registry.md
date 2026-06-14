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
- Lists: `MDList`, `MDListItem`, `MDListSelectionItem`, and `MDListContainer` are `partial`.
  Material docs checked: `components/lists/specs.md`, `components/lists/guidelines.md`, `components/lists/accessibility.md`, and `foundations/design-tokens/overview.md`.
  Token status: list surfaces now use Material anatomy token names such as `--md-comp-list-item-label-text-color`, `--md-comp-list-item-supporting-text-color`, `--md-comp-list-item-leading-icon-color`, `--md-comp-list-item-trailing-icon-color`, and `--md-comp-list-item-state-layer-color`, instead of generic content or muted token names.
  Shape status: `MDList` owns `standard` and `segmented` list styles. Standard baseline remains square-edged; segmented expressive owns grouped 16dp outer shape, 2dp inter-item gaps, and first/middle/last rounding in the shared primitive instead of consumer overrides.
  Public API status: `MDList` exposes `listStyle: 'standard' | 'segmented'`, `variant: 'baseline' | 'expressive'`, list semantics via `div[role=list]` by default or `ul` when requested, and controlled list-level selection through `selectionMode` plus `modelValue`. `MDListItem` supports `static`, `single-action`, and `multi-action` modes plus Material anatomy slots `leading`, `overline`, `supportingText`, `trailing`, and `trailingAction`. `single-action` requires either an `@action` listener or an `href`; `multi-action` requires both a primary action and a `#trailingAction` slot.
  Interaction contract status: static rows never imply a row action. Single-action rows render one internal button/link surface. Multi-action rows render one primary action plus an independent trailing action. Repository, local file-system, Google session, and database-property list consumers now select the intended Material list style through `MDList`.
  DOM structure status: within `MDList`, non-selectable lists render list semantics on the container and stable listitem wrappers on each item. Single-action and multi-action rows render internal action elements inside the wrapper, so the final list contract is no longer `button[role=listitem]` or `a[role=listitem]`. Inside a selection list, `MDListItem` renders `role="none"` and suppresses both its primary action surface and any trailing action slot to prevent invalid interactive controls inside a listbox. Selection lists render `role="listbox"` with `role="option"` items, disabled-aware roving tab stops, and selected-state indicators that do not rely on color alone. `MDListSelectionItem` outside a selection list renders `role="presentation"` with no state layer, ripple, pointer cursor, or `tabindex` to avoid orphaned `role="option"` and false interactivity without a listbox parent. Secondary controls remain outside the primary action surface.
  Anatomy implementation status: shared List-family anatomy CSS (`listItemAnatomy.css`) is imported non-scoped by both MDListItem and MDListSelectionItem, eliminating duplicated token definitions, state modifier remaps, layout, and typography.
  Multi-action state-layer status: multi-action rows have a row-level MDStateLayer as a direct child of the root container covering the full item width; primary action covers the full visual row except the trailing action hit target; trailing action has its own independent local state layer; clicking the padding area around the trailing action fires the primary action via `@click.self`.
  Size status: baseline uses 56dp / 72dp / 88dp minimum row heights; expressive uses a 64dp one-line minimum and keeps the 72dp / 88dp multi-line thresholds. Consumers can override the minimum row height through the public `--md-comp-list-item-min-container-height` token.
  CSS unit status: `dp` units remain confined to PostCSS-processed scoped styles. Runtime sizing is passed as px-backed CSS variables where needed.
  Selection support: controlled single-select and multi-select listbox behavior is supported for primitive item values. Shared checkbox or radio selection controls are not yet part of the list primitive; the shared indicator is currently a check icon.
  Storybook status: `Material 3/Components/Lists/MDListItem` documents baseline standard, expressive segmented, interaction states (including full-row multi-action state layer and independent trailing action hover), trailing-action geometry, DOM contract, and selection modes using Material terminology.
  Visual or browser verification status: visual stories cover configurations, state geometry (including multi-action full-row hover and trailing action hover), trailing actions, and selection modes; browser tests cover DOM roles, no nested native actions, segmented wrapper rounding, independent trailing actions, trailing action suppression in selection lists, orphan selection item state layer absence, disabled-aware listbox navigation, selected indicators, and trailing-action 48dp targets.
  Deviations or unsupported features: live Figma node verification was blocked by the current Figma MCP plan limit during this pass, expressive row-height verification should be re-checked against the Design Kit when Figma MCP access is available again, selection rows currently use a shared checkmark indicator instead of Material-specific radio or checkbox controls, and expandable/swipe list variants remain unsupported. Lists remain `partial`.
- Dialogs: shared `Dialog/*` surfaces are `partial`. Verify modal semantics, actions, focus, scroll, adaptive layout, and destructive flows.
- Text fields: `MDTextField` and `MDFieldContainer` are `partial`. Verify labels, supporting/error text, value contract, slots, and states.
- Selection controls: `MDCheckbox`, `MDCheckboxField`, and `MDSelectBase` are `partial`. Verify checkbox/select semantics, keyboard behavior, menu ownership, and accessibility.
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
