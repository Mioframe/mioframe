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
- Lists: `MDList`, `MDListItem`, and `MDListContainer` are `partial`.
  Material docs checked: `components/lists/specs.md`, `components/lists/guidelines.md`, `components/lists/accessibility.md`, and `foundations/design-tokens/overview.md`.
  Token status: `MDListItem` uses `--md-comp-list-item-*`; `MDListContainer` uses `--md-comp-list-container-shape`. Old non-Material tokens `--md-list-container-border-radius` and `--md-list-item-border-radius` have been migrated to the new component tokens in all consumers.
  Public API status: explicit `static`, `single-action`, `multi-action`, `single-select`, and `multi-select` modes with Material anatomy slot names. `multi-action` requires a real primary action and a `#trailingAction` slot; a dev-mode warning fires when the slot is absent. Static rows with trailing controls use `static` mode with the `trailing` slot. `MDListContainer` and `MDList` expose `layout?: 'column' | 'grid'` as a project-specific layout helper; `type="list"|"grid"` has been removed. Material list styles (`standard`, `segmented`) are not yet exposed as a distinct API variant.
  Interaction contract status: `multi-action` is no longer inferred from the presence of a trailing slot. Consumers (`FSEntryMDListItem`, `DocumentMDListItem`, `DatabaseViewListEdit`, `DatabasePropertyListItem`, `DirectoryContentEntry`, `DatabasePropertyEditList`) have been corrected: static rows with trailing controls use `static` + `trailing` slot; `multi-action` requires both a primary action and a trailing action slot.
  DOM structure status: `MDList` uses `div[role=list]` + `div[role=listitem]` with ARIA semantics; multi-action rows render a `button`/`a` primary-action surface alongside a separate trailing-action surface; secondary controls are not nested inside the primary-action element.
  CSS unit status: `dp` units are used only in PostCSS-processed scoped styles. `MDListContainer` scoped styles use `dp` authoring units for all Material-referenced dimensions.
  Selection support: `selected` prop applies a color-only visual selected state. No non-color indicator exists. List-level selection semantics (`listbox`, `option` roles, roving focus) are not implemented. Selection support is intentionally partial and must not be presented as fully accessible selected state.
  Selection dev-warning: a dev-mode warning fires when `selected=true` is used without a `#selectionControl` slot, because `selected` alone uses color only and does not meet Material accessibility requirements for selected state.
  Storybook status: `Material 3/Components/Lists/MDListItem` documents configurations (including overline), visual states, interaction states, multi-action layout, and selection. All `multi-action` stories include a primary `@action` handler and a `#trailingAction` slot. Story text uses Material-oriented labels; migration-history wording has been removed.
  Visual or browser verification status: `Configurations`, `VisualStates`, `VisualInteractionStates`, and `TrailingActionLayout` stories are tagged `visual`. Interaction states story sets `--md-content-color: var(--md-sys-color-primary)` in the story wrapper so state-layer overlays are visible at Material spec opacities (8%, 10%, 16%) and a Default reference row is included for comparison. Snapshot baselines have been regenerated. Browser-level Playwright assertion verifies trailing action icon buttons expose a `.md-icon-button__target` span of at least 48×48 px.
  Deviations or unsupported features: expressive segmented list styling, list-level selection semantics (listbox/option ARIA, roving keyboard), and shared roving-keyboard handling for multi-action rows are not implemented. Lists remain `partial`.
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
