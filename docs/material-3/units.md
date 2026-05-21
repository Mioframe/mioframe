# Material 3 units

## Principle

Author Material UI styles with the units used by the official Material 3 documentation.

The source code may use Material-oriented authoring units such as `dp` and `sp` when the checked Material 3 guidance uses them. Translating those units into browser-supported CSS values is the responsibility of the PostCSS custom unit pipeline, not individual components.

## Project unit pipeline

The project supports custom CSS units through PostCSS. The Material foundation layer is responsible for defining the base conversion values.

Required Material authoring units:

- `dp` for Material dimensions, layout measurements, shape, and component specs;
- `sp` for Material typography sizes.

Project helper units:

- `step` for app spacing composition when no exact Material measurement applies.

Legacy units:

- `pt` exists in the current codebase, but it is not the target Material typography authoring unit. Do not add new Material typography tokens in `pt`. Migrate existing Material typography `pt` usage to `sp` during the foundation token audit.

Changes to unit conversion must be treated as foundation changes because they can affect all shared UI components and visual baselines.

## Unit rules

- Use the unit shown by the official Material 3 documentation for Material-derived measurements.
- Do not replace Material measurements with arbitrary CSS values inside components just because the runtime target is the web.
- Do not introduce a new custom unit without documenting its Material or project role here.
- Do not mix equivalent units for the same token family.
- Keep unit conversion centralized in PostCSS and the Material CSS foundation layer.
- Components must consume tokens and authoring units; they must not perform local unit conversion.

## Typography units

Use `sp` for Material typography authoring values.

Typography values must be exposed through `md.sys.typescale.*` tokens. Components should consume those tokens and should not convert typography values locally.

The foundation audit must migrate current Material typography tokens from `pt` to `sp` and add the required PostCSS `sp` conversion before component-family migration relies on the new typography tokens.

## Verification

Unit changes require focused verification of:

- the PostCSS custom unit transform;
- generated CSS for representative `dp`, `sp`, and `step` values;
- migration or removal of legacy `pt` Material typography values;
- at least one visual surface that uses typography, shape, and layout measurements.
