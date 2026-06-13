# MDList implementation note

## Material note

- Relevant Material surfaces checked:
  - `components/lists/overview.md`
  - `components/lists/guidelines.md`
  - `components/lists/specs.md`
  - `components/lists/accessibility.md`
  - `foundations/design-tokens/overview.md`
- Relevant project policy checked:
  - `docs/material-3/component-registry.md`
  - `docs/material-3/component-family-audit.md`
  - `docs/material-3/shared-ui-api.md`
  - `docs/material-3/interaction-states.md`
  - `docs/material-3/verification.md`
- Figma nodes used as visual references:
  - `59106:13029` standard list, one-line
  - `59106:13049` standard list, multi-line
  - `59106:13164` segmented filled list, one-line
  - `59106:13069` segmented filled list, multi-line
  - `59106:13183` list item state matrix
  - `51964:63037` baseline one-line reference
- Decision impact:
  - `MDList` owns list style, grouping, shape, spacing, semantics, and list-level selection context.
  - `MDListItem` owns static/single-action/multi-action item anatomy only — no selection semantics.
  - `MDListOption` owns role=option, aria-selected, selection indicator, and selection interaction.
  - Standard and segmented are the supported list styles.
  - List-level single-select and multi-select behavior is supported through controlled `selectionMode` plus `modelValue`.
  - Baseline rows keep 56dp / 72dp / 88dp minimum container heights; expressive rows use a 64dp one-line minimum and keep the 72dp / 88dp multi-line thresholds.
  - Menu surfaces control their own geometry; they no longer override List-private variables.
- Deviation:
  - Live Figma verification for the cited Lists page is currently blocked by the workspace Figma MCP Starter-plan rate limit.
  - Expressive height verification is derived from the current Material cache plus the shared list geometry after Figma MCP inspection was blocked; re-check against the Design Kit when the rate limit resets.
  - Selection rows currently use a shared checkmark indicator instead of Material-specific radio or checkbox controls.
- Verification surface:
  - focused unit tests for DOM structure and invalid combinations
  - Storybook matrix for supported list variants and states
  - Playwright browser/visual coverage for DOM/roles, target sizes, and list state geometry

## Token contract

### Public component tokens (may be set by consumers)

| Token                                                | Component                | Purpose                                           |
| ---------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| `--md-comp-list-item-container-color`                | MDListItem, MDListOption | Row background                                    |
| `--md-comp-list-item-min-container-height`           | MDListItem, MDListOption | Minimum row height override (e.g., menu surfaces) |
| `--md-comp-list-item-label-text-color`               | MDListItem, MDListOption | Label text color                                  |
| `--md-comp-list-item-supporting-text-color`          | MDListItem, MDListOption | Supporting text color                             |
| `--md-comp-list-item-overline-color`                 | MDListItem, MDListOption | Overline text color                               |
| `--md-comp-list-item-leading-icon-color`             | MDListItem, MDListOption | Leading icon and avatar color                     |
| `--md-comp-list-item-trailing-icon-color`            | MDListItem, MDListOption | Trailing icon color                               |
| `--md-comp-list-item-trailing-text-color`            | MDListItem, MDListOption | Trailing text color                               |
| `--md-comp-list-item-state-layer-color`              | MDListItem, MDListOption | Interaction state layer color                     |
| `--md-comp-list-item-selected-container-color`       | MDListOption             | Selected row background                           |
| `--md-comp-list-item-selected-label-text-color`      | MDListOption             | Selected row label color                          |
| `--md-comp-list-item-selected-supporting-text-color` | MDListOption             | Selected row supporting text color                |
| `--md-comp-list-item-selected-trailing-icon-color`   | MDListOption             | Selected row trailing icon color                  |
| `--md-comp-list-item-disabled-label-text-color`      | MDListItem, MDListOption | Disabled row label color                          |
| `--md-comp-list-item-disabled-leading-icon-color`    | MDListItem, MDListOption | Disabled row leading icon color                   |
| `--md-comp-list-item-disabled-supporting-text-color` | MDListItem, MDListOption | Disabled row supporting text color                |
| `--md-comp-list-item-disabled-trailing-icon-color`   | MDListItem, MDListOption | Disabled row trailing icon color                  |

### Private implementation variables (internal only — must not be used by consumers)

| Token                                                 | Set by                                  | Consumed by              | Purpose                                                  |
| ----------------------------------------------------- | --------------------------------------- | ------------------------ | -------------------------------------------------------- |
| `--md-private-list-item-action-shape`                 | MDList                                  | MDListItem               | Shape of action surface (button/a)                       |
| `--md-private-list-item-container-shape`              | MDList                                  | MDListItem, MDListOption | Shape of list item root                                  |
| `--md-private-list-item-content-padding-inline-start` | MDList                                  | MDListItem, MDListOption | Leading inline padding                                   |
| `--md-private-list-item-content-padding-inline-end`   | MDList                                  | MDListItem, MDListOption | Trailing inline padding                                  |
| `--md-private-list-item-content-padding-block`        | MDList                                  | MDListItem, MDListOption | Block padding                                            |
| `--md-private-list-item-leading-space`                | MDList                                  | MDListItem, MDListOption | Space between leading content and body                   |
| `--md-private-list-item-leading-size`                 | MDList                                  | MDListItem, MDListOption | Leading icon/element size                                |
| `--md-private-list-item-passive-trailing-min-size`    | MDList                                  | MDListItem, MDListOption | Minimum trailing element size                            |
| `--md-private-list-item-trailing-space`               | MDList                                  | MDListItem, MDListOption | Space before trailing content                            |
| `--md-private-list-item-segmented-gap`                | MDList                                  | MDList                   | Gap between segmented items                              |
| `--md-private-list-item-resolved-container-height`    | MDListItem, MDListOption (inline style) | MDListItem, MDListOption | Computed container height for current variant+line-count |

Consumers outside `src/shared/ui/Lists` must not reference any `--md-private-list-item-*` variable.

## Owner map

- Source of truth: `src/shared/ui/Lists/*`
- Runtime owner: `MDList` provides style/semantics/selection context; `MDListItem` consumes context for anatomy; `MDListOption` consumes context for option semantics
- User-action owner: consumers own open/select/menu actions; shared UI only structures them
- UI composition owner: `MDList`, `MDListItem`, `MDListOption`
- Error owner: shared UI dev warnings for invalid public combinations
- Retry/navigation owner: unchanged in feature/widget consumers
- Verification owner: list-family unit tests, Storybook, Playwright visual/browser checks, final `pnpm verify`

## Component responsibilities

### MDList

- Provides list-level variant, style, semantics, and selection context
- Owns `listbox` / `list` container role
- Owns `selectionMode`, `modelValue`, roving focus for options

### MDListItem

- Owns static/single-action/multi-action item anatomy
- No selection semantics
- No `value` prop
- No `getCurrentInstance` or vnode introspection
- Warns in dev when used inside a selection list (use MDListOption instead)

### MDListOption

- Required `value: MDListSelectionValue` prop — missing value is a type error, not a runtime fallback
- Owns `role=option`, `aria-selected`, `aria-disabled`, `data-md-list-option`
- Owns selection indicator (checkmark)
- Owns click/Enter/Space → `selectItem` behavior
- No trailing action slot (structurally invalid for options)

## Menu integration

Menu surfaces (`MDMenuBase`, `MDMenuItemBase`) are now independent of List internals.

- `MDMenuItemBase` renders its own button-based row anatomy with inline CSS; it does not import from `../Lists`.
- `MDMenuBase` sets `background: var(--md-sys-color-surface-container)` directly; it does not override `--md-private-list-item-*` variables.
- Menu geometry (height, padding) is owned by `MDMenuItemBase`'s own component CSS.

## Supported in this pass

- List styles:
  - `standard`
  - `segmented`
- Item modes (MDListItem):
  - `static`
  - `single-action`
  - `multi-action`
- Selection (MDListOption):
  - `single` and `multiple` selection modes
  - selection indicator (checkmark)
  - roving keyboard focus
- Anatomy:
  - leading icon
  - leading avatar
  - overline
  - label
  - supporting text
  - trailing text/icon content
  - trailing action (MDListItem only)
- Line counts:
  - one-line
  - two-line
  - three-line
- States:
  - enabled
  - disabled
  - hover
  - focus
  - pressed
  - dragged (MDListItem only)
  - selected (MDListOption only)

## Not supported in this pass

- expandable/swipe list variants
- project-specific grid layout on `MDList`/`MDListContainer`
- radio/checkbox controls for selection rows (checkmark indicator only)
- full Figma verification (blocked by Starter-plan rate limit; re-check when available)

## DOM contract

- Non-selectable lists: `div[role="list"]` by default, `ul` only when children are guaranteed `li` wrappers.
- Every `MDListItem` renders a stable outer wrapper with list-item semantics (`li` or `div[role="listitem"]`).
- Every `MDListOption` renders as `div[role="option"]` (or `li` when the parent is `ul`, but selection lists force `div`).
- Single-action items render the primary action as an internal `button` or `a`, not as the listitem root.
- Multi-action items render one internal primary action plus one independent trailing action region.
- No native interactive element may be nested inside another native interactive element.
- `MDListOption` never renders an inner action surface — it is the interactive surface.

## Acceptance and risk notes

- Acceptance:
  - list style fully controls segmented vs standard geometry
  - consumers stop patching list-item radius directly
  - `ul` usage cannot produce invalid child structure
  - stories only show valid Material configurations
  - `MDListOption` requires `value` by type — missing value is structurally impossible
- Risks:
  - live Figma node verification may remain blocked until the plan limit resets or is upgraded
  - expressive row-height verification should still be re-checked against the Design Kit when Figma MCP access is available again
  - visual snapshots for the selection story changed (now uses `md-list-option` instead of `md-list-item` classes)
