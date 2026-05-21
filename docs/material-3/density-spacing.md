# Material 3 density and spacing

## Principle

Density, spacing, and target areas are foundation decisions. Shared Material components must not invent local spacing systems when official Material guidance defines measurements, target areas, or density expectations.

## Units

Use the units shown by the official Material 3 documentation as authoring units. Translation into CSS-supported values is handled by the PostCSS unit pipeline described in [Units](./units.md).

## Spacing sources

Use spacing in this order:

1. exact Material component spec measurements;
2. Material layout guidance for panes, canonical layouts, and adaptive surfaces;
3. project spacing helpers such as `step` only when no exact Material value applies or when composing app-specific layout around Material components;
4. documented deviation when neither Material nor project spacing rules fit.

## Density

Density changes must be deliberate. Do not shrink Material components or touch targets to fit more content unless official Material guidance supports the density or a deviation is documented.

For compact surfaces, first check Material compact, medium, and expanded guidance before changing component internals.

## Target areas

Interactive controls must satisfy Material and accessibility target area requirements. Components should own their target area rather than requiring consumers to add surrounding padding.

When visual size and target size differ, document the distinction in Storybook and verify it in browser behavior when relevant.

## App-specific spacing

Use `--app-*` tokens for app-specific spacing that is not a Material token. Do not encode app-specific spacing as `--md-*`.

## Verification

Spacing or density changes should be verified by:

- inspecting the checked Material docs or component specs;
- Storybook surfaces for affected components;
- responsive/browser smoke checks when layout behavior changes;
- visual regression tests for shared primitives or high-risk surfaces.
