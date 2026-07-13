# Material 3 component family audit

This file records component-family findings from the current implementation and Material 3 cache. It complements [Material 3 foundation audit](./foundation-audit.md) and [Foundation audit details](./foundation-audit-details.md).

## Buttons: `MDButton`

Material cache (captured 2026-06-30) confirms `default`/`toggle` variants, elevated/filled/tonal/outlined/text color configurations, five sizes (official token path segments `xsmall`/`small`/`medium`/`large`/`xlarge`), round/square shapes, 16dp recommended small padding, 48x48dp target area for extra-small/small buttons, and per-size icon sizes (20/20/24/32/40dp). The `buttons/guidelines` page illustrates `default`/`toggle unselected`/`toggle selected` for five button styles including "Text button" — text buttons do support toggle selection. `md.comp.button.text` has no `selected`/`unselected` _color_ tokens (unlike elevated/filled/tonal/outlined, which do), but the shape-morph tokens (`md.comp.button.<size>.selected.container.shape.{round,square}`) are size-scoped, not color-style-scoped, so a selected text toggle still morphs shape and reflects `aria-pressed`; only its label/icon color stays unchanged since no token defines a different one. Per-size label typography is confirmed via `md.comp.button.<size>.label-text`: `xsmall`/`small`→label-large, `medium`→title-medium, `large`→headline-small, `xlarge`→headline-large.

Current state (this migration):

- public API uses `variant` (was `type`) and `nativeType` (was `formAction`);
- `variant="toggle"` exposes controlled `aria-pressed`; `selected` with `variant="default"` is ignored and warns in development; `variant="toggle"` with `color="text"` is supported (a prior pass incorrectly prohibited it based only on the absence of text-toggle color tokens, contradicting the guidelines' toggle illustration — the prohibition (`isTextToggle`) and its warning have been removed);
- `--md-comp-button-*` component tokens implemented for all five color styles and five sizes, resolving to `--md-sys-*`; the public custom-property names use the official `xsmall`/`xlarge` path segments (a prior pass had left `extra-small`/`extra-large` in the token names while keeping the public size prop values unchanged);
- label typography now varies per size (`xsmall`/`small`→label-large, `medium`→title-medium, `large`→headline-small, `xlarge`→headline-large) instead of one global label-large rule for every size;
- selected toggle shape now morphs per size via `--md-comp-button-<size>-selected-container-shape-{round,square}`: a round shape becomes the size's square corner when selected, a square shape becomes fully rounded when selected, and the pressed shape always wins over the selected shape;
- icon size now varies per size (was a flat 18px); `extra-small` icon-label gap corrected to the official 8dp (was 4px); disabled opacities corrected to the official 0.1 container / 0.38 content split (was a uniform 0.12 approximation);
- uses `MDStateLayer`, ripple, and progress indicator; has focused unit tests, browser assertions for typography and selected-shape, and Storybook coverage.

Remaining gaps:

- `outlined` hover/disabled border color kept as the pre-existing implementation (`--md-sys-color-outline` on hover, `on-surface` 12% when disabled) rather than the literal official `outline-variant` tokens, pending a rendered visual comparison;
- toggle/selected per-style _color_ values (for the four styles that have them) kept as the pre-existing implementation, not freshly re-derived from the official toggle token set;
- component-level focus-indicator tokens do not exist in the current (non-deprecated) cache namespace; the shared global focus-indicator default already matches the documented value, so no override was added;
- loading remains a documented project extension.

Verdict: token/API migration complete, including size typography, selected-shape morphing, and text toggle support; remains `partial` pending visual/browser verification of the two color-deviation items above.

## Icon buttons: `MDIconButton`

Material cache confirms `default`/`toggle` variants, filled/tonal/outlined/standard colors, size/width/shape configurations, tooltip on web, and outlined-to-filled icon treatment for toggle state.

Current state (this migration):

- public API uses `variant` (was `type`) and `nativeType` (was `formAction`); removed the public `focused`/`pressed` visual-test props in favor of the shared forced-state Storybook mechanism (`md-state_*` classes);
- `variant="toggle"` exposes controlled `aria-pressed`; `selected` with `variant="default"` is ignored and warns in development;
- `--md-comp-icon-button-*` component tokens implemented for all four color styles and all five sizes/widths/shapes; size/shape values were already numerically token-accurate and are now exposed as named component tokens; the public custom-property names use the official `xsmall`/`xlarge` path segments (a prior pass had left `extra-small`/`extra-large` in the token names); disabled container opacity corrected to 0.1 (was 0.12);
- has visual, target-area, toolbar, and dense-toolbar behavior tests plus toggle/warning unit tests.

Remaining gaps:

- per-style toggle `selected`/`unselected` color roles (hover/focus/pressed) kept as the pre-existing implementation, not freshly re-derived from the official per-state toggle token set;
- component-level focus-indicator tokens exist only under deprecated legacy component names in the cache, not the current namespace; the shared global default is reused unchanged;
- loading and rich tooltip content remain documented project extensions.

Verdict: token/API migration complete; remains `partial` pending visual/browser verification and the toggle-token gap.

## FAB: `MDFab`, `MDExtendedFab`, `MDFabContainer`

Material cache confirms FAB, medium FAB, and large FAB (small FAB not recommended); Extended FAB small/medium/large (baseline not recommended); surface FABs not recommended. It confirms the M3 Expressive color model directly: the historical container-role `primary`/`secondary`/`tertiary` styles were renamed to `primary-container`/`secondary-container`/`tertiary-container`, and new plain `primary`/`secondary`/`tertiary` styles (using the non-container sys color) were added alongside them — six color styles total for both FAB and Extended FAB.

Current state (this migration):

- `MDFab` and `MDExtendedFab` `color` use the current six official names (`primary`, `secondary`, `tertiary`, `primary-container`, `secondary-container`, `tertiary-container`); `tonal-primary`/`tonal-secondary`/`tonal-tertiary` are removed with no alias; `primary-container` is the default for both — `MDFab`'s default was corrected from `primary` to `primary-container` (a prior pass left the wrong default color role in place); `MDExtendedFab` already defaulted correctly;
- `MDFab` requires an icon via `mdSymbol` or the `icon` slot; a missing icon warns in development and no longer renders a debug checkerboard placeholder; `size` has an explicit `regular` default;
- `--md-comp-fab-*` and `--md-comp-extended-fab-*` component tokens implemented for all six color styles (container/icon/label-text color, default and hovered elevation) and all sizes;
- `MDExtendedFab` label typescale follows size (`small`→title-medium, `medium`→title-large, `large`→headline-small) per the official spec;
- `MDExtendedFab`'s icon-label gap now follows size via `--md-comp-extended-fab-{small,medium,large}-icon-label-space` (8dp/12dp/16dp) instead of one fixed 12px gap for every size — a prior pass introduced the per-size token names but left the rendered `gap` unconditional;
- `MDFabContainer` remains project-specific placement infrastructure; its Storybook title moved from `Material 3/Components/Buttons/MDFabContainer` to `Project UI/Buttons/MDFabContainer` since it is not an official Material component and owns no FAB visual tokens — a prior pass had left it under the Material hierarchy.

Remaining gaps:

- the official token cache contains internally contradictory duplicate hover/focus color rows for the three plain FAB/Extended-FAB styles (`hovered.*` vs `hover.*`, aliasing different color roles); neither component currently varies icon/label color by interaction state (only elevation changes), so this ambiguity was not wired in;
- component-level focus-indicator tokens resolve to the secondary role for the three plain styles and do not exist at all for the three `-container` styles in the cache; the shared global default is reused for all six styles without a component override;
- loading remains a documented project extension.

Verdict: color-terminology, default-color, token, and geometry fixes complete; remains `partial` pending visual/browser verification of the state-color ambiguity above.

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
