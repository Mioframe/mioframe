# Material 3 deviations

## Principle

A deviation is intentional project behavior, naming, token usage, layout, state, or component behavior that differs from current checked Material guidance.

Deviations are allowed only when explicit, justified, bounded, and verifiable. Undocumented drift is not a deviation.

## When to record a deviation

Record one when:

- the project supports behavior or configuration not described by Material;
- a required product scenario intentionally omits or changes an expected official capability;
- public vocabulary cannot use the official Material term;
- a project-specific component uses Material foundations but is not an official component;
- platform, product, accessibility, privacy, or implementation constraints require different behavior;
- required official evidence is unavailable or conflicting and an explicit product decision accepts the risk.

Unsupported optional capability is not automatically a deviation. It becomes part of the supported-surface contract only when the library claims or requires it.

## Record format

Store the record beside the owning component or foundation artifact:

```text
Surface:
Official guidance and snapshot:
Project behavior:
Reason:
Owner:
Affected consumers:
Blast radius:
Verification:
Removal or review condition: permanent | <condition>
```

## Project-specific UI

Project-specific components remain under `Project UI` in Storybook or equivalent documentation. They may use Material tokens, state layers, typography, shape, or other foundations, but must not be presented as official Material components.

## Compatibility deviations

Temporary compatibility aliases or behavior must name the replacement, exact consumers, prohibition on new usage, and removal condition.

Do not preserve compatibility indefinitely without an explicit current requirement.
