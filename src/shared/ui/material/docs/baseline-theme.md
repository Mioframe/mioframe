# Material 3 baseline theme

## Principle

The Material baseline theme is the project foundation for shared UI tokens. Components must not redefine color, typography, shape, elevation, motion, or state decisions locally.

## Theme model

The theme supports light and dark color schemes. Components consume theme roles through tokens and must not hardcode scheme-specific colors.

Palette customization, when required, updates reference and system tokens rather than component CSS. The token model must not couple components to one fixed palette source.

## Foundation families

The baseline theme covers:

- color roles;
- typography scale;
- shape scale;
- elevation levels;
- motion tokens;
- state tokens;
- light and dark contexts.

## Color roles

Use color roles according to their Material meaning and intended pairings. Components use component tokens that resolve to system roles rather than hardcoded palette values.

## Typography

Typography values are provided through `md.sys.typescale.*` tokens. Components use typography tokens instead of local font size, line height, weight, or tracking unless an official component specification defines a component-specific value.

Typography authoring values use `sp` as defined in [Units](./units.md).

## Shape

Shape values come from Material shape tokens or component tokens that resolve to them. Do not invent local radii when Material provides a role or measurement.

## Elevation

Use Material elevation levels. Do not introduce deprecated surface-tint behavior as a new dependency.

## Motion

Use verified Material motion tokens or a documented platform adaptation required by current official guidance. Do not add arbitrary transition durations or easing curves to shared Material components.

## State tokens

State-layer opacity and focus-indicator values belong to shared foundation contracts. Components define component-specific values only when the official component specification requires them.

## Contexts

Theme contexts are handled through reference and system tokens. Components must not contain independent light or dark palettes.

## Verification

When theme contracts change, verify:

- affected reference, system, and component token paths;
- light and dark role mappings;
- representative typography, shape, elevation, motion, and state consumers;
- compatibility aliases and application-specific values remain outside the public Material token vocabulary.
