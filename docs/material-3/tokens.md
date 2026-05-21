# Material 3 tokens

## Principle

Public Material tokens in the project must use Material 3 vocabulary.

A developer who knows the official Material 3 token model should be able to understand the project token names without learning an unrelated local naming system.

## Token classes

Material 3 defines three token classes. The project maps them to CSS custom properties as follows:

| Material token class | Material example | CSS custom property example |
| --- | --- | --- |
| Reference | `md.ref.palette.primary40` | `--md-ref-palette-primary40` |
| System | `md.sys.color.primary` | `--md-sys-color-primary` |
| Component | `md.comp.button.filled.container.color` | `--md-comp-button-filled-container-color` |

## Public `--md-*` rule

A public CSS custom property starting with `--md-` must be Material-compatible:

- it should map to an official Material token name; or
- it should be a direct, documented adaptation of an official Material token; or
- it should be listed as a documented project deviation.

Project-only implementation helpers must not be introduced as public `--md-*` tokens. Use a project namespace such as `--beaver-*` for project-specific values that do not correspond to Material vocabulary.

## Reference tokens

Reference tokens represent available values. They should not encode component usage.

Examples:

- palette values;
- typeface values;
- baseline measurement values when Material exposes them as reference tokens.

## System tokens

System tokens represent theme decisions and roles. They should point to reference tokens whenever possible.

Examples:

- color roles;
- typescale roles;
- shape roles;
- elevation levels;
- motion tokens;
- state layer opacities.

Components should prefer system tokens through component tokens instead of hardcoding reference values.

## Component tokens

Component tokens are the public override surface for component internals such as container, label text, icon, outline, selected state, disabled state, and measurements.

Component token naming is defined in [Component tokens](./component-tokens.md).

## Deprecated or compatibility tokens

If a legacy token must remain temporarily:

1. keep it as a compatibility alias;
2. document the target Material-compatible token;
3. avoid using it in new code;
4. remove it after touched consumers have migrated.

## Token audit requirements

Before converting a component family, audit the relevant token families:

- existing public `--md-*` tokens;
- local component variables that should become `--md-comp-*` tokens;
- hardcoded Material values inside component CSS;
- values that are project-specific and need `--beaver-*` or another project namespace;
- deprecated Material tokens such as surface tint color when the official guidance marks them as deprecated.
