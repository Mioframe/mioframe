# Buttons implementation audit

Reviewed: 2026-07-18
Result: non-compliant
Canonical source status: snapshot-complete-stale
Official capability inventory: snapshot-complete (material3 MCP cache captured 2026-06-30T05:53:04.916Z; currentness unverified)
Official coverage: unresolved
Project implementation documentation: README.md
Visual review: rejected

## Evidence

### Implementation evidence read directly for this review

- `MDButton.vue` (full 1717 lines: script, template, and every color/size/state CSS branch).
- `MDButton.test.ts`, `MDButton.stories.ts` (story/tag inventory), `MDButtonTargetHitVisualStory.vue`, `MDButtonOverrideContractVisualStory.vue`, `index.ts`.
- `tests/e2e/visual/shared-ui/md-button.spec.ts` (full 1491 lines) and `tests/e2e/storybook/md-button-family.spec.ts` (full 354 lines).
- Shared state primitives consumed by MDButton: `src/shared/ui/State/useStateLayer.ts`, `usePressed.ts`, `useRipple.ts`, `MDStateLayer.vue`, `README.md`.
- Global CSS reset `src/shared/lib/md/index.css` (the `.md` base class and its `* { transition-duration }` rule).
- `src/app/MainApp.vue` and `.storybook/preview.ts` (checked for a global `.md`-classed ancestor; none exists).
- Consumer inventory: every non-family importer of `MDButton` (`grep` across `src`), confirming import path.
- Latest local verification logs: `.verify/logs/visual.log` (229 passed) and `.verify/logs/storybook-behavior.log` (16 passed), including the Button pressed-shape and geometry tests specifically.

### Project documentation reviewed

- `README.md` (current version, distinct from and more recent than the prior `AUDIT.md` it replaces — the prior audit's own "Operator feedback considered" narrative, about raw-press shape acquisition and immediate release, does not match the current README's narrative, about geometry-ownership/interaction-target correction; the prior audit is treated as superseded, not authoritative).
- `docs/material-3/source-of-truth.md`, `component-architecture.md`, `component-tokens.md`, `interaction-states.md`, and the `src/shared/ui/material` / `.../components` `AGENTS.md` files (current versions).
- The root repository `AGENTS.md` and the `material-component-review` skill instructions.

### Material 3 Expressive evidence

- `material3` MCP server: `get_component_docs('buttons')` (full markdown, overview/specs/guidelines/accessibility content) and `get_component_tokens('buttons')` (full structured token-table graph, both current-Expressive `md.comp.button.<size>.*` sets and the separate `[Deprecated]` single-size `md.comp.{text,filled,outlined,elevated,filled-tonal}-button.*` legacy sets).
- `material_docs_cache_status`: capture `2026-06-30T05:53:04.916Z`, `isFresh: false` (age ~18.5 days against a 7-day TTL), `coverageHealth: "partial"`. This independently reproduces the README's `snapshot-complete-stale` claim rather than assuming it.
- Spot-checked official token values directly against `MDButton.vue`'s CSS for: xsmall container height/leading-space/trailing-space/icon-label-space/icon-size/outline-width/shape-round/shape-square/pressed-shape (all exact matches); absence of any `md.comp.button.text.selected.*` / `.unselected.*` token (confirms the text-toggle-unsupported claim); absence of any `md.comp.button.outlined.selected.*.outline.color` token while `md.comp.button.outlined.outline.color` and per-state `unselected.*.outline.color` tokens exist (confirms the "selected outline follows selected container color" claim); the official anatomy list ("Label text / Container / Icon (optional)" — one optional icon, not a separate leading/trailing pair) confirms the "no trailing-icon slot" boundary claim.

### Operator feedback considered

- README status: `rejected`.
- Latest operator feedback (persisted in README): the button's expanded target geometry was inconsistent with the visible button and used the wrong overall geometry model, and corners still became visually straight during press; a previous animation-only correction did not resolve the shape problem.
- Implementation response (persisted in README): the geometry-model part is corrected in the current pass (the host now reserves the real 48dp target as a flow box; `.md-button__container` is the distinct visual/shape/ripple/focus owner). The README explicitly states the pressed-corner/motion part is **not** addressed by this pass, and keeps status `rejected` rather than `awaiting re-review`.
- Independent technical re-check for this review: `MDButton.vue`'s pressed-shape CSS routes `border-radius` to the documented non-zero `md.comp.button.<size>.pressed.container.shape` alias (`corner-small`/`corner-medium`/`corner-large` depending on size) for every shape and toggle-selected combination, with the selected-shape rule explicitly excluded while pressed (`:not(.md-button_pressed):not(:active)`) so pressed always wins. The current local visual/behavior verification logs (`.verify/logs/visual.log`, `.verify/logs/storybook-behavior.log`, both fully passed) include `MDButton exact geometry per size` (asserts the exact pressed-radius px value per size), `MDButton pressed shape takes precedence over selected shape`, `MDButton selected shape is preserved while disabled, including a forced-pressed disabled selected button`, `MDButton toggle shapes match baseline` (screenshot), and the real-pointer `MDButton pressed shape starts releasing immediately after a quick pointer press`. None of this evidence reproduces a straight/unrounded corner during any pressed state.
- Per policy, this technical evidence does **not** downgrade the recorded rejection — only explicit operator acceptance can do that, and passing tests cannot substitute for it. The rejection is preserved as `rejected` below. The discrepancy between the still-open rejection and the absence of a reproducible straight-corner code path is recorded under Evidence gaps/Required next work: the operator should be asked to re-look at the current build specifically, since the described symptom may already be resolved by the geometry-ownership pass, or may be a real, more subtle defect (e.g. a transition/composition artifact) that static analysis and settled-state screenshots cannot capture.

## Applicable ownership map

Independently re-derived from `MDButton.vue`, matching the README's map:

| Role                                  | Owner                                                                                                                                    | Verified                                                                                                                                                                                                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Semantic host                         | `<button class="md-button">`                                                                                                             | native element, correct semantics (`type`, `disabled`, `aria-pressed`, `aria-busy`, `aria-label`)                                                                                                                                                                                    |
| Layout footprint / interaction bounds | `<button class="md-button">` — real `min-width`/`height: var(--md-private-button-target-size)`, in normal flow, not `position: absolute` | confirmed; for extra-small/small this is a real 48dp flow box distinct from the container; for medium/large/extra-large `target-size` falls back to `height` so host and container coincide (no extra reservation, matches spec since the documented container height already ≥48dp) |
| Visual container                      | `<span class="md-button__container">`, `position: relative`, centered via the host's flex layout                                         | owns background, border, `box-shadow` (elevation), and `border-radius` at exact per-size geometry                                                                                                                                                                                    |
| Content bounds                        | `<span class="md-button__content">`                                                                                                      | owns icon/label flex layout and gap                                                                                                                                                                                                                                                  |
| State-layer bounds                    | `MDStateLayer` as a child of `.md-button__container` (`inset: 0`, `border-radius: inherit`)                                              | confirmed clipped to the container, not the (possibly larger) host                                                                                                                                                                                                                   |
| Ripple event host                     | `<button class="md-button">` (`useRipple`'s first argument)                                                                              | pointer/keyboard activation anywhere in the reserved target starts a ripple                                                                                                                                                                                                          |
| Ripple render/clip bounds             | `.md-button__container` (`useRipple`'s second, render-target argument)                                                                   | confirmed the ripple visually stays within the documented pill even when triggered from the reserved margin                                                                                                                                                                          |
| Focus-indicator bounds                | `.md-button__container` (`data-md-focus-indicator-target`)                                                                               | confirmed via the real-keyboard-focus browser test, which asserts the indicator's geometry against `.md-button__container`, not the host                                                                                                                                             |
| Outline and elevation owner           | `.md-button__container`                                                                                                                  | `border`, `box-shadow` declared only on the container                                                                                                                                                                                                                                |
| Shape and motion owner                | `.md-button__container` (`border-radius` transition)                                                                                     | confirmed for resting, hover/focus/pressed, selected, and disabled combinations                                                                                                                                                                                                      |

One coherent element (`.md-button__container`) combines visual container, content-adjacent, state-layer clip, ripple render, focus, outline/elevation, and shape ownership; this matches official anatomy (Label text / Container / Icon) rather than inventing a role-per-element structure. No applicable role is missing or contradictory.

## CSS custom-property namespace review

Every custom property declared or read by `MDButton.vue` was inventoried and classified.

### Exact official tokens (`--md-comp-button-*`, `--md-sys-*`)

All per-style (`elevated`/`filled`/`tonal`/`outlined`/`text`) and per-size (`xsmall`/`small`/`medium`/`large`/`xlarge`) `--md-comp-button-*` declarations, and all `--md-sys-color-*` / `--md-sys-elevation-*` / `--md-sys-shape-corner-*` / `--md-sys-state-*-opacity` references, use exact verified canonical names with no shortening or paraphrasing.

### Private implementation routes (`--md-private-button-*`, `--md-private-elevation-*`, `--md-private-state-layer-*`)

Correctly private and correctly describing semantic ownership: `--md-private-button-target-size`, `--md-private-button-container-color`, `--md-private-button-label-color`, `--md-private-button-icon-color`, `--md-private-button-outline-color`, `--md-private-button-elevation`, `--md-private-button-state-layer-color`, the per-state (`hover`/`focus`/`pressed`/`disabled`) variants of the above, the `rendered-*` resolution layer, `--md-private-button-icon-gap`, `--md-private-button-corner-motion-duration`/`-easing`, and the generic foundation bridges `--md-private-elevation-shadow-color` / `--md-private-state-layer-*` (correctly family-name-free per the generic-bridge rule).

**Finding — two private routes name the CSS mechanism instead of the Material semantic role** (see Stage 1 below): `--md-private-button-border-radius` (official semantic concept is _shape_/_corner-size_, e.g. `md.comp.button.<size>.container.shape.round`) and `--md-private-button-padding-left` / `--md-private-button-padding-right` (official semantic concept is _leading-space_/_trailing-space_, e.g. `md.comp.button.<size>.leading-space`). These are valid private routes structurally (real per-size/per-state configuration, not a one-use constant) but their names describe final CSS syntax rather than the Material ownership they represent, which `component-tokens.md` explicitly calls out as a reportable pattern ("a private name describes mechanism rather than semantic ownership").

**Finding — two private routes are unnecessary aliases for a value that never varies**: `--md-private-button-border-style` (always `solid`; declared once at the root and redeclared to the identical `solid` inside `.md-button_color-outlined`, with no branch ever setting a different value) and `--md-private-button-box-sizing` (always `border-box`, no branch overrides it). Neither needs indirection; `component-tokens.md` explicitly disallows "a private variable for a constant used once."

### Application tokens (`--app-*`)

None declared or read by this family; not applicable.

### Invalid or unqualified names

None found. No `--md-<artifact>-<raw-css-property>`-shaped ad-hoc public-looking name exists; the two mechanism-named routes above are still correctly prefixed `--md-private-*` and are not consumer-facing, so they are a naming-hygiene finding, not an invalid-namespace finding.

## Official capability coverage

### Implemented and verified

- One common Button component with native `<button>` semantics and a safe default `type="button"`.
- Default action and controlled toggle variants; `aria-pressed` limited to the supported toggle route.
- Elevated, filled, tonal, outlined, and text color styles, independently token-routed for label, icon, outline, container, elevation, and state-layer color/opacity (re-verified via `TokenRoutingMatrix`/`ToggleTokenRoutingMatrix` browser tests and the official token graph).
- Extra-small, small, medium, large, and extra-large sizes with documented container heights, icon sizes, leading/trailing spacing, icon-label gap, outline widths, typography routes, and per-size square/pressed/selected corner tokens — spot-verified byte-for-byte against the official token table for the extra-small size and cross-checked structurally for the rest.
- Round and square shapes, selected-shape morphs for supported toggle styles, and pressed-shape precedence over selected shape (including the disabled forced-pressed case).
- Optional leading icon (single icon only) and a single-line label whose accessible name matches the label.
- Disabled, hover, focus-visible, pressed, selected, and loading visual output; disabled suppresses interactive state visuals and forces state-layer opacity to 0 (re-verified against the actual rendered `background-color`, not only the contract variable).
- Component-token routing to the final owners of container color, label/icon color and opacity, outline color, elevation, state-layer color/opacity, size geometry, and shape — proved on the correct DOM owner (`.md-button__container` / `.md-button__label-text` / `.md-button__icon`), not merely asserted by variable name.
- 48dp minimum pointer target for extra-small/small as a real reserved flow box, proved by a real-pointer click outside the visible container but inside the host.
- Real keyboard focus and final focus-indicator geometry bound to `.md-button__container`.
- Public export through `@shared/ui/material`; every current consumer (28 files across `widgets`, `features`, `pages`, `entities`, and `shared/ui`) imports from that canonical path — no legacy import path remains.
- Explicit Mioframe `loading` extension: boolean/numeric normalization, `aria-busy`, preserved accessible name and enabled activation, decorative progress indicator dimmed to the disabled content opacity.

### Partial / defective / unverified

- **Minimum-duration pressed state-layer feedback does not reliably function as documented** (new finding this review — see Stage 1).
- Pressed-shape motion: technically well-exercised (see Operator feedback above), but the operator's `rejected` status for the pressed-corner symptom remains open and unresolved by an explicit acceptance; independent re-check found no reproducible straight-corner code path, which is itself an unresolved discrepancy requiring a fresh operator look, not a closed item.
- Shared elevation shadow-color/formula route: re-confirmed that `MDCard` and `MDSwitch` both consume `--md-private-elevation-shadow-color`, but no test file exercises it for either (`grep` across `tests/e2e` only finds it exercised for Button and the FAB family). The cross-family proof gap the prior audit identified is still present and unchanged.
- Current canonical completeness is unverified: the complete available Button snapshot (captured 2026-06-30) is 18.5 days past its own 7-day cache TTL as of this review.

### Not implemented

none confirmed in the available (stale) 2026-06-30 Button snapshot

### Officially unsupported / invalid combinations

- Text-style toggle Button: independently confirmed absent from the official token graph (no `md.comp.button.text.selected.*` / `.unselected.*` entries); the component coherently normalizes to the default action variant with a development warning.
- `selected` on a default-action Button: no official route; ignored with a development warning.
- Multiple icons in one Button, and a trailing-icon slot: independently confirmed outside the reviewed anatomy (official anatomy lists one optional icon, not a separate leading/trailing pair).

### Unresolved evidence

- Whether the live current Material 3 Expressive Button family differs from the stale 2026-06-30 snapshot.
- Whether the operator-reported pressed-corner symptom is still reproducible in the current build (see Operator feedback above) — this needs a fresh operator look, not a technical-only resolution.

### Outside this family boundary

Split Button, Button Groups, Icon Buttons, Segmented Buttons, FAB, Extended FAB (separate official families); shared color/elevation/icon/motion/shape/typography/state-layer/ripple/focus foundations (their respective owners); `loading` (explicit Mioframe extension).

## Stage 1 — implementation vs project documentation

### Finding 1 — Minimum-duration pressed state-layer feedback is not reliably provided (new)

Severity: medium

README claim: "Raw native press state controls shape geometry, while minimum-duration pressed state independently controls state-layer feedback."

Implementation evidence: `MDButton.vue` calls `useStateLayer(buttonEl)`, which calls `usePressed(buttonEl)`. `usePressed`'s `durationPressedState` is meant to hold the pressed signal true for at least one CSS transition cycle so a very fast tap still shows state-layer feedback. Its hold duration comes from `getTransitionDuration()`, which reads `getComputedStyle(target).getPropertyValue('transition-duration')` on `target` — the `<button class="md-button">` host itself, not `.md-button__container` (which owns the actual `border-radius`/`box-shadow`/color transitions) and not `.md-state-layer` (which owns the actual state-layer `background-color` transition). `.md-button` declares no native `transition-duration` of its own. The only way it acquires one is the unrelated global rule `.md * { transition-duration: var(--md-sys-motion-duration-short4, 0.2s); }` in `src/shared/lib/md/index.css`, which only applies when a `MDButton` happens to be a descendant of some ancestor carrying the incidental `.md` class (used by a handful of unrelated components such as `MDPane`, `MDAppBar`, `MDSnackbar`). Neither `src/app/MainApp.vue`'s root nor `.storybook/preview.ts` supplies such a wrapper, so in the common case `getComputedStyle` returns the CSS initial value `0s`, `parseDuration('0s')` is `0` (not nullish, so the `?? 200` fallback never applies), and the minimum-hold `setTimeout` fires at effectively 0ms — collapsing `durationPressedState` to track raw `pressed` with no meaningful minimum duration. Even in the few contexts where an incidental `.md` ancestor exists, the value read (200ms, `--md-sys-motion-duration-short4`) is an unrelated global reference token, not the button's own Expressive `--md-private-motion-expressive-fast-effects-duration` that actually drives the state layer's transition.

Practical impact: bounded. The state layer's own `background-color` transition-duration is independently declared on `.md-state-layer` itself (via `--md-private-state-layer-transition-duration`), so a toggled class still animates in/out over a real duration regardless of how long `durationPressedState` was held — this is why the effect is not a hard visual break. But the documented guarantee (a deliberate minimum on-screen dwell time for the pressed state layer, independent of how fast the physical press/release was) does not function as designed, and no test — component, browser, or visual — exercises this timing at all.

Required correction: either read the transition duration from a source that is actually connected to the state layer's own transition (e.g. a documented constant, or the container's/state-layer's own computed style), or drop the "independently controls" claim from the README until the mechanism is demonstrably connected. This is a shared `usePressed`/`useStateLayer` primitive issue (`src/shared/ui/State`), surfaced here because Button's own documentation makes an explicit, currently-unverified claim about it; a full fix belongs to that shared primitive's owner, not to Button-local code.

### Finding 2 — Two private custom properties name CSS mechanism instead of Material semantic role (new)

Severity: medium

See CSS custom-property namespace review above: `--md-private-button-border-radius` and `--md-private-button-padding-left`/`--md-private-button-padding-right` name the rendering mechanism (the literal CSS property) rather than the Material semantic concept they carry (_shape/corner-size_, and _leading-space/trailing-space_, respectively). `component-tokens.md` explicitly requires review to report "a private name describes mechanism rather than semantic ownership." This does not break current output (the private-route structure and per-size/per-state configuration are otherwise correct), but the names would mislead a future reader into thinking these are arbitrary CSS aliases rather than the specific Material container-shape and leading/trailing-space tokens they route.

Required correction: rename to a semantic role, e.g. `--md-private-button-shape` (or `-corner-size`) and `--md-private-button-leading-space`/`-trailing-space`.

### Finding 3 — Two private custom properties are unnecessary aliases for a constant (new)

Severity: low

`--md-private-button-border-style` and `--md-private-button-box-sizing` never vary across any color, size, shape, or state branch in the file (`solid` and `border-box` respectively, every time). `component-tokens.md` disallows routing a one-use constant through a private variable. This is a minor hygiene item, not a functional defect.

Required correction: declare `border-style: solid;` and `box-sizing: border-box;` directly on `.md-button__container` (and keep the host's own `box-sizing` need, if still needed) instead of through indirection.

### Finding 4 (carried forward, re-verified) — Shared elevation route still lacks representative MDCard/MDSwitch proof

Severity: medium

Re-confirmed unchanged from the prior audit: `MDCard` and `MDSwitch` both route through `--md-private-elevation-shadow-color`, but no test in `tests/e2e` exercises the override for either (only Button and the FAB family have it). Button's own proof is not affected; this is a cross-family gap that the shared elevation route's owner must close.

### Operator-rejected pressed-shape item — verification note (not a new finding; status preserved)

See "Operator feedback considered" above. Independent CSS/test analysis found no reproducible code path that renders a straight (unrounded) pressed corner for any size, shape, or toggle-selected combination, and the full local visual/behavior verification suites (which include exact-pixel pressed-radius assertions, precedence assertions, and a real-pointer press/release test) currently pass. This is reported as an evidence gap requiring a fresh operator look, not as grounds to change the `rejected` status — only explicit operator acceptance can do that.

### Verified agreement

- Documented public API (`nativeType`, `color`, `label`, `disabled`, `loading`, `variant`, `size`, `shape`, `selected`, `icon` slot, `click` emit), defaults, controlled-toggle semantics, invalid-combination normalization with dev warnings, native semantics, exports, and current 28-file consumer set all match current code exactly.
- The five styles, five sizes, two shapes, optional leading icon, selected/pressed shape rules, and token/property owners are present in `MDButton.vue` and proportionally exercised by component, browser, and visual tests.
- The applicable ownership map (above) is accurate and internally coherent; no role is missing, duplicated without justification, or contradicted by rendered output.
- The README's `snapshot-complete-stale` source status and unresolved current coverage are honest and independently reproduced by this review's own cache-status check.
- The README accurately preserves the operator's rejection language and does not claim acceptance from passing tests, screenshots, or routing.

## Stage 2 — project documentation vs Material 3 Expressive

### Findings

none

### Verified agreement

- `MDButton` is correctly mapped to the official common Buttons family, with Split Button, Button Groups, Icon Buttons, Segmented Buttons, FAB, and Extended FAB correctly kept outside this family's boundary.
- Independently spot-checked exact official token values (extra-small size: 32dp container height, 12dp leading/trailing space, 8dp icon-label space, 20dp icon size, 1dp outline width, `corner-full`/`corner-medium`/`corner-small` shape/square/pressed aliases) match `MDButton.vue`'s CSS exactly.
- Independently confirmed, directly against the official token graph, that no text-style toggle route and no selected outlined outline-color route exist — the README's "officially unsupported" classifications for both are accurate, not merely asserted.
- Independently confirmed against the official anatomy list ("Label text / Container / Icon (optional)") that a trailing-icon slot and multiple icons are correctly classified as outside the resolved anatomy.
- The Web motion implementation is honestly documented as a project adaptation of the official spring tokens, not literal spring-physics consumption; the per-size spring stiffness/damping tokens are recorded as source evidence only, which this review confirms is the correct characterization (CSS transitions cannot consume spring physics).
- `loading` is correctly and clearly labeled as a Mioframe extension, not canonical Material.

## Evidence gaps

- The available complete Material 3 Button snapshot (captured 2026-06-30) is stale relative to this review date (2026-07-18); no current-complete family source was available, so this audit cannot certify current official inventory or full current coverage.
- The operator-rejected pressed-corner symptom has no reproducible code path under independent technical review, but only the operator can convert `rejected` to `accepted`; a fresh, specific look at the current build is required (see Required next work).
- The minimum-duration pressed state-layer mechanism's actual timing has never been tested (component, browser, or visual); this review's finding is derived from source-code analysis of `usePressed.ts`/`MDButton.vue`/`index.css`, not from an observed runtime failure captured in a test.
- Design Kit inspection was not used; the published family pages and structured token graph resolved every applicable objective decision for this review.

## Required next work

1. Ask the operator to re-look at the current build's pressed/release behavior (the canonical `SizeGeometryMatrix` and toggle-shape stories) and explicitly accept or reject it — do not infer acceptance from this review's inability to reproduce a straight corner.
2. Fix or re-scope the minimum-duration pressed state-layer mechanism in `src/shared/ui/State/usePressed.ts` (or document why the current 0ms-in-practice behavior is acceptable), then add a browser test that actually exercises the timing.
3. Rename `--md-private-button-border-radius` and `--md-private-button-padding-left`/`-padding-right` to semantic-role names; collapse `--md-private-button-border-style` and `--md-private-button-box-sizing` to direct declarations.
4. Add or deliberately resolve representative MDCard and MDSwitch elevation override proof through the owning elevation foundation workflow.
5. Refresh or directly verify all current official Button family pages and structured token sources before claiming `current-complete`, a complete current inventory, or full current coverage.
6. After any production or README correction, run an independent `material-component-review buttons` again and replace this audit.
