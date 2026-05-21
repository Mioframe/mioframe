# Material 3 units

## Principle

Author Material UI styles with the units used by the official Material 3 documentation.

The source code may use Material-oriented authoring units such as `dp` when the checked Material 3 guidance uses them. Translating those units into browser-supported CSS values is the responsibility of the PostCSS custom unit pipeline, not individual components.

## Current project unit pipeline

The project supports custom CSS units through PostCSS:

- `dp` is translated through `--one-dp`.
- `pt` is translated through `--one-pt`.
- `step` is translated through `--one-step`.

The base unit values are defined in the Material CSS foundation layer. Changes to unit conversion must be treated as foundation changes because they can affect all shared UI components and visual baselines.

## Unit rules

- Use the unit shown by the official Material 3 documentation for Material-derived measurements when practical.
- Do not replace Material measurements with arbitrary CSS values inside components just because the runtime target is the web.
- Do not introduce a new custom unit without documenting its Material or project role here.
- Do not mix equivalent units for the same token family without a deliberate reason.
- Keep unit conversion centralized in PostCSS and the Material CSS foundation layer.

## Typography units

Typography units must be handled consistently as a foundation decision. If the project uses a Material-derived authoring unit for typography, components should consume the typography tokens and should not convert typography values locally.

A future typography audit must decide whether the existing `pt` authoring unit remains the project convention or whether a more Material-specific typography unit should be introduced. Until that decision is made, do not perform component-local conversions.

## Verification

Unit changes require focused verification of:

- the PostCSS custom unit transform;
- generated CSS for representative `dp`, `pt`, and `step` values;
- at least one visual surface that uses typography, shape, and layout measurements.
