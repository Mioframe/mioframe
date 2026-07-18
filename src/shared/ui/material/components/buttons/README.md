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

- The geometry ownership model is defective. The native button currently acts as the visual container while an absolutely positioned `md-button__target` extends beyond it, producing interaction bounds that do not form one coherent reserved rectangular target.
- The implementation has not established separate, correct owners for semantic host, layout footprint, interaction bounds, visual container, state layer, ripple clipping, focus indication, and shape rendering.
- Pressed-shape rendering remains operator-rejected. Button corners still become visually straight or otherwise malformed during press; the previous raw-press lifecycle change did not resolve the visible endpoint.
- Shape values are asserted as `border-radius` numbers without proving that they are applied to the correct visual-container geometry.
- Ad-hoc custom properties such as `--md-button-border-radius`, `--md-button-height`, `--md-button-padding-left`, and `--md-button-icon-gap` use an invalid public-looking Material namespace. They are neither exact official `--md-comp-*` tokens nor explicit `--md-private-*` routes.
- The current canonical stories and tests preserve the existing geometry but do not prove official anatomy or final visible conformance.
- Shared elevation recomputation has focused override proof for Button, FAB, and Extended FAB. Equivalent focused override proof remains absent for MDCard and MDSwitch.
- Current canonical completeness is unverified because the complete available Button snapshot is stale.

## Not implemented

- None confirmed in the available complete Button snapshot. This does not imply that the current exposed surface is correctly implemented.

## Officially unsupported and invalid combinations

- Text-style toggle Button: the official token matrix publishes no selected/unselected text-button route. Mioframe normalizes this combination to the default action variant and emits a development warning.
- `selected` on a default action Button has no semantic or visual route and is ignored with a development warning.
- Multiple icons and trailing icons are outside the resolved common Button anatomy.

## Known issues and required follow-up

- Redesign the Button DOM and CSS ownership around a coherent semantic/layout interaction host and a distinct official visual container where required by the 48dp minimum interactive target.
- Remove the absolutely positioned cross-shaped expanded-target model and prove complete target geometry, adjacency, edge, and corner hit testing.
- Re-evaluate state layer, ripple render/clip target, focus-indicator target, outline, elevation, background, and shape ownership after the geometry correction.
- Correct pressed and selected visible endpoints on the actual visual container; do not treat numeric radius equality as sufficient proof.
- Replace invalid ad-hoc `--md-button-*` properties with exact official tokens, justified `--md-private-*` semantic routes, or direct declarations when indirection is unnecessary.
- Rebuild canonical stories and tests around real production anatomy and final rendered owners.
- Run a fresh independent Button review after production and documentation changes.
- Add or deliberately defer representative shared elevation override proof for MDCard and MDSwitch through the owning foundation/style workflow.
- Refresh or directly verify current official Button sources before claiming current-complete inventory or full current coverage.

## Operator feedback and visual status

Status: `rejected`

Latest operator feedback: the Button is visibly malformed. Its expanded target has geometry larger than and inconsistent with the visible button, the component appears to use the wrong overall geometry model, and corners still become visually straight during press. The previous animation correction did not solve the visible shape problem.

Implementation response: unresolved. The next authoring pass must investigate the complete anatomy and geometry ownership model, correct production structure and shape rendering, and preserve `rejected` until a real production correction is ready for explicit operator re-review.

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
- Family-private routes must use `--md-private-*`; ad-hoc `--md-button-*` variables are not accepted Material token names.
- Current geometry and shape ownership is unresolved and must not be described as root-owned or verified until a geometry ownership map is established.
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
- Physical ownership migration is complete; visual and geometry conformance is not.

## Verification

- Existing component, browser, and visual tests are implementation regression evidence only.
- Existing expanded-target tests prove only selected click points and currently reinforce the defective target model.
- Existing shape tests prove selected computed radii, not correct visual-container ownership or official visible endpoints.
- A new geometry ownership map, final-owner assertions, complete target-bound tests, real production stories, and independent audit are required.
- Operator visual acceptance remains rejected.

## Review status

Review required after changes.