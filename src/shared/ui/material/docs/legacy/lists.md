# Lists

Legacy Material List family currently owned by `src/shared/ui/Lists`.

This family remains a supported production owner until a focused end-to-end migration moves it to `src/shared/ui/material/components/list`. It is not a template for new Material ownership.

Canonical library rules:

- [`../material/docs/architecture.md`](../material/docs/architecture.md)
- [`../material/docs/sources.md`](../material/docs/sources.md)
- [`../material/docs/component-development.md`](../material/docs/component-development.md)

## Public components

The public entry point exports:

- `MDList`;
- `MDListItem`;
- `MDListSelectionItem`.

Shared List-family CSS is loaded once by `index.ts`.

## `MDList`

Props:

- `listStyle?: 'standard' | 'segmented'`, default `standard`;
- `selectionMode?: 'none' | 'single' | 'multiple'`, default `none`;
- `modelValue?: boolean | number | string | readonly (boolean | number | string)[]`;
- `tag?: 'div' | 'ul'`, default `div`.

Emits:

- `update:modelValue`.

Semantics:

- non-selection `div` renders `role="list"`;
- non-selection `ul` uses native list semantics and gives descendants `li` wrappers;
- selection modes always render a `div[role="listbox"]` and ignore `tag="ul"` with a development warning;
- multiple selection sets `aria-multiselectable="true"`;
- a selection list requires `aria-label` or `aria-labelledby`.

`MDList` owns list-level selection state, item registration, and keyboard navigation.

## `MDListItem`

Props:

- `labelText: string`;
- `mode?: 'static' | 'single-action' | 'multi-action'`, default `static`;
- `disabled?: boolean`;
- `href?: string`;
- `nativeType?: 'button' | 'submit' | 'reset'`, default `button`;
- `containerTag?: 'div' | 'li'`, default `div`;
- `lineCount?: 1 | 2 | 3`;
- `leadingType?: 'icon' | 'avatar' | 'media' | 'control'`, default `icon`;
- `overline?: string`;
- `supportingText?: string`;
- `draggable?: boolean`;
- `dragged?: boolean`.

Emits:

- `action` with the native `MouseEvent`.

Slots:

- `leading`;
- `overline`;
- `supportingText`;
- `trailing`;
- `trailingAction`.

Exposed methods:

- `focusPrimaryAction()`;
- `getPrimaryActionElement(): HTMLElement | null`.

### Action topology

`static` renders no action surface.

A standalone `single-action` item uses its root native `button` or `a` as the complete interactive surface.

An in-list `single-action` item renders a semantic list-item wrapper with one internal native primary action.

A `multi-action` item renders one full-row native primary action and one independent trailing action region. The trailing slot must contain its own interactive control. Empty trailing padding falls through to the primary action rather than becoming a dead zone.

Native activation is preserved. The component does not synthesize keyboard clicks for buttons or links.

### Disabled behavior

`disabled` disables the whole action topology:

- native buttons receive `disabled`;
- links become inert through `aria-disabled="true"` and `tabindex="-1"` and do not navigate;
- the trailing action region becomes `inert`;
- list keyboard navigation skips both primary and trailing targets.

A static disabled row only receives disabled presentation.

### List context

Inside a non-selection `MDList`, the item renders `li` or `role="listitem"` according to the container.

Inside a selection list, `MDListItem` renders `role="none"` and suppresses primary and trailing actions. Interactive rows inside `listbox` are intentionally unsupported; use `MDListSelectionItem`.

A standalone static item receives no implicit `role="listitem"`. An explicit consumer role is preserved.

## `MDListSelectionItem`

Props:

- `value: boolean | number | string`;
- `labelText: string`;
- `disabled?: boolean`;
- `lineCount?: 1 | 2 | 3`;
- `leadingType?: 'icon' | 'avatar' | 'media' | 'control'`;
- `overline?: string`;
- `supportingText?: string`.

Slots:

- `leading`;
- `overline`;
- `supportingText`;
- `trailing`.

Inside a selection list it owns:

- `role="option"`;
- `aria-selected` and `aria-disabled`;
- click, `Enter`, and `Space` selection intent;
- the selected check indicator;
- state layer and ripple;
- registration for roving focus.

Outside an active selection list it renders `role="presentation"`, has no state layer or ripple, and emits a development warning. It has no trailing-action slot because nested interactive controls are invalid for this option contract.

## Keyboard behavior

Selection lists:

- `ArrowDown` / `ArrowUp`: next or previous enabled option;
- `Home` / `End`: first or last enabled option;
- `Enter` / `Space`: select the focused option;
- horizontal arrow navigation is unsupported until explicit orientation support exists.

Non-selection action lists:

- `ArrowDown` / `ArrowUp`: next or previous enabled row in the same action column;
- `ArrowLeft` / `ArrowRight`: move between primary and trailing actions in a multi-action row;
- `Home` / `End`: first or last enabled row in the current action column;
- native `Enter` and `Space` behavior activates the focused button or link.

Nested selection lists keep navigation scoped to their own Vue-owned registry.

## Anatomy and sizing

`lineCount` represents the total text rows:

- `1`: label only;
- `2`: label plus one supporting line;
- `3`: label plus two supporting lines, or overline plus label and supporting text.

When omitted, line count resolves from supplied overline and supporting content.

Current minimum heights are `56dp`, `72dp`, and `88dp` for one-, two-, and three-line items.

Consumers must not add local padding or spacing to compensate for broken standalone layout. The family owns its anatomy.

## Visual styles

`standard` has no list plate and keeps ordinary rows transparent.

`segmented` uses filled item surfaces separated by a `2dp` gap. Items own their shapes; the list uses clipping only for visual containment, not as a scroll container.

Current expressive shapes:

- resting: `4dp`;
- hover: `12dp`;
- focused, pressed, dragged, and selected: `16dp`;
- segmented outer group corners: `16dp`.

## Dragged state

`dragged?: boolean` is the only externally controllable interaction-state prop. Reorder consumers pass the canonical dragged fact through this prop; they must not control internal state classes.

Native `dragstart`, `dragend`, and `drop` also update local dragged presentation for unmanaged native drag usage.

Current dragged contract follows the documented List token surface:

- elevation: `md.sys.elevation.level4`;
- shape: `16dp`;
- label and state-layer color: `on-surface`;
- leading and trailing icon color: `on-surface-variant`;
- state-layer opacity: `0.16`;
- no dragged container-color token; the resting container color remains.

Selected-plus-dragged has no separately supported route in this legacy contract.

## Tokens and styling API

Public Material token namespaces are:

- `--md-comp-list-*` and `--md-comp-list-list-item-*` for exact List component tokens;
- `--md-sys-*` for system roles.

Official component paths map mechanically to CSS names without shortening path segments. Token declaration, configuration selection, state resolution, and final rendering remain separate responsibilities, following [`../material/docs/component-development.md`](../material/docs/component-development.md).

`--md-private-list-item-*`, internal classes, generic foundation bridges, and module names are private implementation details. Consumers must not set or query them.

The family composes the existing generic state-layer, ripple, focus, elevation, typography, and icon owners. Those foundations do not read List-specific tokens.

`listItemAnatomy.css` is a family-local non-scoped stylesheet loaded by the public entry point. Every selector remains List-family BEM-namespaced; product selectors and external imports are forbidden.

## Unsupported surface

- baseline List style;
- horizontal listbox orientation;
- expandable and swipe list variants;
- radio or checkbox selection indicators;
- trailing interactive controls inside selection options;
- arbitrary consumer row-height tuning;
- project-specific grid layout;
- selected-plus-dragged token route.

## Source status

The current implementation was based on Material List overview/specification/guideline/accessibility evidence and literal List token tables available through the project Material source workflow.

Exact source pages and unresolved visual evidence must be revalidated when this family enters canonical migration. Existing rendering, this legacy README, and visual baselines are not Material authority.
