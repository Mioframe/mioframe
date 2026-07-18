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
- Sizes: extra-small, small, medium, large, and extra-large.
- Shapes: round and square, including pressed and selected shape morphs per size.
- Variants: default actions and controlled toggle buttons.
- Optional leading icon.
- Native `<button>` semantics, safe native type, disabled behavior, accessible name, native keyboard activation, `aria-pressed`, and `aria-busy`.
- State layer, ripple, focus indication, public component-token routing, canonical stories, and colocated contract tests.
- Loading extension with boolean or normalized numeric progress; values normalized to zero render the same indeterminate visual as `true`.
- Canonical root export through `@shared/ui/material`.
- Direct consumers migrated from the legacy MDButton export.

## Partial / defective / unverified

- Pressed-shape motion is technically connected to the project Web adaptation but is operator-rejected as visibly incorrect for the intended Material 3 Expressive behavior.
- Shared elevation recomputation has focused override proof for Button, FAB, and Extended FAB. Equivalent focused override proof remains absent for MDCard and MDSwitch.
- Current canonical completeness is unverified because the complete available Button snapshot is stale.

## Not implemented

- None confirmed in the available complete Button snapshot.

## Officially unsupported and invalid combinations

- Text-style toggle Button: the official token matrix publishes no selected/unselected text-button route. Mioframe normalizes this combination to the default action variant and emits a development warning.
- `selected` on a default action Button has no semantic or visual route and is ignored with a development warning.
- Multiple icons and trailing icons are outside the resolved common Button anatomy.

## Known issues and required follow-up

- Correct the production pressed-shape motion behavior before requesting another operator review.
- Add or deliberately defer representative shared elevation override proof for MDCard and MDSwitch through the owning foundation/style workflow.
- Rapid-click modified motion guidance is conditional, non-normative Web guidance. It is not a missing Button capability; revisit only when a concrete supported scenario requires repeated rapid activation behavior.
- Refresh or directly verify the current official Button family sources before claiming current-complete inventory or full current coverage.

## Operator feedback and visual status

Status: `rejected`

Latest operator feedback: the current pressed-shape animation is visibly incorrect for the intended Material 3 Expressive behavior. A technically connected CSS transition does not resolve the perceived motion mismatch.

Implementation response: none yet. The next implementation pass must change production motion behavior, prepare new canonical evidence, and then set the status to `awaiting re-review`. Only an explicit user acceptance message may set `accepted`.

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
- Official pressed-shape spring values are canonical source evidence. The current CSS runtime uses a documented Web adaptation rather than literal spring physics.
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
- Physical ownership migration is complete.

## Verification

- `MDButton.test.ts` covers public API, semantics, invalid combinations, state, and loading contracts.
- `MDButton.stories.ts` provides canonical visual configurations and states.
- Focused browser/visual coverage exists for token routes, geometry, accessibility, motion routing, and final computed Button shadow behavior.
- Operator visual rejection remains open despite technical route evidence.
- Applicable local verification must be rerun after the next production correction.

## Review status

Review required after changes.