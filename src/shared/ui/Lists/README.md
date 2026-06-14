# Lists

Material 3 / Material 3 Expressive List component family for `src/shared/ui/Lists`.

Mioframe Lists follow the latest recommended Material 3 / Expressive direction. The legacy `baseline` list style is intentionally unsupported and has been removed from the runtime API.

## Surface context

Lists use the shared inherited surface-context contract:

- `--md-current-container-color`
- `--md-current-content-color`

These default to the existing foundation surface tokens:

- `--md-current-container-color: var(--md-container-color)`
- `--md-current-content-color: var(--md-content-color)`

This keeps surface ownership explicit:

- parent pane/card/section/sheet owns the actual surface by setting `--md-container-color` and `--md-content-color`
- layout-only wrappers may sit between the surface owner and the list without breaking inheritance
- standard `MDList` and default list items stay transparent and inherit the current surface/content context
- segmented `MDList` establishes a new grouped surface context inside its own bounds only
- hover, focus, pressed, and selected feedback are expressed through state layers or selected-state tokens, not by injecting a base background into standard rows

## Components

### MDList

Owns list-level style, semantics, and selection context.

- Props: `listStyle` (`standard` | `segmented`), `selectionMode` (`none` | `single` | `multiple`), `modelValue`, `tag` (`div` | `ul`), `is`, `transition`
- Emits: `update:modelValue`
- Provides: list context to descendant items via `provideMDListContext`
- Owns: `listbox` / `list` container role, roving keyboard focus for selection lists

Selection-list keyboard contract for the current vertical `listbox`:

- `ArrowDown`: move focus to the next enabled option
- `ArrowUp`: move focus to the previous enabled option
- `Home`: move focus to the first enabled option
- `End`: move focus to the last enabled option
- `ArrowLeft` / `ArrowRight`: not handled as vertical listbox navigation

Horizontal listbox behavior is intentionally unsupported until the component exposes explicit orientation support and `aria-orientation`.

There is no public `variant` prop. The current Material / Expressive row geometry is the only supported implementation.

### MDListItem

Owns static, single-action, and multi-action list item anatomy.

- Props: `labelText` (required), `mode` (`static` | `single-action` | `multi-action`), `disabled`, `href`, `nativeType`, `lineCount`, `leadingType`, `overline`, `supportingText`, `containerTag`, `draggable`
- Emits: `action`
- Slots: `leading`, `overline`, `supportingText`, `trailing`, `trailingAction`
- Does **not** own selection semantics or a `value` prop.

`MDListItem` is a stable public component. It may be used **standalone** (without a parent `MDList`) or **inside an `MDList`**. Both usages render correctly without consumer-local CSS compensation:

- Standalone: all baseline anatomy defaults (padding, spacing, leading size) are owned by the item itself and have built-in fallback values.
- Inside `MDList`: the list container provides its own values for the private anatomy variables, which override the item's built-in fallbacks.

Consumers must not add local spacing or padding CSS to compensate for broken `MDListItem` layout. If the item renders incorrectly standalone, it is a bug in the shared UI, not a consumer responsibility.

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
| `--md-current-container-color`                       | Current inherited Material surface container color       |
| `--md-current-content-color`                         | Current inherited Material surface content color         |
| `--md-comp-list-item-container-color`                | Row background; defaults to transparent                  |
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

### Restricted token (do not use for consumer sizing)

| Token                                      | Status                        | Notes                                                                                              |
| ------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `--md-comp-list-item-min-container-height` | Internal / compatibility-only | Compatibility escape hatch for internal implementation. Must not be used as a consumer sizing API. |

Consumers must not use `--md-comp-list-item-min-container-height` to force arbitrary row heights. List sizing is content-driven by default: label-only rows resolve to one line, supporting text resolves to two lines by default, and overline plus supporting text resolves to three lines. The `lineCount` prop exists only for the supported Material one-line, two-line, and three-line layouts. It is not a visual tuning escape hatch.

### Private implementation variables (internal only — must not be used by consumers)

| Token                                                 | Default owner (fallback)                       | Override by | Purpose                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `--md-private-list-item-action-shape`                 | MDListItem anatomy (12dp)                      | MDList      | Shape of action surface (button/a)                                                               |
| `--md-private-list-item-container-shape`              | MDListItem anatomy (12dp)                      | MDList      | Shape of list item root                                                                          |
| `--md-private-list-item-content-padding-inline-start` | MDListItem anatomy (16dp)                      | MDList      | Leading inline padding                                                                           |
| `--md-private-list-item-content-padding-inline-end`   | MDListItem anatomy (16dp)                      | MDList      | Trailing inline padding                                                                          |
| `--md-private-list-item-content-padding-block`        | MDListItem anatomy (10dp)                      | MDList      | Block padding                                                                                    |
| `--md-private-list-item-leading-space`                | MDListItem anatomy (12dp)                      | MDList      | Space between leading content and body                                                           |
| `--md-private-list-item-leading-size`                 | MDListItem anatomy (20dp)                      | MDList      | Leading icon/element size                                                                        |
| `--md-private-list-item-passive-trailing-min-size`    | MDListItem anatomy (28dp)                      | MDList      | Minimum trailing element size                                                                    |
| `--md-private-list-item-trailing-space`               | MDListItem anatomy (16dp)                      | MDList      | Space before trailing content                                                                    |
| `--md-private-list-item-trailing-action-reserved`     | MDListItem anatomy (56dp)                      | MDList      | Width reserved for the trailing action hit zone in multi-action rows (padding-start + min-width) |
| `--md-private-list-item-segmented-gap`                | MDList only (0dp)                              | —           | Gap between segmented items; list-level only, not needed by standalone items                     |
| `--md-private-list-item-resolved-container-height`    | MDListItem, MDListSelectionItem (inline style) | —           | Computed height for current line count                                                           |

The "Default owner (fallback)" column lists the baseline value used when no ancestor `MDList` sets the variable. `MDList` may override any of these by setting the variable on the `.md-list` element, which descendants inherit. `MDList` segmented style overrides `action-shape` and `container-shape` to `0dp`.

Consumers outside `src/shared/ui/Lists` must not reference any `--md-private-list-item-*` variable.

`--md-current-container-color` and `--md-current-content-color` are foundation-level inherited surface-context tokens, not List-private tokens.

## DOM contract

- Non-selectable lists: `div[role="list"]` by default, `ul` when children are guaranteed `li` wrappers.
- Selection lists: always `div[role="listbox"]` — `tag="ul"` is overridden.
- Every `MDListItem` renders a stable outer wrapper: `li` (no role) or `div[role="listitem"]` inside non-selection lists, `div[role="none"]` inside selection lists (prevents invalid `listbox > listitem`).
- Every `MDListSelectionItem` inside a selection list renders as `div[role="option"]`. Outside a selection list it renders as `div[role="presentation"]` to avoid orphaned `role="option"` without a listbox parent. Orphan items also have no state layer, no ripple, no pointer cursor, and no `tabindex`.
- Single-action items render the primary action as an internal `button` or `a` — never as the listitem root. Inside a selection list, `MDListItem` suppresses both the action surface and any trailing action slot to avoid nesting interactive elements inside a listbox.
- Multi-action items render one internal primary action plus one independent trailing action region. The primary action is `position: absolute; inset: 0` covering the full visual row, with its `MDStateLayer` inside. The trailing action container sits on top as a positioned overlay with `pointer-events: none` on the container background so that empty trailing padding (and hover) falls through to the primary action hit target; direct slot content (icon button) restores its own `pointer-events: auto`. The trailing slot content has its own independent state layer. Browser-level tests in `tests/e2e/visual/shared-ui.spec.ts` verify that: primary area hover activates row-level hover state; trailing target hover removes row-level hover state; empty trailing padding hover falls through to primary action.
- No native interactive element may be nested inside another native interactive element.

## Internal module map

| File                             | Responsibility                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listContext.ts`                 | Provide/inject list context; selection state, tag, semantics                                                                                                      |
| `listItemSizing.ts`              | Material row height constants for the current Expressive geometry                                                                                                 |
| `listItemLayout.ts`              | Shared line-count resolution and host-style helpers                                                                                                               |
| `listDevWarnings.ts`             | Development-only warning helpers for MDList semantics and misuse                                                                                                  |
| `listItemAttrs.ts`               | Private attr-routing helper that keeps semantic attrs on root rows unless an internal action surface owns them                                                    |
| `listItemDevWarnings.ts`         | Development-only warning functions for MDListItem misuse                                                                                                          |
| `listItemAnatomy.css`            | Shared List-family CSS: token defaults, state modifier remaps, body/element layout, typography; imported as non-scoped by both MDListItem and MDListSelectionItem |
| `useListItemAnatomy.ts`          | Shared anatomy computeds (slot detection, line count, host style) used by MDListItem and MDListSelectionItem                                                      |
| `listSelectionItemNavigation.ts` | Roving tab-stop and keyboard navigation for listbox selection items                                                                                               |
| `useListSelectionKeyboard.ts`    | Composable that wires keyboard/focus lifecycle into MDList                                                                                                        |

## Row sizing

Current Expressive minimum row heights:

| Line count | Min height |
| ---------- | ---------- |
| 1          | 64dp       |
| 2          | 72dp       |
| 3          | 88dp       |

List item height is content-driven by default. Use `lineCount` only when you need to declare one of the supported Material one-line, two-line, or three-line layouts explicitly. Do not use `lineCount` or `--md-comp-list-item-min-container-height` as arbitrary visual height-tuning controls.

## Supported features

- List styles: `standard`, `segmented`
- Item modes (MDListItem): `static`, `single-action`, `multi-action`
- Selection (MDListSelectionItem): `single` and `multiple` modes, checkmark indicator, roving keyboard focus; renders `role="presentation"` with no state layer, ripple, pointer cursor, or `tabindex` when used outside a selection list
- Anatomy slots: leading icon/avatar/media/control, overline, label, supporting text, trailing text/icon, trailing action (MDListItem only)
- Line counts: one-line, two-line, three-line
- States: enabled, disabled, hover, focus, pressed, dragged (MDListItem), selected (MDListSelectionItem)
- Selection list misuse safety: `MDListItem` inside a selection list renders `role="none"` and suppresses both its primary action surface and any trailing action slot, preventing invalid interactive controls inside a listbox
- Orphan selection item safety: `MDListSelectionItem` without a selection context renders as inert presentation content with no interactive affordance

## Intentionally unsupported

- `baseline` list style: legacy / reference-only, not a current Material recommendation
- Expandable / swipe list variants
- Radio/checkbox controls as selection indicators (checkmark only)
- Project-specific grid layout on MDList/MDListContainer

## Relation to Menu

`MDMenuItem` and `MDMenuItemBase` are separate Material components. They share list-like anatomy but must not depend on private List variables (`--md-private-list-item-*`). Menu geometry is owned by Menu component CSS.

## Material and Figma verification status

Material sources checked: `components/lists/overview`, `guidelines`, `specs`, `accessibility`, and `foundations/interaction/states/state-layers`.

Geometry values (heights, padding, spacing) are based on the Material cache snapshot. Figma live verification is **partial** — exact Expressive geometry has not been fully verified against the Design Kit:

- Expressive one-line height (currently 64dp)
- Exact state-layer shape and bounds for expressive variant
- Leading/trailing spacing values for expressive variant

Lists remain `partial` until Figma geometry verification is complete. Re-verify against the Design Kit when Figma MCP access is available.
