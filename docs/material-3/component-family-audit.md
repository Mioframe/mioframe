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

## Lists: `MDList`, `MDListItem`, `MDListSelectionItem`, `MDListContainer`

Material cache confirms lists help users find and act on items; items should be scannable and consistently formatted; M3 baseline heights are 56dp, 72dp, and 88dp; M3 Expressive adds standard/segmented styles and improved selection states.

Current state:

- `MDList` now owns list style and variant through `listStyle: 'standard' | 'segmented'` and `variant: 'baseline' | 'expressive'`;
- `MDListContainer` is reduced to a thin compatibility alias over `MDList`, rather than a separate generic layout owner;
- `MDListItem` uses Material slot vocabulary: `leading`, `overline`, `supportingText`, `trailing`, and `trailingAction`;
- list modes are explicit through `static`, `single-action`, and `multi-action`;
- list-level selection is controlled through `selectionMode` plus `modelValue`, with `role="listbox"` and `role="option"` semantics, disabled-aware roving tab stops, and a visible check indicator that does not rely on color alone;
- `single-action` is enforced: a dev-mode warning fires when `mode="single-action"` is used without an `@action` listener and without an `href`;
- `multi-action` is enforced: a dev-mode warning fires when `mode="multi-action"` is used without a `#trailingAction` slot;
- static rows with a trailing control use `static` mode and the `#trailing` slot; they do not expose a fake primary action surface;
- inside `MDList`, action rows render a stable listitem wrapper plus an internal button/link primary action surface, so the final list contract is no longer `button[role=listitem]` or `a[role=listitem]`;
- segmented expressive styling is implemented in the shared primitive, including grouped container shape, inter-item gap, and first/last item rounding;
- expressive one-line rows now use a taller 64dp minimum container height while baseline keeps the 56dp / 72dp / 88dp thresholds;
- `--md-comp-list-item-min-container-height` is a public consumer token; it is not used by Menu, which owns its own geometry through separate CSS;
- component tokens use Material anatomy names instead of generic content or muted naming;
- direct consumers corrected to choose list style through `MDList`, including repository explorer sections, local file-system lists, Google session lists, database property lists, and database view reordering;
- Storybook hierarchy is under `Material 3/Components/Lists/MDListItem` with deterministic configuration, state, selection, trailing-action, and DOM-contract stories; all `multi-action` stories have a primary `@action` handler and a `#trailingAction` slot; stories use Material-oriented labels;
- `Configurations` story includes baseline standard and expressive segmented examples; interaction states story covers single-action (full-row state layer) and multi-action (primary-action-bounded state layer); selection story covers single-select and multi-select lists;
- trailing action target size verified with a Playwright browser assertion against the `.md-icon-button__target` span (≥48×48 px);
- browser-level DOM tests cover static, single-action, multi-action, segmented, and selection lists; unit tests cover mode separation, variant naming, line-count rendering, li-tag list semantics, invalid selection rows, disabled-aware option focus, and selection wiring.

Gaps:

- multi-action keyboard roving between primary and secondary actions is not implemented as a shared contract;
- `MDList` does not yet expose richer listbox labeling helpers beyond forwarded ARIA attributes;
- selection rows currently use a shared checkmark indicator rather than Material-specific radio or checkbox controls;
- live Figma node verification for the cited Lists page was blocked by the current Figma MCP Starter-plan rate limit during this pass;
- expressive row-height verification should still be re-checked against the Design Kit when Figma MCP access is available again;
- multi-action interaction-states Storybook story predates the row-level state-layer fix and should be updated to reflect full-row hover/pressed coverage.

Verdict: second migration family after Buttons. Remains `partial` until live Figma comparison, multi-action keyboard traversal, and full accessibility verification are complete.

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
- renders through `MDListContainer` with default `role="menu"`.

Gaps:

- no `--md-comp-menu-*` token set;
- CSS capitalizes first letters of list item headlines, which is not a Material menu rule and should be removed or documented as product-specific;
- no registry-backed visual/browser tests for positioning, focus, outside interaction, nested overlays, or mobile viewport behavior;
- M3 Expressive vertical menu features are not represented.

Verdict: overlay model is better aligned than dialogs; migrate after selection controls/chips depending on dependencies.

## Remaining component groups

The registry still treats navigation, app bars, toolbars, sheets, cards, progress indicators, tooltips, dividers, snackbars, tables, empty states, panes, and buttons bar as `partial` or `project-specific` until each family receives the same source-backed audit.

For those groups, do not claim alignment until the component-family PR checks the relevant cache pages, defines `--md-comp-*` tokens where applicable, documents public API/deviations, and adds high-value Storybook/visual/browser coverage.
