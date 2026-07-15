# Material 3 component family audit

This file records component-family findings from the current implementation plus verified Material 3 sources. Unless a section says otherwise, the component-family findings below come from the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. It complements [Material 3 foundation audit](./foundation-audit.md) and [Foundation audit details](./foundation-audit-details.md).

## Button-family Material source (latest review)

The Button family sections below (`MDButton`, `MDIconButton`, `MDFab`, `MDExtendedFab`) reflect the latest review, which used the following fallback snapshot. Do not read the `2026-06-30` MCP snapshot date above, or the older `2026-05-19` fallback snapshot date, as the source of the Button family's current conclusions — both predate this pass.

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

Findings for the other component families in this file (Lists, Dialogs, Text fields, Chips, Menus) still reference the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z` from an earlier historical audit pass, unless a section says otherwise.

## Buttons: `MDButton`

The `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z` confirms `default`/`toggle` variants, elevated/filled/tonal/outlined/text color configurations, five sizes (official token path segments `xsmall`/`small`/`medium`/`large`/`xlarge`), round/square shapes, 16dp recommended small padding, 48x48dp target area for extra-small/small buttons, and per-size icon sizes (20/20/24/32/40dp). **Corrected finding**: the verified `buttons/specs` token graph, re-checked directly against the `md.comp.button.text` color-token set (`md.comp.button.text.*`) in this pass, publishes no `selected`/`unselected` label/icon/container tokens at all for the text style, and the Button specs page explicitly documents toggle buttons as not using the text style. A prior reading of the illustrative `buttons/guidelines` page (which shows a "Text button" row) was over-read as toggle-capability evidence; the specs token graph is the authoritative source and it does not publish a text toggle color route. `color="text"` + `variant="toggle"` is therefore treated as an unsupported combination (see below), not a supported one. Per-size label typography is confirmed via `md.comp.button.<size>.label-text`: `xsmall`/`small`→label-large, `medium`→title-medium, `large`→headline-small, `xlarge`→headline-large.

Current state:

- public API uses `variant` (`default` | `toggle`) and `nativeType`; `variant="toggle"` exposes controlled `aria-pressed`; `selected` with `variant="default"` is ignored and warns in development; `variant="toggle"` with `color="text"` is **unsupported** — the verified Button specs publish no text toggle color route, so this combination normalizes the applied variant to `"default"` (no `aria-pressed`, `selected` ignored, no selected shape/classes) and logs a development warning; ordinary `color="text"` `variant="default"` is unaffected. `aria-pressed` and the selected container shape are orthogonal to `disabled` and persist through it — a disabled selected toggle button keeps its `aria-pressed` value and selected shape (previously the selected-shape selector incorrectly excluded disabled, reverting to the base shape);
- `--md-comp-button-*` component tokens are implemented for all five color styles and five sizes, with every retained token mechanically matching its official path segment-for-segment; sizes expose distinct `leading-space`/`trailing-space` tokens (not one token serving both sides), `icon-label-space`, `container-shape-round`/`container-shape-square`, `pressed-container-shape`, `selected-container-shape-round`/`selected-container-shape-square`, and `outlined-outline-width` (1/1/1/2/3dp for xsmall/small/medium/large/xlarge);
- label typography renders through the shared `MD_TYPESCALE` classes (`xsmall`/`small`→label-large, `medium`→title-medium, `large`→headline-small, `xlarge`→headline-large); `md.comp.button.<size>.label-text` is documented here as the composite official token this maps to, since no exact decomposed `--md-comp-*` path exists for it;
- text buttons use the same per-size leading/trailing-space tokens as every other color style — there is no fixed small-size padding override that bypasses the active size contract;
- all rendered button properties now resolve through component-local private variables (`--md-private-button-rendered-container-color`, `...label-color`, `...icon-color`, `...outline-color`, `...elevation`, `...state-layer-color`); there is no remaining parallel render path through `--md-container-color`, `--md-content-color`, or `--md-state-box-shadow`;
- label and icon remain separate public override points for resting, hovered, focused, pressed, disabled, and toggle selected/unselected states where the Material cache publishes distinct official token paths;
- selected toggle shape morphs per size via `--md-comp-button-<size>-selected-container-shape-{round,square}` (independently-sourced official tokens): a round shape becomes the size's square corner when selected, a square shape becomes fully rounded when selected, and the pressed shape always wins over the selected shape;
- `outlined` hover/focus/pressed/disabled outline color is the literal official `outline-variant`; the border does not darken further on hover, consistent with the spec's reliance on the state-layer tint for hover feedback;
- state-layer color is routed per component state through the generic `MDStateLayer` contract, while hover/focus/pressed opacity uses the shared style-level `--md-comp-button-<style>-{hovered,focused,pressed}-state-layer-opacity` tokens bridged into `--md-private-state-{hover,focus,pressed}-state-layer-opacity`; `MDStateLayer` itself remains generic and component-agnostic;
- disabled selected-toggle buttons explicitly exclude the selected-color selector so a higher-specificity toggle-selected rule cannot outrank `:disabled` — confirmed via a visual-regression screenshot diff for elevated/filled/tonal/outlined;
- uses `MDStateLayer`, ripple, and progress indicator; has focused unit tests (including `loading` `false`/`true`/`0`/positive and a real-click loading-activation contract asserting `click` still fires while loading, keeping the accessible name and enabled state), plus Storybook coverage;
- visual-lane browser coverage lives in `tests/e2e/visual/shared-ui/md-button.spec.ts`, which opens only `MDButton` stories; every story tagged `visual` has an explicit `toHaveScreenshot()` assertion. Manually reviewed galleries use visible fixture labels, and `SizeGeometryMatrix` visibly identifies both size rows and shape/state columns;
- a table-driven token-routing test covers all five color styles for hover/focus/pressed label, icon, state-layer color, state-layer opacity, and (where the style defines one) per-state elevation; every property is asserted against the exact literal the story fixture set for that property (each property uses an independent fixture value, so a routing bug that swapped two properties on the same fixture — such as reusing one literal for both icon and state-layer color — would be caught), not only that two rendered values differ from each other; a companion default-role test renders each style with no override and confirms the resting container/label/icon color resolves to its documented `--md-sys-color-*` role (`filled`→`primary`/`on-primary`, `tonal`→`secondary-container`/`on-secondary-container`, `outlined`/`text`→`on-surface-variant`/`primary`, `elevated`→`surface-container-low`/`primary`), plus a second default-role test confirming hover/focus/pressed state-layer opacity resolves to the documented `--md-sys-state-{hover,focus,pressed}-state-layer-opacity` role for all five styles — alignment is no longer evidenced only by custom override colors, and override routing is verified separately from default (no-override) role resolution;
- a compact table-driven selected/unselected toggle-routing fixture and test cover all four styles that publish distinct selected/unselected color tokens (`elevated`, `filled`, `tonal`, `outlined`), independently verifying resting container, resting label, resting icon, resting outline where published, hover/focus/pressed label and icon, state-layer color, opacity, and rendered state layer with distinct fixture literals per route and branch; a separate no-override matrix verifies selected/unselected Material role resolution for resting, hover, focus, and pressed; the unsupported `text` + `toggle` combination is verified separately for the normalization contract (no `aria-pressed`, no selected class/shape, dev warning) rather than as a supported selected/unselected route;
- disabled token routing corrected against the verified specs: `tonal` disabled container opacity is `0.1` (previously an incorrect `0.12`, matching the same bug `MDIconButton` had); `outlined` selected-disabled implements `md.comp.button.outlined.selected.disabled.container.{color,opacity}` (`on-surface` at `0.1`, container preserved as selected shape) while unselected-disabled stays transparent with the published `outline-variant` outline; `text` implements `md.comp.button.text.disabled.container.{color,opacity}` (`on-surface` at `0.1`, previously fully transparent) alongside the existing `on-surface`-at-0.38 label/icon route; no unpublished selected-disabled outline token was invented — disabled outline/label/icon fall through to the shared base outlined-disabled route for both selected and unselected, matching the spec, which publishes only one such route;
- `filled`/`elevated`/`tonal` declare `md.comp.button.<style>.container.shadow-color` and route it into the shared `--md-private-elevation-shadow-color` elevation bridge (aliases the existing `--md-sys-color-shadow` default; adds an explicit override point, no visual change by default); each of the five sizes declares `md.comp.button.<size>.pressed.container.corner-size.motion.spring.{stiffness,damping}` mapped to new `--md-sys-motion-spring-fast-spatial-{stiffness,damping}` system tokens (`800`/`0.6`), with the actual shape-morph and elevation transitions using the private Web-conversion duration/easing documented under Motion in the Icon buttons section below (shared across the family);
- `MDStateLayer` paints its hover/focused/pressed/dragged tint from props, driven in production by real pointer/keyboard interaction; a Storybook fixture that only adds a host `md-state_hover`/`md-state_focused`/`md-state_pressed` class changes MDButton's own component-owned token routing (which does key off that host class for label, icon, outline, elevation, and the `--md-private-state-layer-color` contract variable) but does not change the nested `MDStateLayer`'s props, so the visible tint would not actually render. Every Button-family forced-state Storybook fixture (interaction-state, toggle-interaction, token-routing, and disabled-precedence stories) therefore wraps the affected component in the test-only `MDStateLayerForcedStateProvider` (`src/shared/ui/State/testing`) in addition to the host class: the host class keeps driving MDButton's own routing, and the provider forces the nested `MDStateLayer` to actually paint that state. Routing tests verify both boundaries for every such fixture: the exact literal in the `--md-private-state-layer-color` contract variable `MDButton` routes into, and the actual computed `.md-state-layer` background color (including alpha, derived from the configured state-layer opacity) that the nested layer renders. Disabled forced-state fixtures use the same provider-plus-host-class pairing and are verified to keep a fully transparent rendered state-layer background even with hover/focus/pressed forced;
- rendered typography class/computed metrics, selected-shape, text spacing, exact per-size geometry (container height, icon size, leading/trailing space, icon-label gap, outlined outline width, round/square/pressed/selected-round/selected-square corner radii — round and selected-square use the `corner-full` token, a deliberately oversized `cqmin` value with no established CSS query container anywhere in the app, so those two are asserted as "large enough to guarantee the browser's automatic pill clamp" rather than a fixed px literal), and disabled-precedence (compared against the exact documented disabled tokens — transparent container, `on-surface` label/icon at 0.38 opacity, undimmed `outline-variant` outline for the outlined fixture — not only against another rendered fixture) remain covered by non-screenshot browser assertions in the same spec;
- pressed shape precedence over selected shape is browser-verified: a selected + pressed toggle button renders the plain pressed-shape radius, not the selected-shape radius;
- every Button-family Storybook demonstration exposes its rendered surface against the canonical `.visual-checker-backdrop` checkerboard. Screenshot galleries are self-describing from visible fixture headings/captions; icon-only controls use external visible labels rather than relying on invisible tooltip, accessible-name, test-ID, or source-order text;
- real keyboard focus now lives in the Storybook-behavior lane (`tests/e2e/storybook/md-button-family.spec.ts`, registered in `scripts/lib/storybookBehaviorRisk.mjs`, whose Button-family scenario source-maps the whole `src/shared/ui/Button/` directory plus `useFocusIndicator.ts` and `md-focus-indicator.css`), not the visual lane: a `FocusIndicatorTarget` story, repositioned near a viewport corner so clipping is actually detectable, is reached via real `Tab`; the test confirms actual `:focus-visible`, that the shared global focus indicator becomes visible, that its x/y/width/height directly match the focused button (within a small documented pixel tolerance, polled until the CSS position transition settles) and that its border-radius matches, and that it is not clipped once the indicator's visible outline (`thickness + offset`) extent is included in the viewport-bounds check; expanded hit-target activation for `MDButton` (a real pointer click outside the visible button box) also lives in this lane.

Remaining gaps and unsupported scope:

- loading remains a documented project extension, not an official Material token or state;
- component-level focus-indicator tokens do not exist in the current (non-deprecated) cache namespace; the shared global focus-indicator default is reused unchanged and is now browser-verified against real keyboard focus rather than only visual similarity;
- Split Button, Standard Button Group, and Connected Button Group are official Material button-family surfaces with no confirmed Mioframe usage and are not implemented.

Verdict: `partial`. The supported public API, geometry, state colors, disabled routing, `--md-comp-button-*` component-token layer, accessibility, Storybook coverage, and core browser verification described above (five color styles, five sizes, `round`/`square` shapes, `default`/`toggle` variants, resting/hover/focus/pressed/disabled states, toggle selected/unselected states including combined states, shape precedence, disabled precedence, and exact per-size geometry) are implemented, with every supported color style and state route verified through exact expected-value browser assertions. No known user-flow or architecture blocker remains in the current implementation. Remaining work is Expressive motion ownership and verification completeness — see [Remaining Button-family alignment work](#remaining-button-family-alignment-work). `partial` means the component is safe to use but must not yet be claimed as fully verified Material 3 Expressive alignment; unsupported official configurations are listed above.

## Icon buttons: `MDIconButton`

Material cache confirms `default`/`toggle` variants, filled/tonal/outlined/standard colors, size/width/shape configurations, tooltip on web, and outlined-to-filled icon treatment for toggle state. **Corrected finding**: `md.comp.icon-button` publishes `filled` as the default color style; the prior implementation defaulted to `standard`, which is not the documented default.

Current state:

- public API uses `variant` (`default` | `toggle`) and `nativeType`; `variant="toggle"` exposes controlled `aria-pressed`; `selected` with `variant="default"` is ignored and warns in development; **`color` now defaults to `"filled"`**, the official documented default (previously `"standard"`). Every in-repository consumer that relied on the implicit `standard` default was migrated to explicit `color="standard"` in the same change so no product surface's rendered appearance changed; this is a one-time consumer migration, not a compatibility alias. `aria-pressed` and the selected container shape are orthogonal to `disabled` and persist through it;
- the selected built-in `MDSymbol` fill (`--md-symbol-fill: 1`) now routes independently of `disabled` for all four color styles: previously the disabled block unconditionally reset the fill to `0`, and the selected-fill override itself excluded disabled, so a disabled selected toggle icon button lost its filled-symbol treatment. Fill now applies purely from selected/unselected state; colors remain gated to the enabled state as before. This automatic fill only applies to the built-in `MDSymbol` fallback rendered from `mdSymbolName`; a custom `#icon` slot is consumer-owned and must manage its own selected-state treatment (documented in the slot TSDoc);
- disabled token routing corrected against the verified specs: `tonal` disabled container opacity is `0.1` (previously an incorrect `0.12`); `outlined` selected-disabled implements `md.comp.icon-button.outlined.selected.disabled.container.{color,opacity}` (`on-surface` at `0.1`, selected shape and selected symbol fill preserved) while unselected-disabled stays transparent with the published `outline-variant` outline and `on-surface`-at-0.38 icon; no unpublished selected-disabled outline token was invented — the disabled outline/icon fall through to the shared base outlined-disabled route, the same value the spec publishes for both selected and unselected;
- `--md-comp-icon-button-*` component tokens are implemented for all four color styles and all five sizes/widths/shapes, with every retained token mechanically matching its official path; sizes expose distinct `default`/`narrow`/`wide` `leading-space` and `trailing-space` tokens, `container-shape-round`/`container-shape-square`, `pressed-container-shape`, independently-sourced `selected-container-shape-round`/`selected-container-shape-square` tokens, and `outlined-outline-width` per size (1/1/1/2/3dp for xsmall/small/medium/large/xlarge);
- the 48dp minimum touch target is a private `--md-private-icon-button-target-size` implementation variable, since no official component-token path exists for it;
- `outlined` base/unselected/disabled outline color is the literal official `outline-variant`; `filled` toggle unselected container is the official `surface-container`; `filled` toggle unselected/selected icon color is `on-surface-variant`/`on-primary`; `tonal` toggle unselected/selected container and icon color is `secondary-container`/`on-secondary-container` (unselected) and `secondary`/`on-secondary` (selected);
- all rendered icon-button properties now resolve through component-local private variables for container, icon, outline, and state-layer; the previous invented generic disabled `--md-comp-*` aliases were removed in favor of exact style-specific official token paths;
- state-layer color and opacity are mapped through the generic `--md-private-state-layer-color` plus `--md-private-state-{hover,focus,pressed}-state-layer-opacity` contract for all four color styles, base/unselected/selected, while outlined buttons keep one official `--md-comp-icon-button-outlined-outline-color` token across hover, focus, and pressed;
- disabled selected-toggle icon buttons explicitly exclude the selected-color selector, fixing the same cascade-specificity issue as `MDButton` — confirmed via a visual-regression screenshot diff across all four color styles; a disabled-precedence browser test (outlined fixture, forced hover/focus/pressed) compares against the exact documented disabled tokens (transparent container, `on-surface` icon at 0.38 opacity, undimmed `outline-variant` outline), not only against another rendered fixture;
- has toggle/warning unit tests (including `loading` `false`/`true`/`0`/positive and a real-click loading-activation contract asserting `click` still fires while loading, keeping the accessible name and enabled state);
- visual-lane browser coverage lives in `tests/e2e/visual/shared-ui/md-icon-button.spec.ts` (moved from the former `shared-ui.spec.ts` monolith): every story tagged `visual` has an explicit `toHaveScreenshot()` assertion, including the `Geometry` matrix and the toggle-interaction matrix, which previously carried the `visual` tag with no screenshot; the interaction-states screenshot now shows hover/focus/pressed for all four color styles (standard/filled/tonal/outlined), not a representative subset;
- a `Geometry` story and browser assertions cover `width` (`narrow`/`default`/`wide`) padding differences and pressed-shape precedence over selected shape (a selected + pressed toggle icon button renders the plain pressed-shape radius, not the selected-shape radius); this closed a confirmed cascade-specificity bug across all five sizes where the selected-shape selector (`.md-icon-button_shape-{round,square}.md-icon-button_selected`, specificity 0,4,0) outranked the pressed-shape selector (`.md-state_pressed`, specificity 0,3,0), so a selected + pressed icon button always rendered the selected shape instead of the pressed shape; the fix changes the selected-shape selector to `:not(.md-state_pressed)` only (previously it also excluded `.md-state_disabled`/`:disabled`, which additionally caused the selected shape to be incorrectly dropped while disabled — now fixed at the same time), mirroring the pattern `MDButton` already uses; a separate `SizeGeometryMatrix` story and browser assertion cover exact per-size container height/width, icon size, narrow/default/wide leading/trailing space, outlined outline width, and square/pressed/selected-round corner radii for all five sizes (round default shape and selected-square use the `corner-full` token, asserted as "large enough to guarantee the browser's automatic pill clamp" for the same reason documented under `MDButton`, rather than a fixed px literal), replacing the previous `narrow < default < wide` / `round > square` inequality-only check;
- each of the five sizes declares `md.comp.icon-button.<size>.pressed.container.corner-size.motion.spring.{stiffness,damping}` mapped to the shared `--md-sys-motion-spring-fast-spatial-{stiffness,damping}` system tokens. **Motion**: the family adds Material 3 Expressive Web-conversion transitions in place of the previous single flat `--md-sys-motion-duration-short4` transition — `border-radius` shape morphs and `MDButton`/FAB/Extended-FAB `box-shadow` elevation changes use the fast-spatial pair (`--md-private-motion-expressive-fast-spatial-{duration,easing}`, 350ms, `cubic-bezier(0.42, 1.67, 0.21, 0.9)`); `color`/`background-color`/`border-color`/icon/label opacity and the state-layer background use the fast-effects pair (150ms, `cubic-bezier(0.31, 0.94, 0.34, 1)`). Both pairs are private (`--md-private-*`) fixed Web conversions of the official spring stiffness/damping tokens, not invented public `--md-sys-*` duration/easing tokens and not a dynamic regeneration of the curve from the numeric spring values (CSS transitions cannot derive a curve from stiffness/damping at runtime). `MDStateLayer` itself still reads only its own generic `--md-private-state-layer-transition-{duration,easing}` contract (with the legacy `short4`/`ease` values as its default fallback); the Button family maps its own fast-effects tokens onto that contract locally, and every other `MDStateLayer` consumer keeps the legacy fallback unless explicitly mapped;
- exact custom-override routing and default no-override role resolution are separate table-driven checks. The default selected/unselected checks cover resting, hover, focus, and pressed for every style and branch, including resting container/icon/outline and interaction icon, state-layer color/opacity, and rendered state-layer background; outlined selected border mirroring is asserted at rest. The custom toggle matrix independently asserts resting icon plus hover/focus/pressed icon, state-layer color, opacity, and rendered tint for all four styles × selected/unselected branches, with independent literals so swapping state routes fails;
- a compact table-driven selected/unselected toggle-routing fixture and test cover all four supported styles (`standard`, `filled`, `tonal`, `outlined`), independently verifying container (where published), icon, state-layer color, state-layer opacity, and outline (`outlined` only); `filled` and `tonal` selected/unselected paths are verified independently rather than only through `outlined` container/outline and `standard` pressed icon/state-layer, as previously; `outlined`'s selected branch intentionally omits an outline assertion because `MDIconButton.vue` routes its outline to mirror the selected container color rather than publishing a distinct selected-outline token — this is documented as the actual production routing, not an invented token; the existing real-pointer selected-plus-pressed shape precedence test is unchanged;
- has visibly labeled target-area, toolbar, geometry, state, and toggle galleries plus behavior coverage (real click ownership near adjacent boundaries and real hover handoff between adjacent toolbar buttons). Loading color/name/geometry assertions live in `md-icon-button.spec.ts`, not another family's spec;
- real keyboard focus now lives in the Storybook-behavior lane (`tests/e2e/storybook/md-button-family.spec.ts`, registered in `scripts/lib/storybookBehaviorRisk.mjs`, whose Button-family scenario source-maps the whole `src/shared/ui/Button/` directory plus `useFocusIndicator.ts` and `md-focus-indicator.css`), not the visual lane: a `FocusIndicatorTarget` story, repositioned near a viewport corner so clipping is actually detectable, is reached via real `Tab`; the test confirms actual `:focus-visible`, that the shared global focus indicator becomes visible, that its x/y/width/height directly match the focused button (within a small documented pixel tolerance, polled until the CSS position transition settles) and that its border-radius matches, and that it is not clipped once the indicator's visible outline (`thickness + offset`) extent is included in the viewport-bounds check;
- a dedicated real-`mousedown` browser test (not the synthetic `.md-state_pressed` class used elsewhere) confirmed the selected+pressed shape precedence above holds under an actual native press, not only a forced class — `MDIconButton`'s selected-shape selector guards against `.md-state_pressed` only (no native `:active`, unlike `MDButton`'s equivalent selector), and this was verified to have no observable effect since the reactive class is always present during a real press; documented as an intentional, verified-equivalent implementation difference rather than a defect (no production change made).

Remaining gaps and unsupported scope:

- loading and rich tooltip content remain documented project extensions, not official Material tokens or states;
- component-level focus-indicator tokens exist only under deprecated legacy component names in the cache, not the current namespace; the shared global default is reused unchanged and is now browser-verified against real keyboard focus rather than only visual similarity;
- Split Button and Standard/Connected Button Group compositions that use icon buttons as constituent parts have no confirmed Mioframe usage and are not implemented.

Verdict: `partial`. The supported public API, geometry, state colors, disabled routing, `--md-comp-icon-button-*` component-token layer, accessibility, Storybook coverage, and core browser verification described above (four color styles, five sizes, `narrow`/`default`/`wide` widths, `round`/`square` shapes, `default`/`toggle` variants, resting/hover/focus/pressed/disabled states, toggle selected/unselected states including combined states, shape precedence, outline routing, disabled precedence, expanded target geometry, and exact per-size/per-width geometry) are implemented, with every supported color style and state route verified through exact expected-value browser assertions. No known user-flow or architecture blocker remains in the current implementation. Remaining work is Expressive motion ownership and verification completeness — see [Remaining Button-family alignment work](#remaining-button-family-alignment-work). `partial` means the component is safe to use but must not yet be claimed as fully verified Material 3 Expressive alignment; unsupported official configurations are listed above.

## FAB: `MDFab`, `MDExtendedFab`, `FabContainer`

Material cache confirms FAB, medium FAB, and large FAB (small FAB not recommended); Extended FAB small/medium/large (baseline not recommended); surface FABs not recommended. It confirms the M3 Expressive color model directly: the historical container-role `primary`/`secondary`/`tertiary` styles were renamed to `primary-container`/`secondary-container`/`tertiary-container`, and new plain `primary`/`secondary`/`tertiary` styles (using the non-container sys color) were added alongside them — six color styles total for both FAB and Extended FAB.

Current state:

- `MDFab` and `MDExtendedFab` `color` use the current six official names; `primary-container` is the default for both;
- `MDFab` requires an icon via `mdSymbol` or the `icon` slot; a missing icon warns in development and renders no fallback placeholder; `size` defaults to `regular`;
- `--md-comp-fab-*` and `--md-comp-extended-fab-*` component tokens are implemented for all six color styles and all sizes, using the confirmed current non-deprecated `hovered`/`focused`/`pressed` token paths for state-layer color, state-layer opacity, container elevation, and icon/label color — including the three `-container` styles, which the MCP token graph confirms have full, non-ambiguous state coverage;
- the cache also contains contradictory duplicate legacy `hover`/`focus` rows for the three plain styles that alias a different, lower-emphasis color role; those legacy rows are not used;
- all rendered FAB properties now resolve through component-local private variables: `MDFab` uses local container/icon/elevation/state-layer routes, and `MDExtendedFab` uses local container/label/icon/elevation/state-layer routes with independent label and icon override points;
- `MDExtendedFab` label typography renders through the shared `MD_TYPESCALE` classes (`small`→title-medium, `medium`→title-large, `large`→headline-small) instead of handwritten font CSS; `MDExtendedFab`'s icon-label gap follows size via `--md-comp-extended-fab-{small,medium,large}-icon-label-space` (8dp/12dp/16dp);
- `MDFab` now exposes independent `md.comp.fab.{,medium-,large-}container-{width,height}` component tokens routed through separate `--md-private-fab-container-{width,height}` rendered variables (56/80/96dp for both dimensions at every size — previously a single `--md-fab-container-size` drove both `width` and `height`, so an override of one implicitly overrode the other); default rendered geometry is unchanged. `MDExtendedFab` now exposes independent `md.comp.extended-fab.{,medium-,large-}{leading,trailing}-space` component tokens routed through separate `--md-private-extended-fab-{leading,trailing}-space` rendered variables applied via `padding-inline` (previously one `--md-fab-horizontal-padding` value served both sides); default rendered geometry is unchanged;
- all six color styles for both components declare `md.comp.{fab,extended-fab}.<style>.container.shadow-color` and route it into the shared `--md-private-elevation-shadow-color` bridge (aliases the existing `--md-sys-color-shadow` default; no visual change by default, adds an explicit override point); browser tests confirm the default resolves to `--md-sys-color-shadow` and that a component-token override propagates through to the bridge variable. The final `rgb(from var(--md-private-elevation-shadow-color) ...)` used inside `box-shadow` was empirically confirmed to correctly source its color from markup-time (Vue-rendered) inline-style overrides, matching every other token-routing test in this suite; a runtime (post-mount, JS-driven) mutation of the component token did not visibly re-resolve `box-shadow`'s color channel in this browser engine during verification, so the browser assertion targets the documented bridge variable rather than the final shadow pixels for that specific mutation path — a test-methodology note, not a known production defect;
- the plain `primary`/`secondary`/`tertiary` styles for both components declare `focus.indicator.{color,thickness,outline.offset}` component tokens and route them into the generic `--md-focus-indicator-{color,thickness,offset}` contract that `md-focus-indicator.css` already reads (all three resolve to the shared global default's existing values — `secondary`, sys thickness/offset — so no visual change; adds an explicit component-token override point, verified for one plain style per component plus default-role coverage for all three); the three `-container` styles still have no distinct published tokens and keep the shared global default without a component override, per the documented gap below;
- `FabContainer` (renamed from `MDFabContainer`, no compatibility alias) remains project-specific placement infrastructure under `Project UI/Buttons/FabContainer`; it is not an official Material component and owns no FAB visual tokens;
- visual-lane browser coverage lives in `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`, including owner-local loading checks. Visible gallery text identifies all six colors, interaction states, sizes, icon/label configurations, and loading cases; icon-only `MDFab` galleries use external fixture labels. `MDFab` size and `MDExtendedFab` interaction galleries retain exact geometry assertions;
- both components keep exact custom-override routing separate from default no-override role resolution. Across all six colors, browser tests verify resting container/icon (and Extended FAB label), hover/focus/pressed label/icon, state-layer color/opacity and rendered tint, plus resting and interaction elevation. Expectations resolve through browser-visible `--md-sys-*` roles rather than a copied production token table;
- every Button-family Storybook demonstration exposes its rendered surface against the canonical `.visual-checker-backdrop` checkerboard;
- a shared loading-contract test confirms `MDFab` and `MDExtendedFab` (alongside `MDButton`/`MDIconButton`) keep their accessible name and outer bounding-box dimensions stable between resting and `loading=true`, and remain enabled during loading (loading alone does not disable activation; only an explicit `disabled` prop would, and neither component exposes one); a unit test on each of the four button-family components additionally activates a `loading=true` control via a real click, asserting the `click` emit count changes exactly once per click and the accessible name/enabled state are unchanged, proving loading does not silently block activation (not just that the control reports as enabled);
- real keyboard focus now lives in the Storybook-behavior lane (`tests/e2e/storybook/md-button-family.spec.ts`, registered in `scripts/lib/storybookBehaviorRisk.mjs`, whose Button-family scenario source-maps the whole `src/shared/ui/Button/` directory plus `useFocusIndicator.ts` and `md-focus-indicator.css`), not the visual lane, for both `MDFab` and `MDExtendedFab`: a `FocusIndicatorTarget` story, repositioned near a viewport corner so clipping is actually detectable, is reached via real `Tab`; the test confirms actual `:focus-visible`, that the shared global focus indicator becomes visible, that its x/y/width/height directly match the focused button (within a small documented pixel tolerance, polled until the CSS position transition settles) and that its border-radius matches, and that it is not clipped once the indicator's visible outline (`thickness + offset`) extent is included in the viewport-bounds check.

Remaining gaps and unsupported scope:

- component-level focus-indicator tokens resolve to the secondary role for the three plain styles and do not exist at all for the three `-container` styles in the cache; the shared global default is reused for all six styles without a component override, and is now browser-verified against real keyboard focus rather than only visual similarity;
- loading remains a documented project extension, not an official Material token or state;
- FAB disabled state, FAB Menu, legacy Small FAB, and lowered/surface FAB variants are official or previously-documented Material configurations with no confirmed Mioframe usage and are not implemented; `MDFab`/`MDExtendedFab` intentionally expose no `disabled` prop.

Verdict: `partial` for `MDFab` and `MDExtendedFab`. The supported public API, geometry, state colors, disabled routing (no `disabled` prop, by design), `--md-comp-fab-*`/`--md-comp-extended-fab-*` component-token layer, accessibility, Storybook coverage, and core browser verification described above (`MDFab`: six colors, `regular`/`medium`/`large` sizes, required-icon contract, resting/hover/focus/pressed states; `MDExtendedFab`: the same six colors, `small`/`medium`/`large` sizes, resting/hover/focus/pressed states, independent label/icon routing, size-specific typography and icon-label spacing) are implemented, with every supported color verified through exact expected-value browser assertions. No known user-flow or architecture blocker remains in the current implementation. Remaining work is Expressive motion ownership and verification completeness — see [Remaining Button-family alignment work](#remaining-button-family-alignment-work). `partial` means both components are safe to use but must not yet be claimed as fully verified Material 3 Expressive alignment. `FabContainer` remains `project-specific` and is unaffected by this verdict; unsupported official configurations are listed above.

## Remaining Button-family alignment work

This section tracks the follow-up work that keeps `MDButton`, `MDIconButton`, `MDFab`, and `MDExtendedFab` at `partial` rather than `aligned`. Each stage is independently implementable and none blocks the others.

### Stage 1 — Content motion ownership

Scope: `MDButton`, `MDIconButton`, `MDFab`, `MDExtendedFab`; focused motion verification only.

Current gap: root controls expose Expressive color transitions, but rendered label/icon colors are owned by child elements, and those child elements do not yet consistently consume the fast-effects color transition. Current motion assertions inspect root controls rather than every actual property owner.

Expected future result: the `color` transition is applied to the real label/icon elements; root transitions remain only for properties the root owns; duration and easing are asserted on the owning elements. No public API, token routing, state routing, or screenshot matrix redesign is required.

Classification: user-visible polish; not a current functional blocker.

### Stage 2 — Disabled selected forced-state shape precedence

Scope: `MDButton`, `MDIconButton`; selected/pressed/disabled shape selectors and focused browser checks only.

Current gap: in an artificial fixture combining selected, disabled, and forced pressed state, the selected shape may fall back to the base shape. Native disabled controls cannot enter a real pressed interaction, so this is not a reachable user-flow failure — it remains an incomplete state-composition contract.

Expected future result: selected enabled → selected shape; selected enabled + pressed → pressed shape; selected disabled → selected shape; selected disabled + forced pressed → selected shape.

Classification: contract edge case; not a current production interaction blocker.

### Stage 3 — Override verification completion

Scope: browser tests only, unless a test exposes a concrete production defect.

Current gaps: shadow-color tests verify the private elevation bridge but do not consistently assert the final computed shadow; FAB focus-indicator verification does not yet cover both FAB components, all published properties, and all three plain color styles; some motion tests verify transition declarations on root elements rather than actual property owners.

Expected future result: the official shadow token override reaches both the private bridge and the rendered `box-shadow`; `MDFab` and `MDExtendedFab` verify focus-indicator color, thickness, and offset for `primary`, `secondary`, and `tertiary`; motion assertions inspect the real owning elements. Production code changes only when an exact test proves a routing defect.

Classification: verification completeness; no known current rendered-token defect.

### Future alignment gate

The family can return from `partial` to `aligned` only after:

1. Stage 1 is implemented and verified.
2. Stage 2 is implemented and verified.
3. Stage 3 is complete.
4. Full `pnpm verify` passes.
5. Documentation is rechecked against the same Material snapshot or a newer verified snapshot.
6. Unsupported surfaces and project extensions remain explicitly documented.

Implementing Split Button, Standard Button Group, Connected Button Group, FAB Menu, lowered/surface FAB, legacy Small FAB, JavaScript spring physics, or automatic selected treatment for arbitrary custom icon slot content is not required for this gate. These remain unsupported or outside the current public subset and do not block eventual alignment of the documented subset.

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
