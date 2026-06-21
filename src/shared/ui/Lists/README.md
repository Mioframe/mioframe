# Lists

Material 3 / Material 3 Expressive List component family for `src/shared/ui/Lists`.

Mioframe Lists target the current Material 3 Expressive contract. The legacy `baseline` list style is
intentionally unsupported and has been removed from the runtime API.

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

## Supported combinations

| Component                    | Context                                  | Result                                                                                              |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `MDListItem` (static)        | standalone                               | static visual row; `role="listitem"` by default                                                     |
| `MDListItem` (single-action) | standalone                               | root is `button`/`a`; full interactive surface                                                      |
| `MDListItem` (multi-action)  | standalone                               | wrapper `div`; internal `button`/`a` primary action + independent trailing action (same as in-list) |
| `MDListItem` (static)        | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; no action surface                                                   |
| `MDListItem` (single-action) | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; internal `button`/`a` primary action                                |
| `MDListItem` (multi-action)  | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; internal primary action + independent trailing action               |
| `MDListSelectionItem`        | inside `MDList` with `selectionMode` set | `div[role="option"]`; selection semantics                                                           |

## Unsupported combinations

| Combination                                                                    | Behaviour                                                                                                     | Reason                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `MDListItem` inside a **selection list** (`selectionMode` ≠ `none`)            | dev warning fired; `role="none"`; action surface and trailing action suppressed                               | Nesting interactive controls inside a `listbox` is invalid ARIA |
| `MDListSelectionItem` outside a **selection list**                             | dev warning fired; `role="presentation"`; no interactive affordance, no ripple, no state layer, no `tabindex` | `role="option"` without a `listbox` ancestor is invalid ARIA    |
| `MDListSelectionItem` inside a **non-selection list** (`selectionMode="none"`) | dev warning fired; same inert render as above                                                                 | Same ARIA constraint                                            |

## Visual model — standard vs segmented

### Standard

`listStyle="standard"` (default): list has no background. Items are transparent by default, inheriting the parent surface. Visual grouping comes from layout and content density, not from a containing plate.

### Segmented (M3 Expressive)

`listStyle="segmented"`: implements the M3 Expressive filled-items-with-gaps model.

- The **list container has no background**. There is no plate behind the items.
- Individual items receive a fill (`surface`) via `--md-comp-list-item-container-color`.
- A `2dp` gap between items reveals the parent surface, creating visible separation.
- Items default to `4dp` expressive corners; hover expands to `12dp`; focused, pressed, dragged, and selected states expand to `16dp`.
- First and last segmented rows keep `16dp` exposed outer corners on their action surfaces so the list container shape is represented by the items, not by parent-only clipping.
- Shape belongs to the item's action surface (and root element), not to parent `overflow` clipping.

This matches M3 documentation: _"Use gaps for contained lists. Gaps leverage expressive shape and containment tactics."_

## Token contract

### Token naming policy

Token names in this family follow these rules:

| Prefix                                                        | Meaning                                                                 | Consumer access                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `--md-comp-list-item-*`                                       | Public component-level tokens matching Material semantics               | Consumers may set these to theme the component                        |
| `--md-private-list-item-*`                                    | Private implementation variables used internally across the List family | **Must not** be set by consumers outside `src/shared/ui/Lists`        |
| `--md-sys-color-*`                                            | System-level Material color roles                                       | Consumed by `--md-comp-*` defaults; do not override at the item level |
| `--md-current-container-color` / `--md-current-content-color` | Project surface-context tokens                                          | Set by surface owners (cards, sheets, panes) and inherited down       |

The following generic tokens are **not** part of the public API and are **not** set by this component family:
`--md-container-color`, `--md-content-color`. These were removed to eliminate ambiguous cascade bleed.

### Public component tokens

| Token                                                   | Purpose                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `--md-comp-list-item-container-color`                   | Row background; defaults to `transparent` for standard, `surface` for segmented |
| `--md-comp-list-item-container-shape`                   | Default expressive row shape; defaults to `4dp`                                 |
| `--md-comp-list-item-hovered-container-shape`           | Hover row shape; defaults to `12dp`                                             |
| `--md-comp-list-item-focused-container-shape`           | Focus row shape; defaults to `16dp`                                             |
| `--md-comp-list-item-pressed-container-shape`           | Pressed row shape; defaults to `16dp`                                           |
| `--md-comp-list-item-dragged-container-shape`           | Dragged row shape; defaults to `16dp`                                           |
| `--md-comp-list-item-selected-container-shape`          | Selected row shape; defaults to `16dp`                                          |
| `--md-comp-list-item-label-text-color`                  | Label text color; defaults to `on-surface`                                      |
| `--md-comp-list-item-supporting-text-color`             | Supporting text color; defaults to `on-surface-variant`                         |
| `--md-comp-list-item-overline-color`                    | Overline text color; defaults to `on-surface-variant`                           |
| `--md-comp-list-item-leading-icon-size`                 | Leading expressive icon size; defaults to `20dp`                                |
| `--md-comp-list-item-trailing-icon-size`                | Trailing expressive icon size; defaults to `20dp`                               |
| `--md-comp-list-item-leading-avatar-size`               | Leading avatar size; defaults to `40dp`                                         |
| `--md-comp-list-item-leading-icon-color`                | Leading icon and avatar color; defaults to `on-surface-variant`                 |
| `--md-comp-list-item-trailing-icon-color`               | Trailing icon color; defaults to `on-surface-variant`                           |
| `--md-comp-list-item-trailing-text-color`               | Trailing text color; defaults to `on-surface-variant`                           |
| `--md-comp-list-item-state-layer-color`                 | Interaction state layer color                                                   |
| `--md-comp-list-item-hover-state-layer-opacity`         | Hover state-layer opacity; defaults to Material hover state                     |
| `--md-comp-list-item-focus-state-layer-opacity`         | Focus state-layer opacity; defaults to Material focus state                     |
| `--md-comp-list-item-pressed-state-layer-opacity`       | Pressed state-layer opacity; defaults to Material pressed state                 |
| `--md-comp-list-item-dragged-state-layer-opacity`       | Dragged state-layer opacity; defaults to Material dragged state                 |
| `--md-comp-list-item-selected-container-color`          | Selected row background — defaults to `secondary-container`                     |
| `--md-comp-list-item-selected-label-text-color`         | Selected row label color — defaults to `on-secondary-container`                 |
| `--md-comp-list-item-selected-supporting-text-color`    | Selected row supporting text color                                              |
| `--md-comp-list-item-selected-trailing-icon-color`      | Selected row trailing icon color                                                |
| `--md-comp-list-item-disabled-container-color`          | Disabled container color; defaults to `on-surface` with `0.38` alpha            |
| `--md-comp-list-item-selected-disabled-container-color` | Disabled selected container color; defaults to `on-surface` with `0.38` alpha   |
| `--md-comp-list-item-disabled-label-text-color`         | Disabled row label color                                                        |
| `--md-comp-list-item-disabled-leading-icon-color`       | Disabled row leading icon color                                                 |
| `--md-comp-list-item-disabled-supporting-text-color`    | Disabled row supporting text color                                              |
| `--md-comp-list-item-disabled-trailing-icon-color`      | Disabled row trailing icon color                                                |
| `--md-comp-list-focus-indicator-color`                  | Focus indicator color; defaults to `secondary`                                  |
| `--md-comp-list-focus-indicator-thickness`              | Focus indicator thickness; defaults to `3dp`                                    |
| `--md-comp-list-focus-indicator-offset`                 | Focus indicator inner offset; defaults to `-3dp`                                |

### Restricted token

| Token                                      | Status                        | Notes                                                               |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |
| `--md-comp-list-item-min-container-height` | Internal / compatibility-only | Do not use as a consumer sizing API. List sizing is content-driven. |

### Private implementation variables

| Token                                                         | Default (fallback) | Override by | Purpose                                                                                                                                                                                    |
| ------------------------------------------------------------- | ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--md-private-list-item-action-shape`                         | 4dp                | MDList      | Base shape of action surface (button/a); state modifiers raise it to 12dp or 16dp                                                                                                          |
| `--md-private-list-item-container-shape`                      | 4dp                | MDList      | Base shape of list item root; state modifiers raise it to 12dp or 16dp                                                                                                                     |
| `--md-private-list-item-content-padding-inline-start`         | 16dp               | MDList      | Leading inline padding                                                                                                                                                                     |
| `--md-private-list-item-content-padding-inline-end`           | 16dp               | MDList      | Trailing inline padding                                                                                                                                                                    |
| `--md-private-list-item-content-padding-block`                | 10dp               | MDList      | Block padding                                                                                                                                                                              |
| `--md-private-list-item-leading-space`                        | 12dp               | MDList      | Space between leading content and body                                                                                                                                                     |
| `--md-private-list-item-leading-size`                         | 20dp               | MDList      | Leading icon/element size                                                                                                                                                                  |
| `--md-private-list-item-passive-trailing-min-size`            | 28dp               | MDList      | Minimum trailing element size                                                                                                                                                              |
| `--md-private-list-item-trailing-space`                       | 16dp               | MDList      | Space before trailing content                                                                                                                                                              |
| `--md-private-list-item-trailing-action-padding-inline-start` | 8dp                | MDList      | Start padding before the trailing action hit target                                                                                                                                        |
| `--md-private-list-item-trailing-action-min-target-size`      | 48dp               | MDList      | Minimum trailing action hit target size                                                                                                                                                    |
| `--md-private-list-item-trailing-action-reserved`             | `calc(8dp + 48dp)` | MDList      | Width reserved for trailing action hit zone                                                                                                                                                |
| `--md-private-list-item-container-color`                      | (unset)            | MDList      | Item fill color; unset for standard, `surface` for segmented; items derive `--md-comp-list-item-container-color` from this so that selected-state overrides still win via the public token |
| `--md-private-list-item-segmented-gap`                        | 0dp                | —           | Gap between segmented items; list-level only                                                                                                                                               |
| `--md-private-list-item-resolved-container-height`            | Inline style       | —           | Computed height for current line count                                                                                                                                                     |

`MDList` may override any `--md-private-list-item-*` by setting the variable on `.md-list`, which descendants inherit.

Consumers outside `src/shared/ui/Lists` must not reference any `--md-private-list-item-*` variable.

## Line-count contract

`lineCount` declares the **total** number of text rows in the list item layout:

| `lineCount` | Meaning                                                                     | Supporting text clamp |
| ----------- | --------------------------------------------------------------------------- | --------------------- |
| `1`         | Label text only                                                             | —                     |
| `2`         | Label + one line of supporting text                                         | 1 line                |
| `3`         | Label + two lines of supporting text, or overline + label + supporting text | 2 lines               |

The component auto-resolves line count from slot/prop presence when `lineCount` is not set:

- `overline` + `supportingText` → 3
- `supportingText` only → 2
- neither → 1

Use `lineCount` only when you need to declare a fixed layout that differs from the auto-resolved value. Do not use `lineCount` or `--md-comp-list-item-min-container-height` as arbitrary height-tuning controls.

## Row sizing

Current Expressive minimum row heights:

| Line count | Min height |
| ---------- | ---------- |
| 1          | 56dp       |
| 2          | 72dp       |
| 3          | 88dp       |

## DOM contract

- Non-selectable lists: `div[role="list"]` by default, `ul` when children are guaranteed `li` wrappers.
- Selection lists: always `div[role="listbox"]` — `tag="ul"` is overridden with a dev warning.
- Every `MDListItem` inside a non-selection list renders `div[role="listitem"]` or `li`.
- Every `MDListItem` inside a selection list renders `div[role="none"]` with no action surface and no trailing action (prevents invalid `listbox > listitem`).
- Every `MDListSelectionItem` inside a selection list renders `div[role="option"]`.
- `MDListSelectionItem` outside a selection list renders `div[role="presentation"]` with no interactive affordance.
- Single-action items in list context render the primary action as an internal `button` or `a`. Standalone single-action items use the root element itself as the interactive surface, and their internal anatomy uses phrasing-safe wrappers so the native button DOM remains valid.
- Multi-action items (both standalone and in list context) render one internal primary action plus one independent trailing action region. The primary action is `position: absolute; inset: 0` covering the full row. The trailing action container is `pointer-events: none` on the background padding so that empty trailing space falls through to the primary action; direct slot content restores `pointer-events: auto`.
- No native interactive element may be nested inside another native interactive element.

## Dragged state

`MDListItem` supports a `dragged` visual state. The dragged state keeps the normal list content color roles (`on-surface` / `on-surface-variant` for unselected rows, selected roles for selected rows), applies the Material dragged state-layer opacity, and raises the row to `md.sys.elevation.level4` (`8dp` in the current cache).

## `listItemAnatomy.css` scope

`listItemAnatomy.css` is imported as a non-scoped `<style>` block by both `MDListItem` and `MDListSelectionItem` so that the two components share one implementation of token defaults, state modifier remaps, and element geometry instead of duplicating it in each scoped block.

All selectors are BEM-namespaced to `.md-list-item` and `.md-list-selection-item`. They must not be used outside `src/shared/ui/Lists`. This file is **not** a global CSS module for consumers.

## Internal module map

| File                             | Responsibility                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `listContext.ts`                 | Provide/inject list context; selection state, tag, semantics                                                 |
| `listItemSizing.ts`              | Material row height constants for the current Expressive geometry                                            |
| `listItemLayout.ts`              | Shared line-count resolution and host-style helpers                                                          |
| `listDevWarnings.ts`             | Development-only warning helpers for MDList semantics and misuse                                             |
| `listItemAttrs.ts`               | Private attr-routing helper: semantic attrs on root rows unless internal action surface owns them            |
| `listItemDevWarnings.ts`         | Development-only warning functions for MDListItem misuse                                                     |
| `listItemAnatomy.css`            | Shared List-family CSS: token defaults, state modifier remaps, body/element layout, typography               |
| `useListItemAnatomy.ts`          | Shared anatomy computeds (slot detection, line count, host style) used by MDListItem and MDListSelectionItem |
| `listSelectionItemNavigation.ts` | Roving tab-stop and keyboard navigation for listbox selection items                                          |
| `useListSelectionKeyboard.ts`    | Composable that wires keyboard/focus lifecycle into MDList                                                   |

## Intentionally unsupported

- `baseline` list style: legacy / reference-only, not a current Material recommendation
- Expandable / swipe list variants
- Radio/checkbox controls as selection indicators (checkmark only)
- Project-specific grid layout on MDList/MDListContainer

## Relation to Menu

`MDMenuItem` and `MDMenuItemBase` are separate Material components. They share list-like anatomy but must not depend on private List variables (`--md-private-list-item-*`). Menu geometry is owned by Menu component CSS.

## Known limitations

- **Multi-action keyboard traversal**: keyboard traversal between primary and trailing action within one multi-action item is partial. The trailing action is only reachable by Tab; no explicit arrow-key navigation between primary and trailing action is implemented.
- **Expressive geometry verification**: row heights, segmented gap, item shapes, and selected color roles are aligned to the current `m3-docs-cache` list specs snapshot. Full Figma Design Kit verification has not been completed.
- **Dragged state colors**: see "Dragged state" section above; pending Design Kit verification.

## Material verification status

Material sources checked: `components/lists/specs`, `components/lists/guidelines`, `components/lists/accessibility`.

Confirmed from specs:

- Selected color roles: `secondary-container` / `on-secondary-container`
- Segmented style: filled items + gaps; no list-level background plate
- Expressive one-line / two-line / three-line heights: `56dp`, `72dp`, `88dp`
- Expressive item shapes: default `4dp`, hovered `12dp`, focused/pressed/dragged/selected `16dp`
- Segmented item fill color: `surface`
- Standard/segmented are visual choices only; they do not affect behavior
- Focus indicator tokens: color `secondary`, thickness `3dp`, inner offset `-3dp`

Partial / unverified:

- Dragged container color token is not specified separately in the cache; the implementation keeps the default row colors and applies the documented dragged state layer plus elevation
- No List-specific trailing supporting text slot is currently exposed, so the corresponding typography tokens are N/A for the public API
- No List-specific elevation is documented for resting rows; only dragged elevation is applied
