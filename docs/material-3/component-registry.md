# Material 3 component registry

## Principle

The shared UI kit must be tracked as a registry that maps official Material 3 surfaces to project components, Storybook pages, tokens, verification, and deviations.

Do not migrate components only by local inspection. Use the registry to keep the UI kit coherent and to avoid duplicating or partially reimplementing the same Material surface in multiple places.

## Registry template

Use this table shape for new rows:

| Material surface     | Project component     | Status     | Material docs     | Tokens             | API                | Storybook       | Visual tests    | Deviations    |
| -------------------- | --------------------- | ---------- | ----------------- | ------------------ | ------------------ | --------------- | --------------- | ------------- |
| `<official surface>` | `<project component>` | `<status>` | `<checked pages>` | `<status/details>` | `<status/details>` | `<path/status>` | `<path/status>` | `<none/link>` |

## Status values

Use these status values consistently:

- `missing`: no project component exists;
- `partial`: project component exists but is not fully aligned or verified;
- `aligned`: component has docs-backed API, tokens, Storybook, verification, and documented deviations;
- `project-specific`: component is not an official Material component but uses Material foundations;
- `deprecated`: component remains only as a compatibility surface;
- `blocked`: Material guidance is missing, conflicting, or unavailable.

## Foundation audit snapshot

The current detailed audit lives in [Material 3 foundation audit](./foundation-audit.md).

Rows below are intentionally conservative. `partial` does not mean Material 3 alignment; it means the project has an implementation surface that still needs source-backed API, token, Storybook, verification, and deviation work before it can be marked `aligned`.

| Material surface | Project component | Status | Next check |
| --- | --- | --- | --- |
| Buttons | `MDButton` | `partial` | First pilot. Verify variants, props, target area, `--md-comp-button-*`, Storybook hierarchy, visual states. |
| Icon buttons | `MDIconButton` | `partial` | Include in Buttons pilot. Verify selected/toggle behavior, icon sizing, toolbar target behavior. |
| Floating action buttons | `MDFab`, `MDFabContainer` | `partial` | Include in Buttons pilot. Separate Material FAB behavior from project placement helpers. |
| Lists | `MDList`, `MDListItem`, `MDListContainer` | `partial` | Verify row interaction, trailing actions, density, supporting text, and target area. |
| Dialogs | `Dialog/*` shared UI surfaces | `partial` | Verify modal semantics, actions, focus, scroll, adaptive layout, and destructive flows. |
| Text fields | `MDTextField`, `MDFieldContainer` | `partial` | Verify labels, supporting/error text, value contract, slots, and states. |
| Selection controls | `MDCheckbox`, `MDCheckboxField`, `MDSelectBase` | `partial` | Verify checkbox/select semantics, keyboard behavior, menu ownership, and accessibility. |
| Chips | `MDChipBase` and chip wrappers | `partial` | Verify strict chip type contracts and invalid combinations. |
| Menus | `MDMenuBase`, `MDMenuItemBase`, `MDContextMenuButton` | `partial` | Verify positioning, keyboard, focus, selection, and context-menu extension. |
| Navigation | Navigation bar, rail, and path surfaces | `partial` / `project-specific` | Verify official bar/rail mapping; keep navigation path project-specific unless a Material mapping is found. |
| App bars and toolbars | `MDAppBar`, toolbar containers | `partial` / `project-specific` | Verify app bar mapping; keep toolbar containers project-specific unless they map to a Material surface. |
| Bottom sheets | `MDBottomSheet*` surfaces | `partial` | Verify modal/persistent behavior, drag handle, focus, scroll, back behavior, and duplicate `*2` surfaces. |
| Cards | `MDCard` | `partial` | Verify variants, clickability, elevation, and content slots. |
| Progress indicators | Shared progress indicator surfaces | `partial` | Expand beyond the current single progress component token. |
| Tooltips | `MDPlainTooltip`, `MDRichTooltip`, `MDOverlayTooltip` | `partial` | Verify plain/rich contracts, trigger ownership, delay, and overlay containment. |
| Dividers | `MDDivider` | `partial` | Verify inset/full-bleed and orientation contracts. |
| Snackbars | `MDSnackbar` | `partial` | Verify action, dismiss, timeout, live-region, and queue/portal ownership. |
| Tables | `MDTable` | `project-specific` | Do not claim official alignment until current Material data-table guidance is verified. |
| Empty states | `MDEmptyState` | `project-specific` | Treat as product UX surface using Material foundations. |
| Pane/layout | `MDPane`, `MDSplitLayout` | `project-specific` | Treat as adaptive layout primitives, not official Material components. |
| Buttons bar | `MDButtonsBar` | `project-specific` | Treat as action-layout helper unless mapped through dialogs/buttons. |

## Required fields for aligned rows

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

1. update or add the registry row;
2. identify the Material docs to check;
3. identify existing project components and deprecated aliases;
4. decide whether the component is official Material-aligned or project-specific;
5. define the verification target.

A component family is not done until the registry row can be marked `aligned` or its remaining gaps are explicitly documented.
