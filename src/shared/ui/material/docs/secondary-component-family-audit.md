# Secondary Material 3 component family audit

This file covers component families that were only summarized in [Component family audit](./component-family-audit.md). It prevents the registry rows from remaining unaudited placeholders.

## Selection controls: `MDCheckbox`, `MDCheckboxField`, `MDSelectBase`

Material cache confirms checkboxes are for selecting one or more items from a list or toggling an item, labels should be scannable, selected items are more prominent, and M3 adds indeterminate and error states.

Current checkbox state:

- `MDCheckbox` supports selected, unselected, indeterminate, error, disabled, readonly, presentation mode, tooltip, aria label, autofocus, and keyboard toggling.
- It uses `MDStateLayer`, `useStateLayer`, ripple, `MDSymbol`, and `MDPlainTooltip`.
- Visual tests cover checkbox states and interaction states.

Gaps:

- no `--md-comp-checkbox-*` token set;
- checkbox host is a custom label with hidden native input and custom keyboard handling, so browser/accessibility behavior must be verified carefully;
- `readonly`, `presentation`, and tooltip are project extensions and should be documented;
- `MDCheckboxField` should be classified as a project-specific wrapper unless it maps to a Material form field pattern;
- `MDSelectBase` depends on menu/text-field behavior and should not be migrated before menu ownership and field tokens are clear.

Verdict: checkbox can be migrated with selection controls after text fields or alongside the first form-family PR. Select should wait for menu alignment.

## Navigation: bar, rail, and path

Material cache confirms navigation bars are for compact and medium windows, should contain 3-5 stable destinations of equal importance, and M3 Expressive introduces a flexible navigation bar. Language Web implementation is unavailable in the Material cache, so the project must rely on the general Material documentation, not a web reference implementation.

Current navigation bar state:

- `MDNavigationBar` renders buttons from a destination list and has horizontal/vertical type variants.
- `MDNavigationPath` is a project breadcrumb/path surface, not a confirmed Material component.
- Navigation rail is present in shared UI but was not deeply checked in this audit.

Gaps:

- no `--md-comp-navigation-bar-*` or `--md-comp-navigation-rail-*` token sets;
- adaptive ownership is unclear: the component exposes a type prop, but the app shell likely owns compact/medium/expanded switching;
- destination count/stability is not enforced by the shared component;
- Storybook and visual coverage were not confirmed for navigation bar/rail responsive states;
- `MDNavigationPath` should remain `project-specific` unless a Material surface mapping is found.

Verdict: migrate after core input/overlay families, unless navigation visual regressions become product-critical.

## App bars and toolbars

Material app-bar docs exist in the cache, but some top-app-bar routes are marked failed/suspicious in `index.json`. Use stable `pages/components/app-bars/...` paths and avoid old failed routes.

Current state:

- `MDAppBar` exists.
- `MDToolbarContainer` and toolbar playgrounds exist.
- Toolbar behavior is also indirectly covered by `MDIconButton` compact-toolbar visual/behavior tests.

Gaps:

- no app-bar or toolbar component-token set;
- toolbar containers may be project layout helpers, not official Material app bars;
- scroll behavior, navigation icon ownership, action layout, and responsive behavior need source-backed review;
- app-bar and toolbar Storybook hierarchy is not normalized.

Verdict: keep toolbars project-specific unless mapped to app-bar guidance during that family migration.

## Bottom sheets

Material cache confirms bottom sheets show secondary content anchored to the bottom, are intended for compact/medium windows, have standard and modal variants, can be dismissed, use 28dp top corner radius, max width 640dp, and may have a drag handle with a 48dp hit target.

Current state:

- `MDBottomSheet` supports `standard` and `modal` type, label, collapsed/fullscreen models, overlay container for modal type, and teleport placeholder positioning.
- `MDBottomSheet2` and duplicate container/section variants also exist.

Gaps:

- no `--md-comp-bottom-sheet-*` token set;
- duplicate `*2` sheet family needs architectural resolution before alignment can be claimed;
- drag handle, 48dp hit target, modal scrim, focus trap, escape/back behavior, scroll locking, and max-width behavior need browser verification;
- current code has a FIXME to remove `TeleportWithPlaceholder`, so sheet ownership is not stable enough for alignment.

Verdict: migrate after dialogs/menus establish the final overlay model.

## Cards

Material cache confirms cards contain related content/actions about a single subject, have elevated/filled/outlined variants, and are either a non-actionable container holding buttons/links or a directly actionable surface with no internal buttons/links (never both). Material's card examples (media, headline/subhead/supporting text, buttons, lists, selection controls, linked text, overflow menus) describe possible content placed inside a card — they are not required card-container API.

Current state (see [Component registry](./component-registry.md) Cards row for the full checklist):

- `MDCard` implements `--md-comp-{elevated,filled,outlined}-card-*` component tokens for container (including `surface-tint-layer.color` mapped to `--md-sys-color-surface-tint`), disabled, focus indicator, and hover/focus/pressed/dragged state-layer (plus outline for outlined), mapped from the Material3 MCP card token graph and resolved through the shared `MDStateLayer`/focus-indicator generic contracts.
- Public API is `variant`/`mode`/`href`/`disabled`/`dragged`/`nativeType` with an `action` emit and a default-only slot. `mode="static"` (default) is a non-actionable `div`; `mode="button"`/`"link"` render the card itself as the native actionable surface with `MDStateLayer` + ripple. `mode="button"` restricts rendered content to safe phrasing content (native `<button>`'s content model), enforced with a development-only warning rather than a type-level restriction.
- MDCard is a Material surface owner: it maps its resolved container/content color to `--md-container-color`/`--md-content-color` and `--md-current-container-color`/`--md-current-content-color`, so nested Material primitives read the card's surface. The actionable ripple relies on this: `--md-content-color` resolves to on-surface, matching every variant's documented pressed state-layer color, so no card-specific ripple override was needed.
- Storybook (`shared/ui/MDCard`) and `tests/e2e/visual/shared-ui.spec.ts` cover variants, static-with-actions (using the `.md-typescale-*` typography pattern), actionable button/link cards, an action/keyboard-behavior story with observable counters, disabled actionable cards, dragged, and a root-level forced interaction-state gallery.

Remaining gaps:

- no support for nested actionable content inside an actionable card — documented in `shared/ui/Card/README.md`; the `mode="button"` development warning also guards simple button-card content by rejecting tags outside the safe phrasing-content allow list;
- internal 16dp padding / 8dp content gap is a project layout default, not an official Material token.

Media/header/actions/list anatomy is not a gap: Material documents those as example content composed inside a card, and `MDCard` intentionally does not own dedicated slots or subcomponents for them. Consumers compose that content in the default slot using their own semantic tags, typography utility classes, and other shared UI primitives (buttons, lists, etc.).

Verdict: `aligned` as a Material card container/surface component — variants, tokens (including surface-tint), modes, and Storybook/visual coverage are in place; the remaining items above are documented container-level deviations, not missing content anatomy.

## Progress indicators

Material cache confirms progress indicators have linear and circular variants, should use consistent configuration for the same process, and have shape/thickness/wavy configuration updates.

Current state:

- Progress indicator components exist and are used by buttons/FABs for loading states.
- Only one global component token was found: `--md-comp-progress-indicator-active-indicator-color`.

Gaps:

- full linear/circular split and token set are not documented;
- loading usage inside buttons/FABs is project-specific and should not define the whole progress indicator API;
- determinate/indeterminate semantics and accessibility need review;
- registry-backed visual coverage was not confirmed for standalone progress indicators.

Verdict: migrate after core controls unless loading states force earlier token cleanup.

## Tooltips

Material cache confirms plain and rich tooltip variants. Plain tooltips describe icon-only actions; rich tooltips provide additional context and can include title, link, and buttons.

Current state:

- `MDPlainTooltip`, `MDRichTooltip`, and `MDOverlayTooltip` exist.
- Icon buttons require tooltip text and can render plain or rich tooltip content.

Gaps:

- no `--md-comp-tooltip-*` token set;
- trigger ownership, hover/focus delay, click behavior, escape handling, nested overlays, and mobile behavior need source-backed browser verification;
- rich tooltip inside icon button may be a valid project extension but should not be assumed as the default Material icon-button contract.

Verdict: migrate with overlays or after icon-button pilot identifies tooltip API needs.

## Snackbars

Material cache confirms snackbars show short process updates at the bottom, should not interrupt the user, and may disappear automatically or persist until action.

Current state:

- `MDSnackbar` exists.

Gaps:

- no `--md-comp-snackbar-*` token set;
- placement, action/dismiss behavior, timeout policy, queue ownership, live-region semantics, and portal/overlay ownership need review;
- visual/browser coverage was not confirmed.

Verdict: migrate after overlay primitives are stable.

## Dividers

`MDDivider` exists, but this audit did not find enough evidence to claim Material alignment.

Gaps:

- token set, inset/full-width behavior, orientation, and Storybook coverage need a focused check.

Verdict: small later migration or opportunistic cleanup when lists/cards are migrated.

## Project-specific surfaces

These should not be forced into official Material component rows unless a source-backed mapping is found:

- `MDTable`
- `MDEmptyState`
- `MDPane`
- `MDSplitLayout`
- `MDNavigationPath`
- `MDButtonsBar`

They should use Material foundations for color, typography, shape, spacing, state, and accessibility, but their APIs should remain project-specific.
