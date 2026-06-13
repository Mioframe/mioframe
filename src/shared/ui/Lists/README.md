# Lists

Material 3 List component family for `src/shared/ui/Lists`.

## Components

### MDList

Owns list-level variant, style, semantics, and selection context.

- Props: `variant` (`baseline` | `expressive`), `listStyle` (`standard` | `segmented`), `selectionMode` (`none` | `single` | `multiple`), `modelValue`, `tag` (`div` | `ul`), `is`, `transition`
- Emits: `update:modelValue`
- Provides: list context to descendant items via `provideMDListContext`
- Owns: `listbox` / `list` container role, roving keyboard focus for selection lists

### MDListItem

Owns static, single-action, and multi-action list item anatomy.

- Props: `labelText` (required), `mode` (`static` | `single-action` | `multi-action`), `disabled`, `href`, `nativeType`, `lineCount`, `leadingType`, `overline`, `supportingText`, `containerTag`, `draggable`
- Emits: `action`
- Slots: `leading`, `overline`, `supportingText`, `trailing`, `trailingAction`
- Does **not** own selection semantics or a `value` prop.

### MDListSelectionItem

Owns selectable list item semantics and selection indicator. Must be used inside an `MDList` with `selectionMode` set.

- Props: `value` (required — `boolean | number | string`), `labelText` (required), `disabled`, `lineCount`, `leadingType`, `overline`, `supportingText`
- Slots: `leading`, `overline`, `supportingText`, `trailing`
- Owns: `role="option"`, `aria-selected`, `aria-disabled`, `data-md-list-selection-item`, selection indicator (checkmark), click/Enter/Space → `selectItem`
- Does **not** have a trailing action slot (structurally invalid for options).

### MDListContainer

Thin wrapper forwarding all props to `MDList`. Prefer `MDList` directly in new code.

## Token contract

### Public component tokens (may be set by consumers)

| Token                                                | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `--md-comp-list-item-container-color`                | Row background                                           |
| `--md-comp-list-item-min-container-height`           | Minimum row height override (e.g. menu surfaces)         |
| `--md-comp-list-item-label-text-color`               | Label text color                                         |
| `--md-comp-list-item-supporting-text-color`          | Supporting text color                                    |
| `--md-comp-list-item-overline-color`                 | Overline text color                                      |
| `--md-comp-list-item-leading-icon-color`             | Leading icon and avatar color                            |
| `--md-comp-list-item-trailing-icon-color`            | Trailing icon color                                      |
| `--md-comp-list-item-trailing-text-color`            | Trailing text color                                      |
| `--md-comp-list-item-state-layer-color`              | Interaction state layer color                            |
| `--md-comp-list-item-selected-container-color`       | Selected row background (MDListSelectionItem)            |
| `--md-comp-list-item-selected-label-text-color`      | Selected row label color (MDListSelectionItem)           |
| `--md-comp-list-item-selected-supporting-text-color` | Selected row supporting text color (MDListSelectionItem) |
| `--md-comp-list-item-selected-trailing-icon-color`   | Selected row trailing icon color (MDListSelectionItem)   |
| `--md-comp-list-item-disabled-label-text-color`      | Disabled row label color                                 |
| `--md-comp-list-item-disabled-leading-icon-color`    | Disabled row leading icon color                          |
| `--md-comp-list-item-disabled-supporting-text-color` | Disabled row supporting text color                       |
| `--md-comp-list-item-disabled-trailing-icon-color`   | Disabled row trailing icon color                         |

### Private implementation variables (internal only — must not be used by consumers)

| Token                                                 | Set by                                         | Purpose                                          |
| ----------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `--md-private-list-item-action-shape`                 | MDList                                         | Shape of action surface (button/a)               |
| `--md-private-list-item-container-shape`              | MDList                                         | Shape of list item root                          |
| `--md-private-list-item-content-padding-inline-start` | MDList                                         | Leading inline padding                           |
| `--md-private-list-item-content-padding-inline-end`   | MDList                                         | Trailing inline padding                          |
| `--md-private-list-item-content-padding-block`        | MDList                                         | Block padding                                    |
| `--md-private-list-item-leading-space`                | MDList                                         | Space between leading content and body           |
| `--md-private-list-item-leading-size`                 | MDList                                         | Leading icon/element size                        |
| `--md-private-list-item-passive-trailing-min-size`    | MDList                                         | Minimum trailing element size                    |
| `--md-private-list-item-trailing-space`               | MDList                                         | Space before trailing content                    |
| `--md-private-list-item-segmented-gap`                | MDList                                         | Gap between segmented items                      |
| `--md-private-list-item-resolved-container-height`    | MDListItem, MDListSelectionItem (inline style) | Computed height for current variant + line count |

Consumers outside `src/shared/ui/Lists` must not reference any `--md-private-list-item-*` variable.

## DOM contract

- Non-selectable lists: `div[role="list"]` by default, `ul` when children are guaranteed `li` wrappers.
- Selection lists: always `div[role="listbox"]` — `tag="ul"` is overridden.
- Every `MDListItem` renders a stable outer wrapper: `li` (no role) or `div[role="listitem"]` inside non-selection lists, `div[role="none"]` inside selection lists (prevents invalid `listbox > listitem`).
- Every `MDListSelectionItem` renders as `div[role="option"]`.
- Single-action items render the primary action as an internal `button` or `a` — never as the listitem root.
- Multi-action items render one internal primary action plus one independent trailing action region.
- No native interactive element may be nested inside another native interactive element.

## Internal module map

| File                             | Responsibility                                                      |
| -------------------------------- | ------------------------------------------------------------------- |
| `listContext.ts`                 | Provide/inject list context; selection state, variant, tag, heights |
| `listItemSizing.ts`              | Material row height constants keyed by variant and line count       |
| `listItemLayout.ts`              | Shared line-count resolution and host-style helpers                 |
| `listItemDevWarnings.ts`         | Development-only warning functions for MDListItem misuse            |
| `listSelectionItemNavigation.ts` | Roving tab-stop and keyboard navigation for listbox selection items |
| `useListSelectionKeyboard.ts`    | Composable that wires keyboard/focus lifecycle into MDList          |

## Supported features

- List styles: `standard`, `segmented`
- Item modes (MDListItem): `static`, `single-action`, `multi-action`
- Selection (MDListSelectionItem): `single` and `multiple` modes, checkmark indicator, roving keyboard focus
- Anatomy slots: leading icon/avatar/media/control, overline, label, supporting text, trailing text/icon, trailing action (MDListItem only)
- Line counts: one-line, two-line, three-line
- States: enabled, disabled, hover, focus, pressed, dragged (MDListItem), selected (MDListSelectionItem)

## Not supported in this pass

- Expandable / swipe list variants
- Radio/checkbox controls as selection indicators (checkmark only)
- Project-specific grid layout on MDList/MDListContainer

## Relation to Menu

`MDMenuItem` and `MDMenuItemBase` are separate Material components. They share list-like anatomy but must not depend on private List variables (`--md-private-list-item-*`). Menu geometry is owned by Menu component CSS.

## Material and Figma verification status

Material sources checked: `components/lists/overview`, `guidelines`, `specs`, `accessibility`.

Geometry values (heights, padding, spacing) are based on the Material cache snapshot as of 2026-06-13. Figma live verification is **partial** — Figma MCP access was rate-limited during this implementation pass. The following remain unverified against the Design Kit:

- Expressive one-line height (currently 64dp — derived from Material cache + shared geometry)
- Exact state-layer shape and bounds for expressive variant
- Leading/trailing spacing values for expressive variant

Re-verify against the Design Kit when Figma MCP access is available. Do not mark Lists as `aligned` until Figma geometry verification is complete.
