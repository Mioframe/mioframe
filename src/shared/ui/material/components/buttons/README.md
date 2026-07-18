# Buttons

## Official documentation mapping

- Official family: Buttons — common buttons and toggle buttons.
- Official path: `m3.material.io/components/buttons`.
- Pages used: `overview.md`, `guidelines.md`, `accessibility.md` — inspected through the `material3` MCP local documentation cache (`m3.material.io` source, cache captured `2026-06-30T05:53:04.916Z`, per-page `capturedAt: 2026-06-30T05:48:50.423Z`). `specs.md` was cross-verified through the same cache's structured component token-table graph (numeric sizes, paddings, icon sizes, shapes, and elevation/motion token names). Direct checks of all four current published routes on `2026-07-18` reached only the JavaScript shell, so they could not refresh the cached contract evidence.
- Superseded prior fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z` — recorded for history; the MCP cache above is now the current source of record and the two are consistent.
- Family boundary: `m3.material.io/components/split-button` (Split buttons), `m3.material.io/components/button-groups` (Standard/Connected button group), `m3.material.io/components/icon-buttons` (Icon/toggle icon buttons), `m3.material.io/components/segmented-buttons` (deprecated in M3 Expressive, superseded by connected button group), and the FAB/Extended FAB families are each a separate official top-level component family with its own `overview`/`specs`/`guidelines`/`accessibility` pages and its own canonical `components/<official-docs-slug>` directory. They are not part of the Buttons family capability inventory; see "Outside this family boundary" below.
- Canonical source status: `snapshot-complete-stale`.
- Official capability inventory: `snapshot-complete (material3 cache captured 2026-06-30T05:53:04.916Z; currentness unverified)` — every capability documented in that snapshot, including capability with no current Mioframe consumer, is classified below.
- Official coverage: `partial` — the rapid-click motion-curve accessibility guidance (see "Not implemented") is not yet implemented.

## Implemented

- Public component: `MDButton`.
- Styles: elevated, filled, tonal, outlined, and text.
- Sizes: extra-small, small, medium, large, and extra-large.
- Shapes: round and square, including the official pressed-shape and selected-shape corner morph per size.
- Variants: default actions and controlled toggle buttons.
- Optional leading icon (icon precedes the label; the family publishes no trailing-icon route).
- Native `<button>` semantics, button type, disabled behavior, accessible name matching the visible label, keyboard activation (native `Tab`/`Space`/`Enter`), `aria-pressed` for toggle state, and `aria-busy` for loading.
- State layer, ripple, focus indication, public component-token routing, canonical stories, and colocated contract tests.
- Loading extension with boolean or clamped numeric progress; a numeric value that clamps to `0` renders the same indeterminate visual as `true` (see "Extensions and deviations").
- Canonical root export through `@shared/ui/material`.
- Direct repository consumers migrated from the legacy MDButton export.

## Not implemented

Current confirmed absent official capability, independent of current consumer demand:

- Text-style toggle buttons: the verified token graph contains no supported text-toggle color route; this combination normalizes to the default variant with a development warning.
- Rapid-click modified motion curve: the official accessibility guidance recommends a modified motion curve for the pressed-shape morph to avoid resonant effects when a button receives rapid repeated clicks/taps. `MDButton` has no such adjustment today; every press replays the same fast-spatial adaptation regardless of click cadence.

### Outside this family boundary

Confirmed separate official Material families, each with its own documentation path and (where built) its own canonical `components/<official-docs-slug>` directory — not part of the Buttons capability inventory:

- Split Button (`components/split-button`) — not implemented anywhere in the repository.
- Standard Button Group and Connected Button Group (`components/button-groups`) — not implemented anywhere in the repository.
- Icon Button and Toggle Icon Button (`components/icon-buttons`) — implemented at the legacy `src/shared/ui/Button/MDIconButton.vue`, outside the canonical Material root.
- Segmented Button (`components/segmented-buttons`, deprecated by Material in favor of the connected button group) — implemented at the legacy `src/shared/ui/Button/MDSegmentedButtons.vue`.
- FAB and Extended FAB — implemented at the legacy `src/shared/ui/Button/MDFab.vue` and `MDExtendedFab.vue`.

## Known issues and required follow-up

- **Rapid-click motion curve (open):** see "Not implemented" above. No current consumer requires it; documented here so it is not silently missing from the inventory.
- **Motion (resolved):** the per-size `pressed-container-corner-size-motion-spring-{stiffness,damping}` component tokens all alias the same system-level fast-spatial spring for every size. CSS transitions cannot consume spring physics directly, so these are documented as source evidence in one place (a single comment beside the root `--md-private-button-corner-motion-duration`/`-easing` declarations in `MDButton.vue`) instead of being declared as five duplicated, unconsumed per-size CSS custom properties. The border-radius transition is wired to the project's one honest Web adaptation (the pre-existing shared expressive fast-spatial duration/easing), and no test asserts spring consumption that does not exist.
- **Elevation (resolved for Button; cross-family evidence gap remains):** this Button work changed the shared elevation contract in `src/shared/lib/md/tokens.css` so `--md-sys-elevation-level0..5` are declared on `*, ::before, ::after`; an element-local `--md-private-elevation-shadow-color` override can therefore recompute the final `box-shadow` instead of inheriting an already-resolved value. `MDButton` has focused browser proof for that route. `MDCard`, `MDFab`, `MDExtendedFab`, and `MDSwitch` also set the local shadow-color input, but their existing tests and stories do not directly exercise a non-default shadow-color override, so representative cross-family proof remains a low-risk foundation evidence gap. Narrowing the universal owner or adding representative cross-family proof belongs to a focused `material-foundation` change, not a Button-local workaround.
- **Loading at zero (resolved):** numeric loading value `0` (and any numeric input that clamps to `0`) is now documented and tested to render the same indeterminate visual as `loading={true}`, rather than a fake determinate `0` ring. `MDCircularProgressIndicator` has no distinct static zero-fill ring, so treating a clamped-to-zero value as indeterminate is the coherent behavior; see "Extensions and deviations".
- **Documentation consistency (resolved):** all four family pages are represented in the `material3` MCP snapshot above and the Storybook documentation cites the same source. Currentness remains unverified because direct published-route checks exposed only the JavaScript shell.
- **Visual review:** operator comparison may proceed; the motion, elevation, and loading-zero findings above are resolved. The rapid-click motion-curve gap remains unimplemented and open.

## Public API and semantics

`MDButton` exposes:

- `nativeType`;
- `color`;
- `label`;
- `disabled`;
- `loading`;
- `variant`;
- `size`;
- `shape`;
- controlled `selected`;
- optional `icon` slot;
- native click event forwarding.

Invalid combinations and out-of-range loading values are normalized with development warnings.

## Tokens, states, and property ownership

- The button root owns container geometry, border, background, elevation, and shape transitions.
- Label and icon descendants own their rendered color and opacity.
- State resolution maps hover, focus, pressed, selected, disabled, and loading output to final properties.
- Public token support is valid only when an override reaches the final rendered property.
- Official pressed-shape spring values (stiffness/damping) are documented source evidence only, recorded once as a comment beside the root corner-motion duration/easing declarations; they are not declared as per-size CSS custom properties because CSS transitions cannot consume them as a real dependency.
- Elevation shadow-color routing consumes the shared `--md-private-elevation-shadow-color` / `--md-sys-elevation-level*` foundation contract (see "Foundations and styles used"); Button does not declare its own universal-selector recomputation.

## Foundations and styles used

- Color and current theme roles: legacy owner `src/shared/lib/md/tokens.css`; future official navigation owner `material/styles/color`.
- Elevation: legacy owner `src/shared/lib/md/tokens.css`, including the shared `*, ::before, ::after` recomputation of `--md-sys-elevation-level0..5` against each element's local `--md-private-elevation-shadow-color`; this pre-existing contract is also consumed by `MDCard`, `MDFab`, `MDExtendedFab`, and `MDSwitch`. Future official navigation owner `material/styles/elevation`.
- Motion: legacy token owner `src/shared/lib/md/tokens.css` (shared expressive fast-spatial duration/easing adaptation); future `material/styles/motion`.
- Typography: `@shared/lib/md`; future `material/styles/typography`.
- State layer, ripple, and focus: `src/shared/ui/State`; future `material/foundations/interaction`.
- Progress indicator: current shared progress-indicator owner (`src/shared/ui/ProgressIndicators`) for the loading extension.

## Extensions and deviations

- `loading` is a Mioframe extension, not part of the official Button component contract. A numeric value that clamps to `0` renders the same indeterminate visual as `loading={true}`, since the shared `MDCircularProgressIndicator` has no distinct static zero-fill ring; this is a deliberate, tested behavior, not an open defect.
- Unsupported text-toggle usage normalizes to a default action rather than exposing an invalid token route.

## Consumers and migration state

- Canonical path: `src/shared/ui/material/components/buttons`.
- Public export: `MDButton` from `@shared/ui/material`.
- The legacy MDButton implementation and export are removed.
- Direct consumers are migrated.
- Physical ownership migration is complete. The official capability inventory is complete; official coverage remains partial while the rapid-click motion-curve gap above is open.

## Verification

- `MDButton.test.ts` — public API, semantics, invalid combinations, state and loading contracts, including the loading-zero-is-indeterminate behavior.
- `MDButton.stories.ts` — canonical visual configurations and states.
- Focused browser/visual coverage exists for token routes, geometry, accessibility, and final computed shadow behavior.
- No test asserts spring-token consumption; the motion contract is documented as evidence only (see "Known issues" and "Tokens, states, and property ownership").
- Local verification rerun after this pass; see the task result for status.

## Review status

Review required after changes.
