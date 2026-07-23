# Material 3 units

## Principle

Author Material UI styles with the units used by official Material documentation.

Source code may use Material-oriented authoring units such as `dp` and `sp` when the checked guidance uses them. Translation into browser-supported CSS values belongs to the centralized PostCSS unit pipeline, not individual components.

## Project unit pipeline

The project supports custom CSS units through PostCSS. Shared foundation configuration owns the base conversion values.

Material authoring units:

- `dp` for Material dimensions, layout measurements, shape, and component specifications;
- `sp` for Material typography sizes.

Project helper units:

- `step` for application spacing composition when no exact Material measurement applies.

Legacy units:

- `pt` may remain as a temporary compatibility path, but it is not the Material typography authoring unit. Do not add new Material typography tokens in `pt`.

Changes to conversion values are shared behavior changes because they can affect many components and visual baselines.

## Rules

- Use the unit shown by the official Material documentation for Material-derived measurements.
- Do not replace Material measurements with arbitrary CSS values merely because the runtime target is the web.
- Do not introduce a custom unit without documenting its Material or project role here.
- Do not mix equivalent authoring units inside one token family.
- Keep conversion centralized in PostCSS and shared CSS foundation configuration.
- Components consume tokens and authoring units; they do not perform local conversion.

## Typography

Use `sp` for Material typography authoring values.

Typography values are exposed through `md.sys.typescale.*` tokens. Components consume those tokens and do not convert typography values locally.

The current `--one-sp` mapping intentionally preserves rendered typography until an explicit scaling decision changes that contract.

## Verification

Unit changes require focused verification of:

- the PostCSS custom-unit transform;
- generated CSS for representative `dp`, `sp`, and `step` values;
- affected legacy `pt` usage;
- representative typography, shape, and layout surfaces.
