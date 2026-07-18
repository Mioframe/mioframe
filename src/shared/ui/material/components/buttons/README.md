# Buttons

## Official documentation mapping

- Official family: Buttons — common buttons and toggle buttons.
- Official path: `m3.material.io/components/buttons`.
- Pages used: `overview.md`, `guidelines.md`, `accessibility.md` — inspected through the `material3` MCP local documentation cache (`m3.material.io` source, cache captured `2026-06-30T05:53:04.916Z`, per-page `capturedAt: 2026-06-30T05:48:50.423Z`). `specs.md` was cross-verified through the same cache's structured component token-table graph.
- Family boundary: Split Button, Button Groups, Icon Buttons, Segmented Buttons, FAB, and Extended FAB are separate official families with separate documentation paths.
- Canonical source status: `snapshot-complete-stale`.
- Official capability inventory: `snapshot-complete (material3 cache captured 2026-06-30T05:53:04.916Z; currentness unverified)`.
- Official coverage: `unresolved` because the available family snapshot is complete but stale.

## Implemented

- Public component: `MDButton`.
- Styles: elevated, filled, tonal, outlined, and text.
- Sizes: extra-small, small, medium, large, and extra-large are exposed by the public API.
- Shapes: round and square are exposed by the public API.
- Variants: default actions and controlled toggle buttons.
- Optional leading icon.
- Native `<button>` semantics, safe native type, disabled behavior, accessible name, native keyboard activation, `aria-pressed`, and `aria-busy`.
- Loading extension with boolean or normalized numeric progress.
- Canonical root export through `@shared/ui/material`.
- Direct consumers migrated from the legacy MDButton export.

## Partial / defective / unverified

- Pressed-shape rendering remains operator-rejected. Button corners still become visually straight or otherwise malformed during press; the previous raw-press lifecycle change did not resolve the visible endpoint. This authoring pass did not change shape/motion timing and does not close this rejection.
- Shared elevation recomputation has focused override proof for Button, FAB, and Extended FAB. Equivalent focused override proof remains absent for MDCard and MDSwitch.
- Current canonical completeness is unverified because the complete available Button snapshot is stale.

## Not implemented

- None confirmed in the available complete Button snapshot. This does not imply that the current exposed surface is correctly implemented.

## Officially unsupported and invalid combinations

- Text-style toggle Button: the official token matrix publishes no selected/unselected text-button route. Mioframe normalizes this combination to the default action variant and emits a development warning.
- `selected` on a default action Button has no semantic or visual route and is ignored with a development warning.
- Multiple icons and trailing icons are outside the resolved common Button anatomy.

## Geometry ownership map

The button host and the visual container are distinct elements for `extra-small`/`small` sizes, where the documented container height (32dp/40dp) is below the 48dp minimum interactive target. For `medium`/`large`/`extra-large`, the container height already meets or exceeds 48dp, so the two boxes coincide (no visible or geometric difference from a single-element model).

| Role                                  | Owner                                                                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semantic host                         | `<button class="md-button">`                                                                                                                                                                                                                             |
| Layout footprint / interaction bounds | `<button class="md-button">` — real `min-width`/`height: var(--md-private-button-target-size)`, part of normal flow (not an absolutely positioned overlay); reserves adjacency space so an expanded target cannot silently overlap a neighboring control |
| Visual container                      | `<span class="md-button__container">`, centered inside the host; owns background, outline, elevation, and shape (`border-radius`) at the documented per-size geometry                                                                                    |
| Content bounds                        | `<span class="md-button__content">` inside the container                                                                                                                                                                                                 |
| State-layer bounds                    | `MDStateLayer`, a child of `.md-button__container` (`inset: 0`, `border-radius: inherit` from the container)                                                                                                                                             |
| Ripple event host                     | `<button class="md-button">` — pointer/keyboard press anywhere in the full reserved target starts a ripple                                                                                                                                               |
| Ripple render/clip bounds             | `.md-button__container` (`useRipple`'s render-target argument), so the ripple visually stays within the documented pill even when triggered from the reserved margin                                                                                     |
| Focus-indicator bounds                | `.md-button__container`, marked `data-md-focus-indicator-target` so the shared focus-indicator resolves the visible pill, not the (possibly larger) host box                                                                                             |
| Outline and elevation owner           | `.md-button__container`                                                                                                                                                                                                                                  |
| Shape and motion owner                | `.md-button__container` (`border-radius` transition)                                                                                                                                                                                                     |

## Known issues and required follow-up

- Pressed-shape motion remains operator-rejected; a corrected visible press/release endpoint is still required (see Operator feedback below). The geometry and CSS-namespace correction in this pass did not touch motion timing.
- Rebuild canonical stories and tests around real production anatomy and final rendered owners as pressed-shape motion work proceeds — the geometry-ownership tests already target the new anatomy; motion follow-up should keep doing so.
- Run a fresh independent Button review after this production and documentation change.
- Add or deliberately defer representative shared elevation override proof for MDCard and MDSwitch through the owning foundation/style workflow.
- Refresh or directly verify current official Button sources before claiming current-complete inventory or full current coverage.

## Operator feedback and visual status

Status: `rejected`

Latest operator feedback: the Button is visibly malformed. Its expanded target has geometry larger than and inconsistent with the visible button, the component appears to use the wrong overall geometry model, and corners still become visually straight during press. The previous animation correction did not solve the visible shape problem.

Implementation response: partial. The geometry-model part of the feedback is corrected: the native button now reserves the full 48dp minimum interaction target as a real flow box (`min-width`/`height`), replacing the absolutely positioned, non-layout-reserving `.md-button__target` overlay that could silently overlap adjacent controls. A new `.md-button__container` owns the documented per-size visual geometry (background, outline, elevation, shape), and is the ripple render/clip target and focus-indicator bounding source — see Geometry ownership map above. All ad-hoc `--md-button-*` custom properties were also replaced with `--md-private-button-*` routes. The pressed-corner/motion part of the feedback is **not** addressed by this pass — status stays `rejected` (not `awaiting re-review`) because the complete affected visible surface the operator reported has not yet been corrected. Re-review should wait until the pressed-shape endpoint is also fixed, so the operator is not asked to re-check a known-still-broken surface.

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

- Public official tokens are valid only when they retain exact canonical `--md-comp-*` names and reach the final official DOM owner.
- Family-private routes use `--md-private-button-*` (or the applicable shared `--md-private-*` foundation route); there are no remaining ad-hoc `--md-button-*` variables.
- Geometry and shape ownership follow the geometry ownership map above: the button host reserves the interaction target, `.md-button__container` owns visual shape/color/elevation.
- Label and icon descendants own their rendered color and opacity, subject to renewed final-owner verification.
- Official pressed-shape spring values remain canonical source evidence. The current Web runtime adaptation and visible endpoint remain rejected.
- Elevation shadow-color routing consumes the shared `--md-private-elevation-shadow-color` / `--md-sys-elevation-level*` contract.

## Foundations and styles used

- Color and theme roles: current legacy owner `src/shared/lib/md/tokens.css`; future official navigation owner `material/styles/color`.
- Elevation: current legacy owner `src/shared/lib/md/tokens.css`; future official navigation owner `material/styles/elevation`.
- Motion: current legacy token owner `src/shared/lib/md/tokens.css`; future `material/styles/motion`.
- Typography: `@shared/lib/md`; future `material/styles/typography`.
- State layer, ripple, and focus: `src/shared/ui/State`; future `material/foundations/interaction`.
- Progress indicator: `src/shared/ui/ProgressIndicators` for the loading extension.

## Extensions and deviations

- `loading` is a Mioframe extension, not part of the official Button contract. A numeric value normalized to zero renders the same indeterminate visual as `loading={true}`.
- Unsupported text-toggle usage normalizes to a default action rather than exposing an invalid token route.
- The current Web motion adaptation is a project runtime approximation, not literal consumption of Material spring physics.

## Consumers and migration state

- Canonical path: `src/shared/ui/material/components/buttons`.
- Public export: `MDButton` from `@shared/ui/material`.
- The legacy MDButton implementation and export are removed.
- Direct consumers are migrated.
- Physical ownership migration is complete. Geometry ownership and CSS-namespace conformance are corrected by this pass; pressed-shape motion conformance is not (see Operator feedback above).

## Verification

- Component, browser, and visual tests are implementation regression evidence only; they do not by themselves prove operator-perceived correctness.
- The expanded-target hit test now asserts activation from a click point inside the button host's reserved box but outside `.md-button__container`'s visible box, against both boxes' real bounding rects — not a single convenient point.
- The `SizeGeometryMatrix`-based tests assert `.md-button__container`'s own height/padding/gap/shape/outline-width per size, and the button-host bounding box now independently reserves at least 48dp for `extra-small`/`small` without growing the visible container.
- Shape tests assert `border-radius` on `.md-button__container` (the actual visual container), not the button host.
- `useRipple`'s render-target parameter is exercised by MDButton; all other current `useRipple` consumers keep their single-argument call and are unaffected (verified via full local `pnpm verify`, including the full app e2e suite).
- Visual baselines `md-button-toggle-shapes`, `md-button-toggle-interaction-states`, and `md-state-layer-hosts` were regenerated and inspected: the surface bounding box grew by exactly the reserved 48dp margin around `extra-small`/`small` buttons (the intended, understood effect of the fix), with no other visible change. `md-button-states` and `md-button-interaction-states` were also regenerated as a byproduct of the same `test:visual:update` run even though the prior compare-mode run reported them unchanged (likely container-run font/AA noise); kept per explicit operator instruction.
- Independent review, a corrected pressed-shape endpoint, and explicit operator visual acceptance remain required — see Operator feedback above.

## Review status

Review required after changes.
