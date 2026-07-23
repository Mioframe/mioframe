# Material 3 tokens

## Principle

Public Material tokens in the project use Material 3 vocabulary.

A developer familiar with the official token model should understand project token names without learning an unrelated local naming system.

## Token classes

| Material token class | Material example                        | CSS custom property example               |
| -------------------- | --------------------------------------- | ----------------------------------------- |
| Reference            | `md.ref.palette.primary40`              | `--md-ref-palette-primary40`              |
| System               | `md.sys.color.primary`                  | `--md-sys-color-primary`                  |
| Component            | `md.comp.button.filled.container.color` | `--md-comp-button-filled-container-color` |

## Public `--md-*` rule

A public CSS custom property starting with `--md-` must:

- map to an exact official Material token; or
- be a direct documented platform adaptation of an official token; or
- be recorded as an explicit project deviation.

Project-only helpers must not be introduced as public `--md-*` tokens. Use `--app-*` for application-specific values outside Material vocabulary.

## Application-specific namespace

Use `--app-*` for values such as:

- application debug or diagnostic colors;
- shell measurements that are not Material layout tokens;
- product-only integration surfaces;
- compatibility aliases that are not public Material contracts.

Do not use repository-name-specific prefixes for new tokens. Token vocabulary should remain stable if the repository or product name changes.

## Reference tokens

Reference tokens represent available values and do not encode component usage, for example:

- palette values;
- typeface values;
- measurements explicitly published as reference tokens.

## System tokens

System tokens represent theme decisions and roles, including:

- color roles;
- typescale roles;
- shape roles;
- elevation levels;
- motion tokens;
- state-layer opacities.

System tokens resolve to reference tokens where the official model defines that relationship.

## Component tokens

Component tokens are the public override surface for component parts, states, and measurements.

Component token naming and routing are defined in [Component tokens](./component-tokens.md).

## Deprecated and compatibility tokens

When a legacy token must remain temporarily:

1. keep it as a compatibility alias;
2. name the Material-compatible replacement;
3. prohibit new usage;
4. identify current consumers;
5. remove it when those consumers migrate.

## Verification

For every touched token family, check:

- existing public `--md-*` names;
- exact official paths and current source evidence;
- canonical declaration ownership;
- local variables that should remain private or become official component tokens;
- hardcoded Material values inside component CSS;
- application-specific values that require `--app-*`;
- deprecated and compatibility aliases;
- affected rendered property owners and consumers.
