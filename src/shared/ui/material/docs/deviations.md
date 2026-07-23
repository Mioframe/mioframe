# Material 3 deviations

## Principle

A deviation is any project behavior, naming, token, layout, state, or component pattern that intentionally differs from the checked official Material 3 guidance.

Deviations are allowed only when they are explicit, justified, and documented. Undocumented drift is not a deviation; it is technical debt or an unresolved verification risk.

## When to document a deviation

Document a deviation when:

- the project supports a component variant not described by Material 3;
- the project omits an official Material 3 variant that users of the UI kit might expect;
- a prop or token cannot use the official Material term;
- a project-specific component uses Material tokens or states but is not an official Material component;
- a Material guideline cannot be followed because of platform, product, accessibility, privacy, or implementation constraints;
- the official docs are unavailable or incomplete for the touched surface.

## Deviation record format

Use this format in the relevant component docs, Storybook notes, or a future deviation registry:

```text
Surface: <component, token family, layout, or pattern>
Material guidance: <checked page/cache path>
Project behavior: <what the project does>
Reason: <why the project differs>
Blast radius: <where it affects users or developers>
Verification: <how the behavior is checked>
Review date: <date or milestone for revisiting>
```

## Project-specific UI

Project-specific components must be documented under `Project UI` in Storybook or equivalent docs. They may use Material foundations such as tokens, state layers, typography, and shape, but they must not be presented as official Material components.

## Unsupported official features

If the project intentionally supports only a subset of an official Material component, document the unsupported features. The public API should not accept unsupported values unless they are compatibility aliases with a migration plan.

## Temporary deviations

Temporary deviations should include a migration target. Do not create permanent compatibility aliases without documenting why they must remain.
