# Material 3 baseline theme

## Principle

The Material baseline theme is the project foundation for shared UI tokens. Component work must not redefine baseline color, typography, shape, elevation, motion, or state decisions locally.

## Theme model

Start with a tokenized Material baseline theme.

The theme must support both light and dark color schemes from the beginning. Components must consume theme roles through tokens and must not hardcode light-only or dark-only colors.

Future work may add user customization of the base palette. The foundation must be structured so a generated or user-selected palette can update reference and system tokens without rewriting components.

Dynamic or user-custom color is not required for the initial foundation implementation, but the token model must not block it.

## Foundation families

The baseline theme policy covers:

- color roles;
- typography scale;
- shape scale;
- elevation levels;
- motion tokens;
- state tokens;
- light and dark contexts.

## Color roles

Color roles must be used according to their Material meaning and intended pairings. Components should use component tokens that point to system color roles rather than hardcoded palette values.

The initial theme should define Material baseline light and dark schemes. Palette customization belongs above the token model and should update reference/system tokens rather than component CSS.

## Typography

Typography values must be provided through `md.sys.typescale.*` tokens. Components should use typography tokens instead of local font-size, line-height, weight, or tracking values unless the official component spec defines a component-specific override.

Typography authoring values use `sp` as defined in [Units](./units.md).

## Shape

Shape values must come from Material shape tokens or component tokens that point to them. Do not invent local radii for Material components when Material provides a shape role or measurement.

## Elevation

Elevation should use Material elevation levels. Surface tint color is deprecated in current Material guidance and should not be introduced as a new dependency.

## Motion

Motion should use Material motion tokens or a documented newer Material motion model when the relevant guidance requires it. Do not add arbitrary transition durations or easing curves to shared Material components.

## State tokens

State layer opacity and focus indicator values belong to the foundation layer. Components should not redefine them locally unless the official component spec requires a component-specific value.

## Contexts

Theme contexts such as light and dark mode must be handled at the token level. Components should not hardcode light or dark colors.

## Audit requirement

Before broad component conversion, audit the existing baseline token file and classify each token as:

- Material reference token;
- Material system token;
- Material component token;
- compatibility alias;
- app-specific token that needs `--app-*` namespace;
- obsolete token to remove.
