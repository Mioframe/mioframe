# Material 3 component family audit

This file records component-family findings from the current implementation and Material 3 cache. It complements [Material 3 foundation audit](./foundation-audit.md) and [Foundation audit details](./foundation-audit-details.md).

## Buttons: `MDButton`

Material cache confirms default/toggle variants, elevated/filled/tonal/outlined/text color configurations, five sizes, round/square shapes, 16dp recommended small padding, no text toggle button, 48x48dp target area for extra-small/small buttons, and 20dp standard icons.

Current state:

- strong match for M3 Expressive variants: color, type, size, shape, selected state, shape morph, optional icon, loading, and 48dp target layers exist;
- uses `MDStateLayer`, ripple, and progress indicator;
- has visual and target-area tests.

Gaps:

- local `--md-button-*` variables instead of `--md-comp-button-*`;
- API allows `type="toggle"` with `color="text"`, while Material docs exclude text toggle buttons;
- `formAction` diverges from native button `type` terminology;
- icon size is 18px while Material cache states 20dp;
- loading is a project extension and must be documented.

Verdict: best first component pilot after the small foundation token/state prerequisite.

## Icon buttons: `MDIconButton`

Material cache confirms default/toggle variants, filled/tonal/outlined/standard colors, size/width/shape configurations, tooltip on web, and outlined-to-filled icon treatment for toggle state.

Current state:

- supports color, type, selected, size, width, shape, tooltip, symbol name, icon slot, and rich tooltip slot;
- implements selected symbol fill behavior and 48dp target layers;
- has visual, target-area, toolbar, and dense-toolbar behavior tests.

Gaps:

- local `--md-icon-button-*` variables instead of `--md-comp-icon-button-*`;
- loading and rich tooltip content are project extensions;
- compact toolbar sizing is intentionally tested but must be documented if it deviates from Material layout expectations.

Verdict: include in Buttons pilot.

## FAB: `MDFab`, `MDFabContainer`

Material cache confirms FAB, medium FAB, and large FAB; small FAB is no longer recommended; variants are size-based; primary/secondary/tertiary and container color styles are current; surface FABs are no longer recommended.

Current state:

- supports default, medium, and large sizes;
- no small FAB exists;
- supports primary, secondary, tertiary, and `tonal-*` color values;
- has tooltip, symbol slot/name, loading, state layer, and visual tests.

Gaps:

- local `--md-fab-*` variables instead of `--md-comp-fab-*`;
- public color names `tonal-primary`, `tonal-secondary`, and `tonal-tertiary` should be reviewed against Material container color naming;
- `MDFabContainer` is project-specific placement infrastructure, not the Material FAB itself;
- loading is a project extension;
- `columns: var(--md-fab-icon-color)` inside icon styles appears to be a typo and should be confirmed/fixed during migration.

Verdict: include in Buttons pilot after base buttons and icon buttons.

## Lists: `MDList`, `MDListItem`, `MDListSelectionItem`

Material cache confirms lists help users find and act on items; items should be scannable and consistently formatted; M3 Expressive adds standard/segmented styles, state-dependent expressive shape, segmented gaps, and improved selection states. The legacy `baseline` style is reference-only and intentionally unsupported in this PR.

Current state:

- `MDList` owns list style through `listStyle: 'standard' | 'segmented'`; there is no public `variant` prop — the current Material / Expressive row geometry is the only supported implementation; `baseline` is removed from the runtime API;
- `MDListItem` uses Material slot vocabulary: `leading`, `overline`, `supportingText`, `trailing`, and `trailingAction`;
- list modes are explicit through `static`, `single-action`, and `multi-action`;
- list-level selection is controlled through `selectionMode` plus `modelValue`, with `role="listbox"` and `role="option"` semantics, disabled-aware roving tab stops, a vertical keyboard contract (`ArrowDown`/`ArrowUp`/`Home`/`End`; not `ArrowLeft`/`ArrowRight`), and a visible check indicator that does not rely on color alone;
- `single-action` does not use runtime `@action` listener detection: declared Vue emits do not provide a reliable runtime listener-presence contract through `attrs`, so listener introspection was intentionally not implemented; `single-action` correctness for a real action is left to the consumer providing either `href` or an `@action` handler;
- `multi-action` is enforced: a dev-mode warning fires when `mode="multi-action"` is used without a `#trailingAction` slot;
- static rows with a trailing control use `static` mode and the `#trailing` slot; they do not expose a fake primary action surface;
- inside `MDList`, action rows render a stable listitem wrapper plus an internal button/link primary action surface, so the final list contract is no longer `button[role=listitem]` or `a[role=listitem]`;
- segmented styling is implemented in the shared primitive, including grouped container shape, inter-item gap, and first/last item rounding;
- all rows use Expressive minimum container heights: 56dp / 72dp / 88dp (one/two/three-line);
- expressive shape follows the current token model: 4dp default item shape, 12dp hovered shape, and 16dp focused/pressed/dragged/selected shape, with a 16dp segmented list container shape and 2dp segmented gap;
- `--md-private-list-item-min-container-height` remains restricted/internal compatibility-only documentation; it is not a public consumer sizing API, and Menu still owns its own geometry through separate CSS;
- selected rows use `secondary-container` with `on-secondary-container`, segmented item container color is `surface`, overline typography is `label-small`, and dragged rows keep their resting container color (no `md.comp.list.list-item.dragged.container.color` token is published) while remapping label/icon/state-layer content to `on-surface` / `on-surface-variant` and elevation to `md.sys.elevation.level4`, per the documented List Common spec dragged tokens (see [Dragged state](../../src/shared/ui/Lists/README.md#dragged-state) in the List README);
- component tokens reuse the exact documented Material token path (e.g. `--md-comp-list-list-item-label-text-color`) instead of generic content/muted naming or a shortened invented form;
- direct consumers select list style through `MDList` without a `variant` prop, including repository explorer sections, local file-system lists, Google session lists, database property lists, and database view reordering;
- Storybook hierarchy is under `Material 3/Components/Lists/MDListItem` with deterministic configuration, state, selection, trailing-action, and DOM-contract stories; baseline stories have been removed; all `multi-action` stories have a primary `@action` handler and a `#trailingAction` slot; stories use Material-oriented labels;
- shared List-family anatomy CSS (`listItemAnatomy.css`) is imported non-scoped by both MDListItem and MDListSelectionItem, eliminating duplicated token definitions, state modifier remaps, body/element layout, and typography;
- `MDListItem` inside a selection list suppresses both its primary action surface and any trailing action slot, rendering only inert presentation content (`role="none"`);
- `MDListSelectionItem` outside a selection context renders as structurally inert presentation content: `role="presentation"`, no state layer, no ripple, no pointer cursor, no `tabindex`;
- multi-action rows stack the primary action and the trailing action in the same CSS grid cell (`grid-area: 1 / 1`) so the primary action still covers the full visual row, with its own `MDStateLayer` inside; the trailing action container background is `pointer-events: none` so empty trailing padding falls through to the primary action; direct slot content (icon button) has `pointer-events: auto` restored via CSS child selector; trailing slot content keeps its own independent state layer;
- `disabled` on a `multi-action` row disables the whole row action topology (Option A): the primary action is disabled and the consumer-owned trailing action is made `inert`, so List keyboard traversal skips both the primary and trailing targets of a disabled row;
- interaction states story covers single-action (full-row state layer), multi-action (full-row primary via grid-stacked action, trailing hover independence), and trailing action (local state layer independent of row state); selection story covers single-select and multi-select lists;
- surface-context story covers standard List on multiple parent surface colors, standard List inheritance through intermediate wrappers, and the Repository Explorer header + segmented List regression case to demonstrate scoped grouped surfaces;
- consumer-patterns story covers Home Create/Open space actions (two-line items, no forced three-line layout), Google Drive connected profile row (avatar leading, trailing action), Settings checkbox row (enabled with presentation checkbox, disabled without pointer cursor), and repository/file/directory rows (static, single-action, multi-action);
- trailing action target size verified with a Playwright browser assertion against the `.md-icon-button__target` span (≥48×48 px);
- multi-action hover ownership is browser-tested: primary-area hover activates row-level `md-state_hover`; trailing-target hover removes row-level `md-state_hover`; empty trailing padding hover falls through to the primary action surface; all three geometry checks are now hard assertions with no silent skip;
- standard list transparent background verified by browser assertion (computed background must be `rgba(0, 0, 0, 0)`); segmented list explicit background verified by browser assertion (must not be transparent);
- Home actions verified to use two-line layout (`md-list-item_line-count_2`), not three-line;
- Settings checkbox row verified: no nested inputs or labels, no nested buttons, disabled row has no pointer cursor;
- browser-level DOM tests cover static, single-action, multi-action, segmented, and selection lists; unit tests cover mode separation, line-count rendering, li-tag list semantics, selection list trailing action suppression, orphan selection item state layer absence and tabindex absence, disabled-aware option focus, and selection wiring;
- `--md-private-list-item-min-container-height` moved to restricted/internal in README; content-driven sizing remains the default and `lineCount` is limited to supported one/two/three-line layouts; trailing-action geometry tests converted from conditional-skip to hard assertions;
- non-selection `single-action`/`multi-action` rows now have a shared keyboard contract owned by `MDList` (`useListActionKeyboard` / `listActionItemNavigation`): `ArrowDown`/`ArrowUp` move within the same action column, `ArrowLeft`/`ArrowRight` move between a multi-action row's primary and trailing action, `Home`/`End` move to the first/last enabled row in the current column, and disabled rows or disabled/inert trailing actions are skipped.

Gaps:

- `MDList` does not yet expose richer listbox labeling helpers beyond forwarded ARIA attributes;
- selection rows currently use a shared checkmark indicator rather than Material-specific radio or checkbox controls;
- live Figma node verification was blocked by Figma MCP plan limits; expressive geometry should be re-checked against the Design Kit when Figma MCP access is available.

Verdict: second migration family after Buttons. Remains `partial` until live Figma comparison and full accessibility verification are complete; multi-action keyboard traversal is now implemented as a shared `MDList` contract.

## Dialogs: `DialogForm`

Material cache confirms basic and full-screen dialogs; dialogs should be single-task prompts and commonly confirm high-risk actions.

Current state:

- supports headline, supporting text, optional icon, body slot, cancel/apply actions, loading, `basic`/`full-screen` type, focus trap, escape, and browser back handling.

Gaps:

- uses a native `dialog` with fixed scrim and local z-index instead of the shared overlay container/teleport ownership model;
- no registry-backed visual/browser coverage found;
- full-screen implementation is not confirmed beyond the public type class;
- action ordering/count, destructive action semantics, focus restoration, nested overlays, and scroll behavior need browser verification.

Verdict: migrate after Buttons and Lists; start with overlay ownership.

## Text fields: `MDTextField`, `MDFieldContainer`

Current state:

- supports filled/outlined type, label, supporting text, disabled, error, counter, native input types, multiline, readonly, autofocus, leading/trailing icons, and focus/keydown emits.

Gaps:

- local field variables instead of `--md-comp-text-field-*`;
- `MDFieldContainer` is public-looking but acts as an implementation primitive;
- label motion, padding, icon behavior, focus indicator, disabled/error colors, and counter behavior need source-backed review;
- no registry-backed visual coverage found.

Verdict: migrate after dialogs or with select controls if menu ownership is ready.

## Chips: `MDChipBase`

Material cache confirms assist, filter, input, and suggestion variants; elevation defaults to 0 but can be elevated; chip stroke changed from outline to outline variant.

Current state:

- supports all four variants, selected, elevated, draggable, disabled, autofocus, leading/trailing icon slots, and input close action;
- uses state layer, ripple, `MDSymbol`, and `MDIconButton`;
- has visual and interaction tests.

Gaps:

- one broad base component permits combinations that may be invalid per chip type;
- no `--md-comp-chip-*` token set;
- disabled state uses whole-chip opacity;
- input close action needs keyboard/accessibility verification.

Verdict: prefer strict type-specific wrapper contracts during chip migration.

## Menus: `MDMenuBase`

Material cache confirms menus are temporary action sets; persistent actions belong in toolbars; menus can open from icon buttons, split buttons, and text fields; context menus are element-specific and usually secondary-click driven.

Current state:

- uses `useOverlayContainer`, `TeleportContainer`, `onInteractionOutside`, Floating UI, focus trap, keyboard search, escape stack, and browser back stack;
- renders its own menu container with default `role="menu"` and menu-specific CSS; it does not depend on `MDList`.

Gaps:

- no `--md-comp-menu-*` token set;
- CSS capitalizes first letters of list item headlines, which is not a Material menu rule and should be removed or documented as product-specific;
- no registry-backed visual/browser tests for positioning, focus, outside interaction, nested overlays, or mobile viewport behavior;
- M3 Expressive vertical menu features are not represented.

Verdict: overlay model is better aligned than dialogs; migrate after selection controls/chips depending on dependencies.

## Remaining component groups

The registry still treats navigation, app bars, toolbars, sheets, cards, progress indicators, tooltips, dividers, snackbars, tables, empty states, panes, and buttons bar as `partial` or `project-specific` until each family receives the same source-backed audit.

For those groups, do not claim alignment until the component-family PR checks the relevant cache pages, defines `--md-comp-*` tokens where applicable, documents public API/deviations, and adds high-value Storybook/visual/browser coverage.
