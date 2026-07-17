# Material 3 component family audit

This file records component-family findings from the current implementation plus verified Material 3 sources. It complements [Material 3 foundation audit](./foundation-audit.md), [Foundation audit details](./foundation-audit-details.md), and [Component registry](./component-registry.md).

Unless a section says otherwise, non-Button-family findings below come from the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`.

## Button-family Material source

The current findings for `MDButton`, `MDIconButton`, `MDFab`, and `MDExtendedFab` use this verified fallback snapshot:

- repository: `Vyachean/m3-docs-cache`
- commit: `49ffae58a61f86c28b23720696dc9d07b6945483`
- capturedAt: `2026-07-13T12:48:04.850Z`
- failedPageCount: `0`
- suspiciousPageCount: `0`
- coverageHealth: `verified`

Checked paths:

- `pages/components/buttons/overview.md`
- `pages/components/buttons/specs.md`
- `pages/components/buttons/accessibility.md`
- `pages/components/icon-buttons/overview.md`
- `pages/components/icon-buttons/specs.md`
- `pages/components/floating-action-button/overview.md`
- `pages/components/floating-action-button/specs.md`
- `pages/components/extended-fab/overview.md`
- `pages/components/extended-fab/specs.md`
- `pages/styles/motion/overview/how-it-works.md`
- `pages/styles/motion/overview/specs.md`

The earlier June MCP snapshot and May fallback snapshot are historical sources and must not be read as the source of the current Button-family conclusions.

## Buttons: `MDButton`

Status: `partial`.

Confirmed current state:

- five Material color styles and five sizes are supported, with `round`/`square` shapes and `default`/`toggle` variants;
- `color="text"` with `variant="toggle"` is unsupported by the verified token graph and normalizes to the default variant with a development warning;
- every public `--md-comp-button-*` property routes through a private variable with a Material/system fallback (`--md-private-button-X: var(--md-comp-button-…, <default>)`) instead of assigning the Material default directly on `.md-button_color-*`; this makes the override contract reliable for inline styles, ordinary CSS classes, and ancestor inheritance alike, verified in a real browser for all three routes plus a state-specific override;
- ten previously undocumented `--md-comp-button-*` names have been removed (outlined/text publish no elevation route; outlined publishes no `unselected`- or `selected`-qualified resting/selected outline-color token); six real official tokens were added (`filled`/`tonal` disabled-container-elevation; outlined `unselected` hovered/focused/pressed/disabled outline-color); outlined/text elevation is now a private-only constant resolving to `--md-sys-elevation-level0`, and the outlined selected outline visually follows the selected container color in every interaction state instead of inventing a selected-outline token;
- label and icon routes remain independently overrideable where Material publishes independent paths;
- selected and disabled semantics compose correctly for reachable user states, including retained `aria-pressed`, selected shape while disabled (including the artificial selected + disabled + forced-pressed combination), selected-disabled outlined routing, and enabled selected-plus-pressed shape precedence;
- the root owns `border-radius`/`box-shadow` (fast spatial) and `background-color`/`border-color` (fast effects) transitions and no longer transitions `color`; the label and icon elements each own their visible `color`/`opacity` fast-effects transition, verified on the actual owning elements;
- loading remains a Mioframe extension: numeric values clamp to `[0, 1]` (finite out-of-range and non-finite values log a development warning and fall back to a safe `0`), the button exposes `aria-busy="true"` while loading, and the rendered progress indicator carries `aria-hidden="true"` and dims to the same effective content opacity as the label it replaces when disabled;
- native form behavior, loading activation, expanded targets, keyboard focus, pointer ownership, Storybook stories, and browser token/geometry assertions are implemented;
- the leading icon slot is typed as optional, matching its always-optional runtime behavior.

Verification boundary:

- resting, hover, focus, pressed, disabled, selected/unselected, enabled selected-plus-pressed, disabled selected forced-pressed, geometry, target, and default/inline/class/inherited token routes are covered for the supported public subset;
- rendered label/icon color motion is verified on the child elements that own those colors;
- shadow-color override verification asserts the private `--md-private-elevation-shadow-color` bridge variable and the final rendered `box-shadow` color for elevated resting, elevated hover, filled hover, and tonal hover. A prior investigation found the browser did not re-derive the final `box-shadow` color through the shared `--md-sys-elevation-levelN` formula's `rgb(from var(...))` when only the color source changed; this was root-caused (2026-07-17) to `--md-sys-elevation-levelN` being declared only on `:root`, so a custom property's `rgb(from var(...))` freezes at `:root`'s default shadow color and a descendant override is only inherited, not recomputed. `src/shared/lib/md/tokens.css` now also declares `--md-sys-elevation-level0`–`level5` on a universal selector (`*, ::before, ::after`), so every element recomputes the formula locally against its own cascaded shadow-color variable. Fixed once at the foundation, benefiting `MDButton`, `MDIconButton`, `MDFab`, and `MDExtendedFab` identically;
- per-size `--md-comp-button-{size}-pressed-container-corner-size-motion-spring-stiffness`/`-damping` component tokens are colocated with a private per-size duration/easing pair consuming the same documented fast-spatial Web adaptation, and the root's `border-radius` transition consumes that per-size pair instead of a flat global constant — establishing a traceable, tested route from the declared spring tokens to the actual rendered corner-radius motion (previously the tokens were declared but never consumed).

Former external foundation dependency (now fixed): the repository's dark-theme `--md-sys-color-inverse-surface`/`--md-sys-color-inverse-on-surface` tokens previously resolved to the same values in both light and dark theme blocks (`src/shared/lib/md/tokens.css`), so they did not actually invert under dark theme. `MDButton`'s outlined selected-toggle route consumes these system tokens by design. The `docs/material-3/audits/button.md` review (2026-07-17) independently confirmed this defect against the official Material dark-scheme mapping (`inverse-surface` → `neutral90`, `inverse-on-surface` → `neutral20`, cross-checked against the icon-buttons/tooltip token specs); the dark-theme block now assigns those correct references, and `tests/e2e/visual/shared-ui/md-button.spec.ts` (`MDButton inverse-surface/inverse-on-surface system tokens invert correctly between light and dark theme`) proves both theme values against the reference palette directly. This was foundation-owned work, not a change inside `MDButton.vue`, and it applies to every consumer of these two system tokens (also `MDIconButton`, `MDPlainTooltip`, `MDSnackbar`), not only `MDButton`.

Unsupported official surfaces do not block this subset: Split Button, Standard Button Group, and Connected Button Group.

Verdict: `MDButton`'s own token graph, override contract, motion ownership (including the per-size spring-to-transition route), shape precedence, loading accessibility, and shadow-color final route are now verified against the Button-family scope of this component; the former dark-theme inverse system-token blocker and the shared elevation final-route defect are both resolved. The family-level status stays `partial` because `MDIconButton`/`MDFab`/`MDExtendedFab` retain unfinished Stage 1–2 work below.

## Icon buttons: `MDIconButton`

Status: `partial`.

Confirmed current state:

- `filled` is the official default; repository consumers that need the previous low-emphasis appearance use explicit `color="standard"`;
- `standard`, `filled`, `tonal`, and `outlined` styles support five sizes, three widths, `round`/`square` shapes, and `default`/`toggle` variants;
- public `--md-comp-icon-button-*` tokens cover the supported Material paths for geometry, state colors, outline, disabled routing, and motion spring parameters;
- tonal disabled container opacity is `0.1`, and selected-disabled outlined routing is implemented;
- the built-in `MDSymbol` fill follows selected state while disabled; arbitrary custom icon slot treatment remains consumer-owned;
- native semantics, tooltip behavior, loading activation, expanded targets, keyboard focus, adjacent-control ownership, Storybook stories, and browser token/geometry assertions are implemented;
- loading and rich tooltip content remain Mioframe extensions.

Verification boundary:

- reachable user states and enabled selected-plus-pressed precedence are verified for the supported public subset;
- the artificial selected + disabled + forced-pressed shape combination is explicitly excluded and remains Stage 2 work;
- visible icon color motion is not yet verified on the icon element that owns the color;
- current focus-indicator component paths exist only in deprecated legacy namespaces, so the generic project focus indicator remains the supported contract.

Unsupported official compositions do not block this subset: Split Button and Standard/Connected Button Groups.

Verdict: safe to use for the documented public subset, but not yet fully verified Material 3 Expressive alignment.

## FAB: `MDFab`, `MDExtendedFab`, `FabContainer`

Status: `partial` for `MDFab` and `MDExtendedFab`; `project-specific` for `FabContainer`.

Confirmed current state:

- both Material components expose the six current color styles;
- `MDFab` supports regular/medium/large sizes and independent width/height component-token routes;
- `MDExtendedFab` supports small/medium/large sizes with independent label/icon and leading/trailing-space routes;
- state colors, state-layer opacity, elevation, shadow-color bridge, geometry, loading, focus behavior, Storybook stories, and browser assertions are implemented for the supported subset;
- plain `primary`, `secondary`, and `tertiary` styles publish focus-indicator color, thickness, and offset component tokens, which route into the generic focus-indicator contract; their default values match the project system defaults;
- the three `*-container` styles do not publish distinct focus-indicator component tokens in the verified source and therefore use the generic system fallback;
- `FabContainer` owns placement only and has no Material FAB visual-token ownership;
- loading remains a Mioframe extension; neither Material component exposes a disabled prop in the current project contract.

Verification boundary:

- focus-indicator routing is verified only for a representative override and default-role coverage, not yet for both FAB components, every published property, and all three plain styles;
- shadow-color tests confirm the component-token-to-private bridge but do not yet assert the final computed shadow; the underlying `src/shared/lib/md/tokens.css` formula that previously blocked this (see the Buttons section above) is fixed at the foundation, so this is now a `MDFab`/`MDExtendedFab` test-coverage gap rather than a foundation limitation;
- visible label/icon color motion is not yet verified on the child elements that own those colors.

Unsupported surfaces do not block this subset: FAB Menu, legacy Small FAB, and lowered/surface FAB variants.

Verdict: safe to use for the documented public subset, but not yet fully verified Material 3 Expressive alignment.

## Shared Button-family motion foundation

Implemented foundation:

- fast-spatial spring aliases: stiffness `800`, damping `0.6`;
- private Web fast-spatial conversion: `350ms`, `cubic-bezier(0.42, 1.67, 0.21, 0.9)`;
- private Web fast-effects conversion: `150ms`, `cubic-bezier(0.31, 0.94, 0.34, 1)`;
- `MDStateLayer` consumes a generic private transition contract and retains the legacy fallback for non-Button consumers.

This foundation is present. `MDButton` now applies and verifies the transition on every actual owning element (root spatial/color-effect properties, label/icon color/opacity), and its per-size official `*-pressed-container-corner-size-motion-spring-stiffness`/`-damping` component tokens are colocated with a private duration/easing pair that the root `border-radius` transition actually consumes (verified per size), instead of those tokens being declared without participating in the rendered motion. The Button family remains `partial` because `MDIconButton`, `MDFab`, and `MDExtendedFab` do not yet consistently apply or verify the transition on their actual owning elements.

## Remaining Button-family alignment work

Each stage is intentionally narrow and independently implementable.

### Stage 1 — Content motion ownership

Scope: `MDIconButton`, `MDFab`, `MDExtendedFab`, and focused motion verification only. `MDButton` completed this stage: the root retains transitions only for root-owned properties (no root `color` transition), the label and icon elements each carry their own fast-effects `color`/`opacity` transition, and duration/easing are asserted on those owning elements.

Current gap: root controls expose Expressive color transitions, but rendered label/icon colors are owned by child elements that do not yet consistently consume the fast-effects color transition. Existing assertions inspect root controls rather than every actual property owner.

Expected result:

- apply `color` transition to the real label/icon elements;
- retain root transitions only for root-owned properties;
- assert duration and easing on the owning elements;
- do not change public API, token routing, state routing, or screenshot-matrix structure.

Classification: user-visible polish; not a current functional blocker.

### Stage 2 — Disabled selected forced-state shape precedence

Scope: `MDIconButton`, shape selectors, and focused browser checks only. `MDButton` completed this stage using plain CSS selector precedence (no JavaScript state derivation): the per-size selected-shape rule now also matches `.md-state_disabled`/`:disabled`, so it wins over the base shape even when a `.md-state_pressed` class is forced onto a disabled element.

Current gap: an artificial fixture combining selected, disabled, and forced pressed state may fall back to the base shape. Native disabled controls cannot enter a real pressed interaction, so this is not a reachable user-flow failure, but it remains an incomplete state-composition contract.

Expected result:

- selected enabled → selected shape;
- selected enabled + pressed → pressed shape;
- selected disabled → selected shape;
- selected disabled + forced pressed → selected shape.

Classification: contract edge case; not a current production interaction blocker.

### Stage 3 — Override verification completion

Scope: browser tests only unless a test proves a concrete production defect. `MDButton`'s motion-owning-element assertions are complete. `MDButton`'s shadow-color verification now asserts the final rendered `box-shadow` color, not only the private bridge variable and elevation-level geometry: the shared `src/shared/lib/md/tokens.css` elevation formula was root-caused and fixed (2026-07-17) — see the Buttons section above.

Remaining gaps:

- `MDFab` and `MDExtendedFab` shadow-color tests were not updated in this pass to assert the final rendered color; the underlying formula is already fixed, so this is now test-coverage work, not a foundation blocker;
- FAB focus-indicator verification does not yet cover both FAB components, color/thickness/offset, and all three plain styles;
- some `MDIconButton`/`MDFab`/`MDExtendedFab` motion assertions inspect root elements rather than actual property owners.

Expected result:

- `MDFab` and `MDExtendedFab` shadow-color tests assert the final rendered `box-shadow` color, matching the pattern used by `MDButton`'s test;
- `MDFab` and `MDExtendedFab` verify focus-indicator color, thickness, and offset for `primary`, `secondary`, and `tertiary`;
- motion assertions inspect the actual owning elements;
- production code changes only when an exact test proves a routing defect.

Classification: verification completeness; no known current rendered-token defect.

### Future alignment gate

The family can return from `partial` to `aligned` only after:

1. Stage 1 is implemented and verified.
2. Stage 2 is implemented and verified.
3. Stage 3 is complete.
4. Full `pnpm verify` passes.
5. Documentation is rechecked against the same Material snapshot or a newer verified snapshot.
6. Unsupported surfaces and project extensions remain explicitly documented.

Split Button, Button Groups, FAB Menu, lowered/surface FAB, legacy Small FAB, JavaScript spring physics, and automatic selected treatment for arbitrary custom icon slot content are not required for this gate.

`MDButton` individually also cannot move to `aligned` until the dark-theme inverse system-token defect noted above is resolved, independent of the family-level gate.

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
