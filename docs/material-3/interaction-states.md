# Material 3 interaction states

## Principle

Material interaction states must be implemented consistently through shared state primitives instead of ad hoc per-component hover, focus, pressed, or dragged logic.

The state model is part of Material 3 alignment. Visual similarity without correct state behavior is incomplete.

## State vocabulary

Use Material state names for public documentation and shared implementation concepts:

- enabled;
- disabled;
- hover;
- focused;
- pressed;
- dragged;
- selected when a component supports selection;
- loading or progress when the component explicitly communicates work in progress.

## Shared state foundation

Shared Material components should use the project state foundation, such as `MDState`, state layers, focus handling, pressed handling, and last-hover handling, unless there is a documented reason not to.

Components must not bypass shared state primitives with local hover or focus implementations when the shared primitive can represent the state correctly.

## Combined states

States can combine, such as selected + hover or disabled + selected. Component APIs, tokens, and visual documentation should make combined states explicit when they affect behavior or appearance.

## Focus

Focus behavior must be real browser behavior, not only visual styling. Keyboard focus, focus-visible behavior, and accessibility semantics must be verified in a browser surface when changed.

## Ripple and state layers

State layers and ripple behavior should be applied consistently with Material guidance and component specs. Disabling ripple or state layers requires a documented reason.

## Verification

Interaction state changes require browser-based verification. Use Storybook as the preferred isolated surface and Playwright screenshots for visual state regressions when appearance changes.
