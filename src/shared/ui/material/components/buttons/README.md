# Buttons

## Official documentation mapping

- Official family: Buttons — common buttons and toggle buttons.
- Official path: `m3.material.io/components/buttons`.
- Pages used: `overview.md`, `specs.md`, `accessibility.md`; usage and placement guidance must be reconciled consistently with `guidelines.md` before that page is claimed as reviewed everywhere.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.

## Implemented

- Public component: `MDButton`.
- Styles: elevated, filled, tonal, outlined, and text.
- Sizes: extra-small, small, medium, large, and extra-large.
- Shapes: round and square.
- Variants: default actions and controlled toggle buttons.
- Native `<button>` semantics, button type, disabled behavior, accessible name, `aria-pressed` for toggle state, and `aria-busy` for loading.
- State layer, ripple, focus indication, public component-token routing, canonical stories, and colocated contract tests.
- Loading extension with boolean or clamped numeric progress.
- Canonical root export through `@shared/ui/material`.
- Direct repository consumers migrated from the legacy MDButton export.

## Not implemented

- Text-style toggle buttons: the verified token graph contains no supported text-toggle color route; this combination normalizes to the default variant with a development warning.
- Split Button.
- Standard Button Group.
- Connected Button Group.

These official capabilities are outside the current supported surface because no current consumer requires them and they have separate official contracts.

## Known issues and required follow-up

- **Motion:** per-size stiffness/damping tokens do not derive the runtime duration/easing. Current aliases still resolve to the pre-existing shared Web approximation. The implementation must either treat stiffness/damping only as source evidence and document one honest runtime adaptation, or introduce a real conversion owner. Tests comparing equal aliases do not close this issue.
- **Elevation:** local shadow-color overrides reach the final `box-shadow` by declaring all elevation-level formulas on `*, ::before, ::after`. This has a broad cross-family cascade and inheritance impact that requires narrowing or representative cross-family validation.
- **Documentation consistency:** all source claims must agree on whether Button guidelines were inspected.
- **Loading at zero:** numeric loading value `0` remains an active loading state, while the current progress-indicator implementation renders zero through its indeterminate visual path. This extension behavior requires a deliberate follow-up decision.
- **Visual review:** operator comparison is blocked until the motion and elevation findings are resolved.

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
- Official spring values are currently evidence, not a runtime dependency; see the open motion issue above.

## Foundations and styles used

- Color and current theme roles: legacy owner `src/shared/lib/md/tokens.css`; future official navigation owner `material/styles/color`.
- Elevation: legacy token owner; future `material/styles/elevation`.
- Motion: legacy token owner; future `material/styles/motion`.
- Typography: `@shared/lib/md`; future `material/styles/typography`.
- State layer, ripple, and focus: `src/shared/ui/State`; future `material/foundations/interaction`.
- Progress indicator: current shared progress-indicator owner for the loading extension.

## Extensions and deviations

- `loading` is a Mioframe extension, not part of the official Button component contract.
- Unsupported text-toggle usage normalizes to a default action rather than exposing an invalid token route.

## Consumers and migration state

- Canonical path: `src/shared/ui/material/components/buttons`.
- Public export: `MDButton` from `@shared/ui/material`.
- The legacy MDButton implementation and export are removed.
- Direct consumers are migrated.
- Physical ownership migration is complete; Material alignment remains incomplete while the known findings above are open.

## Verification

- `MDButton.test.ts` — public API, semantics, invalid combinations, state and loading contracts.
- `MDButton.stories.ts` — canonical visual configurations and states.
- Focused browser/visual coverage exists for token routes, geometry, accessibility, and final computed shadow behavior.
- Existing motion alias-equality tests do not prove a real spring dependency and require correction with the implementation.
- Local verification must be rerun after the path normalization and technical fixes.

## Review status

Reviewed — see `AUDIT.md`.

Current audit result: `non-compliant`. Implementation correction is required before another visual review.
