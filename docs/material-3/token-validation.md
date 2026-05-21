# Material 3 token validation

## Principle

Token policy must be mechanically checkable where practical. A token name that looks Material-compatible but does not map to official guidance creates long-term drift.

## Validation goals

A token validation pass should identify:

- public `--md-*` tokens that do not map to Material `md.ref`, `md.sys`, or `md.comp` vocabulary;
- app-specific values that should use `--app-*`;
- component-local variables that should become public `--md-comp-*` tokens;
- hardcoded Material values in component CSS;
- deprecated or compatibility tokens;
- missing system or component tokens needed by a converted component family.

## Allowed public token namespaces

Use these namespaces for public styling contracts:

| Namespace | Use |
| --- | --- |
| `--md-ref-*` | Material reference tokens. |
| `--md-sys-*` | Material system tokens. |
| `--md-comp-*` | Material component tokens. |
| `--app-*` | App-specific tokens outside Material vocabulary. |

Do not introduce new public token namespaces without updating this document.

## Validation process

Before converting a component family:

1. collect all CSS custom properties used by the component and its direct shared UI dependencies;
2. classify each property as reference, system, component, app-specific, private local, compatibility alias, or obsolete;
3. compare Material token names and meanings through MCP or fallback cache;
4. define missing `--md-comp-*` tokens before changing visuals;
5. document unsupported or adapted tokens as deviations.

## Future automation

A future script may enforce parts of this policy. It should start as advisory and become blocking only after the existing token inventory has been classified.

Recommended checks:

- reject new public `--md-*` tokens without `ref`, `sys`, or `comp` class;
- warn on new `--md-*` names that are not present in the allowlist or deviation registry;
- warn on project-specific names under `--md-*`;
- warn on raw hex colors in shared Material component CSS;
- warn on component CSS that bypasses defined `--md-comp-*` tokens.

## Review expectation

A Material token PR should include:

- the checked Material token docs or component specs;
- the token classification summary;
- renamed or deprecated compatibility aliases;
- focused verification for generated CSS and affected visual surfaces.
