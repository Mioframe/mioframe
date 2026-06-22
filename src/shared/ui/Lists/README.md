# Lists

Material 3 / Material 3 Expressive List component family for `src/shared/ui/Lists`.

Mioframe Lists target the current Material 3 Expressive contract. The legacy `baseline` list style is
intentionally unsupported and has been removed from the runtime API.

## Material contract vs Mioframe API extensions

Material 3 Expressive is the source of truth for the **visual/token/anatomy** model: standard and segmented
visual styles, one-line/two-line/three-line list items, anatomy roles (leading/overline/label/supporting
text/trailing), the single-action / multi-action / single-select / multi-select list categories, and the
token names and values documented in the [Token contract](#token-contract) section below. Anything in this
README that maps to a `md.comp.list.*` token or a documented Material anatomy/category name is a Material
parameter, not a Mioframe invention.

The public `MDList` / `MDListItem` / `MDListSelectionItem` API additionally exposes **Mioframe-specific
extensions** and **Vue/HTML/platform controls** that are not Material parameters. A prop existing on these
components does not imply it is part of the Material 3 Expressive contract. The extensions are:

| Prop / value                        | Component                            | Category             | What it actually is                                                                                                                    |
| ----------------------------------- | ------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mode` (item-level)                 | `MDListItem`                         | Mioframe extension   | Action topology (`static` / `single-action` / `multi-action`) declared **per item**, not per list. See justification below.            |
| `mode: 'static'`                    | `MDListItem`                         | Mioframe extension   | A non-interactive presentation row. Material does not name a "static" list mode; this is a Mioframe label for "no action surface."     |
| `selectionMode: 'none'`             | `MDList`                             | Mioframe API control | Disables selection-list behavior/ARIA. It is the absence of selection, not a documented Material selection category.                   |
| `leadingType: 'control'`            | `MDListItem` / `MDListSelectionItem` | Mioframe abstraction | An internal placement hint for where a selection control (checkmark) sits in the leading slot. Not a documented Material leading type. |
| item-level `mode` on selection rows | `MDListSelectionItem`                | N/A (no `mode`)      | `MDListSelectionItem` has no `mode` prop; selection rows are always selectable options owned by the list.                              |
| `tag`, `is`, `containerTag`         | `MDList`, `MDListItem`               | Vue/HTML/platform    | Root/container element tag overrides (e.g. `div` vs `ul`/`li`). Pure Vue/DOM rendering controls.                                       |
| `nativeType`                        | `MDListItem`                         | Vue/HTML/platform    | Native `<button type>` passthrough for single-action rows. HTML semantics, not Material.                                               |
| `href`                              | `MDListItem`                         | Vue/HTML/platform    | Renders the action surface as `<a>` instead of `<button>`. HTML semantics, not Material.                                               |
| `transition`                        | `MDList`                             | Vue/HTML/platform    | Opts the list root into Vue's `TransitionGroup` for row enter/leave animation. A Vue rendering control, not a Material token.          |

Treat the [Token contract](#token-contract), [Private implementation variables](#private-implementation-variables),
and [Internal module map](#internal-module-map) sections as internal implementation details rather than
public Material or styling API: private `--md-private-list-item-*` variables are not consumer-facing tokens,
and the listed `.ts` modules are not part of the public component contract.

### Why `mode` stays on `MDListItem`, not `MDList`

Material describes action/select **categories** at the list level (a list is single-action, multi-action,
single-select, or multi-select as a whole). Mioframe intentionally keeps action mode on `MDListItem` instead,
so a single `MDList` can mix `static`, `single-action`, and `multi-action` rows in the same list to support
mixed product rows and existing consumer scenarios (for example a settings list with informational rows next
to actionable rows). This is a deliberate Mioframe extension over the Material model, not a Material
parameter — see the "supports mixing static, single-action, and multi-action MDListItem rows in one list"
test in [`MDList.test.ts`](./MDList.test.ts) for the contract this enables. Selection behavior itself remains
entirely list-owned through `MDList.selectionMode`; item-level `mode` only controls non-selection action
topology and is mutually exclusive with selection semantics (see "Unsupported combinations" below).

### Unsupported / non-goals

- `baseline` is not implemented. It is not part of the current Material 3 Expressive List contract used by
  this project (legacy/reference-only), not an oversight.
- `MDList` does not implement its own focus indicator system. It integrates with the project's global
  keyboard focus indicator — see [Focus indicator](#focus-indicator) below.
- `MDList` does not implement its own state-layer system. Interaction state layers are rendered through the
  shared MD `StateLayer` pattern used across Material components in this project.
- Private `--md-private-list-item-*` CSS variables are internal implementation details. They are not public
  styling API; consumers outside `src/shared/ui/Lists` must not set or read them (see
  [Private implementation variables](#private-implementation-variables)).

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

Nested selection lists (an `MDList` rendered inside another selection list's item content) are containment-safe: `useListSelectionKeyboard` ignores `event.defaultPrevented`, resolves ownership against this list's own Vue-owned registry only (`resolveOwnSelectionItemTarget` in `listSelectionItemNavigation.ts`), and stops propagation once it handles a roving-focus key, so a bubbled keydown or focusin from a nested list never moves the outer list's focus or tab stops.

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
- Owns: `role="option"`, `aria-selected`, `aria-disabled`, selection indicator (checkmark), click/Enter/Space → `selectItem`
- Does **not** have a trailing action slot (structurally invalid for options).

### MDListContainer

Thin wrapper forwarding all props to `MDList`. Prefer `MDList` directly in new code.

## Supported combinations

| Component                    | Context                                  | Result                                                                                                                                   |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `MDListItem` (static)        | standalone                               | static visual row; no implicit `role` (a standalone item has no parent list to be a member of); an explicit consumer `role` is preserved |
| `MDListItem` (single-action) | standalone                               | root is `button`/`a`; full interactive surface                                                                                           |
| `MDListItem` (multi-action)  | standalone                               | wrapper `div`; internal `button`/`a` primary action + independent trailing action (same as in-list)                                      |
| `MDListItem` (static)        | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; no action surface                                                                                        |
| `MDListItem` (single-action) | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; internal `button`/`a` primary action                                                                     |
| `MDListItem` (multi-action)  | inside `MDList` (no selection)           | `div[role="listitem"]` or `li`; internal primary action + independent trailing action                                                    |
| `MDListSelectionItem`        | inside `MDList` with `selectionMode` set | `div[role="option"]`; selection semantics                                                                                                |

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
- Individual items receive a fill (`surface`) via `--md-comp-list-list-item-container-color`.
- A `2dp` gap between items reveals the parent surface, creating visible separation.
- Items default to `4dp` expressive corners; hover expands to `12dp`; focused, pressed, dragged, and selected states expand to `16dp`.
- First and last segmented rows keep `16dp` exposed outer corners on their action surfaces so the list container shape is represented by the items, not by parent-only clipping.
- Shape belongs to the item's action surface (and root element), not to parent `overflow` clipping.

This matches M3 documentation: _"Use gaps for contained lists. Gaps leverage expressive shape and containment tactics."_

## Token contract

### Token naming policy

Token names in this family follow these rules:

| Prefix                                                        | Meaning                                                                                                                                          | Consumer access                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `--md-comp-list-list-item-*` / `--md-comp-list-*`             | Public component-level tokens. The name is copied verbatim from the documented `md.comp.list.list-item.*` / `md.comp.list.*` Material token path | Consumers may set these to theme the component                        |
| `--md-private-list-item-*`                                    | Private implementation variables used internally across the List family — not documented Material tokens                                         | **Must not** be set by consumers outside `src/shared/ui/Lists`        |
| `--md-sys-color-*`                                            | System-level Material color roles                                                                                                                | Consumed by `--md-comp-*` defaults; do not override at the item level |
| `--md-current-container-color` / `--md-current-content-color` | Project surface-context tokens                                                                                                                   | Set by surface owners (cards, sheets, panes) and inherited down       |

The following generic tokens are **not** part of the public API and are **not** set by this component family:
`--md-container-color`, `--md-content-color`. These were removed to eliminate ambiguous cascade bleed.

Public token names map mechanically from the documented Material path, per [docs/material-3/component-tokens.md](../../../../docs/material-3/component-tokens.md):

```text
md.comp.list.list-item.[state].<element>.<property>
--md-comp-list-list-item-[state]-<element>-<property>
```

The `list-item` path segment is part of the documented token and is preserved, never collapsed into a shorter `list-item-*` form. Tokens that document an `expressive` segment (the variant this family implements) keep that segment in the CSS name too, for example `md.comp.list.list-item.selected.container.expressive.shape` → `--md-comp-list-list-item-selected-container-expressive-shape`.

### Public component tokens

| Token                                                                                                | Material token                                                            | Purpose                                                                                |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `--md-comp-list-list-item-container-color`                                                           | `md.comp.list.list-item.container.color`                                  | Row background; defaults to `transparent` for standard, `surface` for segmented        |
| `--md-comp-list-list-item-container-expressive-shape`                                                | `md.comp.list.list-item.container.expressive.shape`                       | Default expressive row shape; defaults to `4dp`                                        |
| `--md-comp-list-list-item-hovered-container-expressive-shape`                                        | `md.comp.list.list-item.hovered.container.expressive.shape`               | Hover row shape; defaults to `12dp`                                                    |
| `--md-comp-list-list-item-focused-container-expressive-shape`                                        | `md.comp.list.list-item.focused.container.expressive.shape`               | Focus row shape; defaults to `16dp`                                                    |
| `--md-comp-list-list-item-pressed-container-expressive-shape`                                        | `md.comp.list.list-item.pressed.container.expressive.shape`               | Pressed row shape; defaults to `16dp`                                                  |
| `--md-comp-list-list-item-dragged-container-expressive-shape`                                        | `md.comp.list.list-item.dragged.container.expressive.shape`               | Dragged row shape; defaults to `16dp`                                                  |
| `--md-comp-list-list-item-selected-container-expressive-shape`                                       | `md.comp.list.list-item.selected.container.expressive.shape`              | Selected row shape; defaults to `16dp`                                                 |
| `--md-comp-list-list-item-label-text-color`                                                          | `md.comp.list.list-item.label-text.color`                                 | Label text color; defaults to `on-surface`                                             |
| `--md-comp-list-list-item-supporting-text-color`                                                     | `md.comp.list.list-item.supporting-text.color`                            | Supporting text color; defaults to `on-surface-variant`                                |
| `--md-comp-list-list-item-overline-color`                                                            | `md.comp.list.list-item.overline.color`                                   | Overline text color; defaults to `on-surface-variant`                                  |
| `--md-comp-list-list-item-leading-icon-expressive-size`                                              | `md.comp.list.list-item.leading-icon.expressive.size`                     | Leading expressive icon size; defaults to `20dp`                                       |
| `--md-comp-list-list-item-trailing-icon-expressive-size`                                             | `md.comp.list.list-item.trailing-icon.expressive.size`                    | Trailing expressive icon size; defaults to `20dp`                                      |
| `--md-comp-list-list-item-leading-avatar-size`                                                       | `md.comp.list.list-item.leading-avatar.size`                              | Leading avatar size; defaults to `40dp`                                                |
| `--md-comp-list-list-item-leading-avatar-color`                                                      | `md.comp.list.list-item.leading-avatar.color`                             | Leading avatar fill color                                                              |
| `--md-comp-list-list-item-leading-icon-color`                                                        | `md.comp.list.list-item.leading-icon.color`                               | Leading icon color; defaults to `on-surface-variant`                                   |
| `--md-comp-list-list-item-leading-image-height`                                                      | `md.comp.list.list-item.leading-image.height`                             | Leading media image height; defaults to `56dp`                                         |
| `--md-comp-list-list-item-leading-image-width`                                                       | `md.comp.list.list-item.leading-image.width`                              | Leading media image width; defaults to `56dp`                                          |
| `--md-comp-list-list-item-leading-image-expressive-shape`                                            | `md.comp.list.list-item.leading-image.expressive.shape`                   | Leading media image shape; defaults to `8dp`                                           |
| `--md-comp-list-list-item-leading-video-shape`                                                       | `md.comp.list.list-item.leading-video.shape`                              | Leading media video shape; defaults to `8dp`                                           |
| `--md-comp-list-list-item-small-leading-video-height`                                                | `md.comp.list.list-item.small.leading-video.height`                       | Leading media video height; defaults to `56dp`                                         |
| `--md-comp-list-list-item-small-leading-video-width`                                                 | `md.comp.list.list-item.small.leading-video.width`                        | Leading media video width; defaults to `100dp`                                         |
| `--md-comp-list-list-item-trailing-icon-color`                                                       | `md.comp.list.list-item.trailing-icon.color`                              | Trailing icon color; defaults to `on-surface-variant`                                  |
| `--md-comp-list-list-item-trailing-supporting-text-color`                                            | `md.comp.list.list-item.trailing-supporting-text.color`                   | Trailing text color; defaults to `on-surface-variant`                                  |
| `--md-comp-list-list-item-hover-state-layer-opacity`                                                 | `md.comp.list.list-item.hover.state-layer.opacity`                        | Hover state-layer opacity; defaults to Material hover state                            |
| `--md-comp-list-list-item-focus-state-layer-opacity`                                                 | `md.comp.list.list-item.focus.state-layer.opacity`                        | Focus state-layer opacity; defaults to Material focus state                            |
| `--md-comp-list-list-item-pressed-state-layer-opacity`                                               | `md.comp.list.list-item.pressed.state-layer.opacity`                      | Pressed state-layer opacity; defaults to Material pressed state                        |
| `--md-comp-list-list-item-dragged-state-layer-opacity`                                               | `md.comp.list.list-item.dragged.state-layer.opacity`                      | Dragged state-layer opacity; defaults to Material dragged state                        |
| `--md-comp-list-list-item-selected-container-color`                                                  | `md.comp.list.list-item.selected.container.color`                         | Selected row background — defaults to `secondary-container`                            |
| `--md-comp-list-list-item-selected-label-text-color`                                                 | `md.comp.list.list-item.selected.label-text.color`                        | Selected row label color — defaults to `on-secondary-container`                        |
| `--md-comp-list-list-item-selected-supporting-text-color`                                            | `md.comp.list.list-item.selected.supporting-text.color`                   | Selected row supporting text color                                                     |
| `--md-comp-list-list-item-selected-overline-color`                                                   | `md.comp.list.list-item.selected.overline.color`                          | Selected row overline color                                                            |
| `--md-comp-list-list-item-selected-leading-icon-color`                                               | `md.comp.list.list-item.selected.leading-icon.color`                      | Selected row leading icon color                                                        |
| `--md-comp-list-list-item-selected-trailing-icon-color`                                              | `md.comp.list.list-item.selected.trailing-icon.color`                     | Selected row trailing icon color                                                       |
| `--md-comp-list-list-item-selected-trailing-supporting-text-color`                                   | `md.comp.list.list-item.selected.trailing-supporting-text.color`          | Selected row trailing text color                                                       |
| `--md-comp-list-list-item-selected-disabled-container-color`                                         | `md.comp.list.list-item.selected.disabled.container.color` (+ `.opacity`) | Disabled selected container color; defaults to `on-surface` with `0.38` alpha          |
| `--md-comp-list-list-item-disabled-label-text-color`                                                 | `md.comp.list.list-item.disabled.label-text.color`                        | Disabled row label color                                                               |
| `--md-comp-list-list-item-disabled-leading-icon-color`                                               | `md.comp.list.list-item.disabled.leading-icon.color`                      | Disabled row leading icon color                                                        |
| `--md-comp-list-list-item-disabled-supporting-text-color`                                            | `md.comp.list.list-item.disabled.supporting-text.color`                   | Disabled row supporting text color                                                     |
| `--md-comp-list-list-item-disabled-trailing-icon-color`                                              | `md.comp.list.list-item.disabled.trailing-icon.color`                     | Disabled row trailing icon color                                                       |
| `--md-comp-list-list-item-one-line-container-height`                                                 | `md.comp.list.list-item.one-line.container.height`                        | One-line row height; defaults to `56dp`                                                |
| `--md-comp-list-list-item-two-line-container-height`                                                 | `md.comp.list.list-item.two-line.container.height`                        | Two-line row height; defaults to `72dp`                                                |
| `--md-comp-list-list-item-three-line-container-height`                                               | `md.comp.list.list-item.three-line.container.height`                      | Three-line row height; defaults to `88dp`                                              |
| `--md-comp-list-segmented-gap`                                                                       | `md.comp.list.segmented.gap`                                              | Gap between segmented rows; defaults to `0dp` standard, `2dp` segmented                |
| `--md-comp-list-list-item-between-space`                                                             | `md.comp.list.list-item.between-space`                                    | Symmetric inline content padding (edge ↔ leading/trailing content); defaults to `16dp` |
| `--md-comp-list-list-item-top-space`                                                                 | `md.comp.list.list-item.top-space`                                        | Block padding above content; defaults to `10dp`                                        |
| `--md-comp-list-list-item-bottom-space`                                                              | `md.comp.list.list-item.bottom-space`                                     | Block padding below content; defaults to `10dp`                                        |
| `--md-comp-list-list-item-leading-space`                                                             | `md.comp.list.list-item.leading-space`                                    | Gap between leading element and content; defaults to `12dp`                            |
| `--md-comp-list-list-item-trailing-space`                                                            | `md.comp.list.list-item.trailing-space`                                   | Gap between content and trailing element; defaults to `16dp`                           |
| `--md-comp-list-list-item-segmented-container-color`                                                 | `md.comp.list.list-item.segmented.container.color`                        | Segmented row fill color; defaults to `surface`                                        |
| `--md-comp-list-list-item-selected-hover-state-layer-color`                                          | `md.comp.list.list-item.selected.hover.state-layer.color`                 | Selected row hover state-layer color; defaults to `on-surface`                         |
| `--md-comp-list-list-item-selected-focus-state-layer-color`                                          | `md.comp.list.list-item.selected.focus.state-layer.color`                 | Selected row focus state-layer color; defaults to `on-surface`                         |
| `--md-comp-list-list-item-selected-pressed-state-layer-color`                                        | `md.comp.list.list-item.selected.pressed.state-layer.color`               | Selected row pressed state-layer color; defaults to `on-surface`                       |
| `--md-comp-list-list-item-selected-disabled-container-opacity`                                       | `md.comp.list.list-item.selected.disabled.container.opacity`              | Disabled selected container alpha; defaults to `0.38`                                  |
| `--md-comp-list-list-item-disabled-label-text-opacity`                                               | `md.comp.list.list-item.disabled.label-text.opacity`                      | Disabled label text alpha; defaults to `0.38`                                          |
| `--md-comp-list-list-item-disabled-leading-icon-opacity`                                             | `md.comp.list.list-item.disabled.leading-icon.opacity`                    | Disabled leading icon alpha; defaults to `0.38`                                        |
| `--md-comp-list-list-item-disabled-trailing-icon-opacity`                                            | `md.comp.list.list-item.disabled.trailing-icon.opacity`                   | Disabled trailing icon alpha; defaults to `0.38`                                       |
| `--md-comp-list-list-item-disabled-supporting-text-opacity`                                          | `md.comp.list.list-item.disabled.supporting-text.opacity`                 | Disabled supporting text / overline alpha; defaults to `0.38`                          |
| `--md-comp-list-list-item-label-text-font` / `-size` / `-weight` / `-line-height` / `-tracking`      | `md.comp.list.list-item.label-text.*`                                     | Label text typography; defaults to `body-large`                                        |
| `--md-comp-list-list-item-supporting-text-font` / `-size` / `-weight` / `-line-height` / `-tracking` | `md.comp.list.list-item.supporting-text.*`                                | Supporting text typography; defaults to `body-medium`                                  |
| `--md-comp-list-list-item-overline-font` / `-size` / `-weight` / `-line-height` / `-tracking`        | `md.comp.list.list-item.overline.*`                                       | Overline typography; defaults to `label-small`                                         |

There is no documented Material token for a generic leading selection-control size (checkbox/switch slot). `--md-private-list-item-leading-control-size` is a private implementation variable for that geometry, not a public Material token. The resolved per-state interaction state-layer color is wired internally through `--md-private-list-item-state-layer-color`, which reads the selected-state color tokens above when the row is selected, and is mapped into the shared `MDStateLayer` primitive's generic `--md-private-state-layer-color` contract (see [Material token policy](../State/README.md) / `docs/material-3/`).

There is no exposed trailing supporting text slot in the implemented anatomy, so the documented `md.comp.list.list-item.trailing-supporting-text.font` / `.size` / `.weight` / `.line-height` / `.tracking` typography tokens are N/A for the public API (the trailing-supporting-text **color** token is still represented because it is reused by the existing trailing slot color role).

#### Spacing token mapping

`between-space` is one symmetric token applied to both inline-start and inline-end content padding (the gap from the row edge to the leading/trailing content column). `leading-space` and `trailing-space` are the narrower gaps between the leading/trailing element and the content column itself. `top-space`/`bottom-space` are the block padding above/below the content column. This mapping preserves the existing Expressive geometry (`16dp` / `12dp` / `16dp` / `10dp` / `10dp`) while giving each documented token its own public override surface.

### Focus indicator

List composes with the project's global keyboard focus indicator (`useFocusIndicator` /
`md-focus-indicator.css` in `src/shared/ui/State`) instead of implementing its own focus ring.
The List family does not define `--md-comp-list-focus-indicator-*` override tokens — the
global indicator owns focus visual language across the project, and rows opt out of it
individually (via `md-focus-indicator_hidden`) only if a row ever needs a custom focus
treatment, which none currently do.

### Restricted token

| Token                                         | Status                        | Notes                                                               |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `--md-private-list-item-min-container-height` | Internal / compatibility-only | Do not use as a consumer sizing API. List sizing is content-driven. |

### Private implementation variables

| Token                                                         | Default (fallback)                     | Override by | Purpose                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--md-private-list-item-action-shape`                         | 4dp                                    | MDList      | Base shape of action surface (button/a); state modifiers raise it to 12dp or 16dp                                                                                                                                                                                        |
| `--md-private-list-item-container-shape`                      | 4dp                                    | MDList      | Base shape of list item root; state modifiers raise it to 12dp or 16dp                                                                                                                                                                                                   |
| `--md-private-list-item-leading-size`                         | 20dp                                   | MDList      | Leading icon/element size                                                                                                                                                                                                                                                |
| `--md-private-list-item-leading-control-size`                 | 48dp                                   | MDList      | Leading selection-control (checkbox/switch) size; no documented Material List token for this generic control size                                                                                                                                                        |
| `--md-private-list-item-passive-trailing-min-size`            | 28dp                                   | MDList      | Minimum trailing element size                                                                                                                                                                                                                                            |
| `--md-private-list-item-trailing-action-padding-inline-start` | 8dp                                    | MDList      | Start padding before the trailing action hit target                                                                                                                                                                                                                      |
| `--md-private-list-item-trailing-action-min-target-size`      | 48dp                                   | MDList      | Minimum trailing action hit target size                                                                                                                                                                                                                                  |
| `--md-private-list-item-trailing-action-reserved`             | `calc(8dp + 48dp)`                     | MDList      | Width reserved for trailing action hit zone                                                                                                                                                                                                                              |
| `--md-private-list-item-container-color`                      | (unset)                                | MDList      | Item fill color; unset for standard, derives from the public `--md-comp-list-list-item-segmented-container-color` token for segmented; items derive `--md-comp-list-list-item-container-color` from this so that selected-state overrides still win via the public token |
| `--md-private-list-item-resolved-container-height`            | Inline style                           | —           | Computed height for current line count                                                                                                                                                                                                                                   |
| `--md-private-list-item-state-layer-color`                    | (resolved)                             | —           | Resolved interaction state layer color fed into shared `MDStateLayer`; reads the public per-state color tokens (label-text-color normally, the selected-state-layer-color tokens when selected, disabled-label-text-color when disabled)                                 |
| `--md-private-list-item-dragged-container-color`              | `--md-sys-color-tertiary-container`    | MDListItem  | Dragged drag-preview fill; not a public Material component token (none exists in the website token table)                                                                                                                                                                |
| `--md-private-list-item-dragged-content-color`                | `--md-sys-color-on-tertiary-container` | MDListItem  | Dragged drag-preview label/icon/overline/supporting-text color                                                                                                                                                                                                           |
| (none — see `--md-private-list-item-state-layer-color`)       | —                                      | —           | Dragged state-layer color reuses `--md-private-list-item-dragged-content-color` directly via the `--md-private-list-item-state-layer-color` remap below, instead of a dedicated variable or a `--md-content-color` override                                              |
| `--md-private-list-item-dragged-elevation`                    | `--md-sys-elevation-level5`            | MDListItem  | Dragged drag-preview elevation `box-shadow`, applied in `MDListItem.vue`'s scoped style                                                                                                                                                                                  |

The former `--md-private-list-item-content-padding-inline-start`, `-content-padding-inline-end`, `-content-padding-block`, `-leading-space`, `-trailing-space`, and `-segmented-gap` private variables were removed. Their spacing is now owned directly by the public `--md-comp-list-list-item-between-space` / `-top-space` / `-bottom-space` / `-leading-space` / `-trailing-space` and `--md-comp-list-segmented-gap` tokens documented above — there is no private duplicate sitting in front of them.
| `--md-private-list-item-min-container-height` | (unset) | — | Internal/compatibility-only row height override; not a public sizing API |

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

Use `lineCount` only when you need to declare a fixed layout that differs from the auto-resolved value. Do not use `lineCount` or `--md-private-list-item-min-container-height` as arbitrary height-tuning controls.

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
- A standalone `MDListItem` (no parent `MDList`) has no implicit `role`. It is not a member of any list structure, so asserting `role="listitem"` would be misleading ARIA. An explicit consumer-provided `role` is preserved.
- Every `MDListItem` inside a non-selection list renders `div[role="listitem"]` or `li`.
- Every `MDListItem` inside a selection list renders `div[role="none"]` with no action surface and no trailing action (prevents invalid `listbox > listitem`).
- Every `MDListSelectionItem` inside a selection list renders `div[role="option"]`.
- `MDListSelectionItem` outside a selection list renders `div[role="presentation"]` with no interactive affordance.
- Single-action items in list context render the primary action as an internal `button` or `a`. Standalone single-action items use the root element itself as the interactive surface, and their internal anatomy uses phrasing-safe wrappers so the native button DOM remains valid.
- Multi-action items (both standalone and in list context) render one internal primary action plus one independent trailing action region. The primary action is `position: absolute; inset: 0` covering the full row. The trailing action container is `pointer-events: none` on the background padding so that empty trailing space falls through to the primary action; direct slot content restores `pointer-events: auto`.
- No native interactive element may be nested inside another native interactive element.

## Dragged state

`MDListItem` supports a `dragged` visual state, rendered as a filled, elevated drag preview per the Material 3 Expressive Figma Kit (not a transparent row with only a state-layer overlay). The website token table does not expose a `md.comp.list.list-item.dragged.container.color` component token, so the fill/content/state-layer colors are wired as private implementation variables (`--md-private-list-item-dragged-container-color`, `--md-private-list-item-dragged-content-color`, `--md-private-list-item-dragged-elevation`) scoped to `.md-list-item.md-state_dragged` in `listItemAnatomy.css`, mapped to system tokens:

- container fill: `--md-sys-color-tertiary-container`
- content/icon color (label text, leading/trailing icon, overline, supporting text): `--md-sys-color-on-tertiary-container`
- state-layer color: `--md-sys-color-on-tertiary-container`, reused as `--md-private-list-item-state-layer-color`, which flows into the shared `MDStateLayer` primitive's generic `--md-private-state-layer-color` contract like every other list state — `MDStateLayer` never reads a List-specific or `--md-content-color` override for this
- state-layer opacity: the existing Material dragged state-layer opacity (`0.16`)
- elevation: `md.sys.elevation.level5`, applied as `box-shadow` in `MDListItem.vue`'s scoped style

This applies to the standard unselected dragged row. Selected+dragged is not separately designed; the dragged rule has higher CSS specificity than the selected rule and wins, which preserves the pre-existing precedence pattern for dragged shape.

## `listItemAnatomy.css` scope

`listItemAnatomy.css` is a deliberate, narrow exception to the project's general preference for component-scoped Vue styles (see the repository `Styling` policy). It is imported as a non-scoped `<style>` block by both `MDListItem` and `MDListSelectionItem` so that the two components share one implementation of token defaults, state modifier remaps, and element geometry instead of duplicating ~480 lines of identical CSS in each scoped block. Scoped duplication was rejected because it would let the two components' shared anatomy (sizing, typography, state-token remaps) drift independently with no compiler-enforced parity.

This exception is constrained as follows:

- **Internal to `src/shared/ui/Lists`.** The file lives in this directory and is owned exclusively by the List component family. It is not a project-wide or design-system-wide stylesheet.
- **BEM-namespaced selectors only.** Every selector targets `.md-list-item*` or `.md-list-selection-item*`. No bare element, attribute, or generic class selector is permitted — this keeps the non-scoped CSS from leaking onto unrelated DOM even though `<style>` (not `<style scoped>`) is used.
- **No upper-layer or product-specific selectors.** The file must never reference `entities`, `features`, `widgets`, `pages`, or any consumer-specific class, id, or data attribute. Adding a consumer-specific selector here to fix a one-off layout problem is a contract violation — fix `MDListItem`/`MDListSelectionItem` or the consumer's own scoped CSS instead.
- **No consumer imports or targeting.** Code outside `src/shared/ui/Lists` must not `@import` this file, nor write CSS that targets `.md-list-item__*` / `.md-list-selection-item__*` selectors from outside (see the root `Styling` policy on `:deep()` and styling ownership).
- **Private variables stay private.** The `--md-private-list-item-*` custom properties declared here are internal wiring, not public styling API — see [Private implementation variables](#private-implementation-variables). Only the public `--md-comp-list-list-item-*` tokens are consumer-facing.

If a future change needs anatomy that diverges between `MDListItem` and `MDListSelectionItem` for a specific element, prefer scoping that divergent rule in the owning component's own scoped `<style>` block (already done today for dragged state and button/link resets in `MDListItem.vue`) rather than adding a conditional branch inside the shared file.

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
- **Expressive geometry verification**: row heights, segmented gap, item shapes, and selected color roles are aligned to the `material3` MCP List specs snapshot (m3.material.io). Full Figma Design Kit verification has not been completed. This README is a secondary local reference only; the `material3` MCP server remains the source of truth for Material values.
- **Dragged state colors**: see "Dragged state" section above. Confirmed against the Material 3 Expressive Figma Kit (tertiary-container fill, on-tertiary-container content/state-layer, M3 Elevation 5).

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

Confirmed from the `material3` MCP `components/lists/specs` token table (List - Common set):

- `md.comp.list.list-item.disabled.container.expressive.shape` is documented as `4dp` (`md.sys.shape.corner.extra-small`) — the same value as the default/resting shape. Unselected disabled rows therefore keep the default `4dp` shape rather than expanding to a state shape (which only the interactive hover/focused/pressed/dragged states do). The current implementation matches this: the disabled CSS rule in `listItemAnatomy.css` does not remap `--md-private-list-item-action-shape` / `--md-private-list-item-container-shape`, so a disabled row keeps the default shape unless it is also selected.
- No `md.comp.list.list-item.disabled.container.color` (or `.opacity`) token is documented for the unselected disabled state — the token table only documents `md.comp.list.list-item.selected.disabled.container.color` (+ `.opacity`) for the selected+disabled combination, which this implementation already maps (see `--md-comp-list-list-item-selected-disabled-container-color` above). This confirms, rather than leaves ambiguous, the project decision below: unselected disabled standard/segmented rows keep their enabled container color and only dim content (label, icons, supporting text, overline) via the documented `disabled-*-opacity` tokens. This is covered by the Playwright test "MDListItem unselected disabled row keeps its enabled container color, not a darkened overlay" in `tests/e2e/visual/shared-ui/md-list.spec.ts`.

Partial / unverified:

- No List-specific trailing supporting text slot is currently exposed, so the corresponding typography tokens are N/A for the public API
- No List-specific elevation is documented for resting rows; only dragged elevation is applied
- **Spacing/typography/state-layer token table**: the `material3` MCP cache renders the Lists Specs token table as an interactive widget, not literal text, so `md.comp.list.segmented.gap`, `md.comp.list.list-item.between-space`/`top-space`/`bottom-space`/`leading-space`/`trailing-space`, the per-element typography component tokens, `md.comp.list.list-item.segmented.container.color`, the selected hover/focus/pressed state-layer color tokens, and the disabled opacity tokens could not be confirmed as literal strings through MCP or the `m3-docs-cache` fallback. The names and mapping above follow the documented Material naming convention and preserve the pre-existing Expressive geometry/colors exactly (no default value changed), but the exact published token names are an unresolved Material 3 verification risk pending a Design Kit or updated MCP cache check.
