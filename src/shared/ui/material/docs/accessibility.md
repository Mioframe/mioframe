# Material 3 accessibility

## Principle

Accessibility is part of Material 3 alignment and must be considered with component choice, tokens, states, API design, and layout behavior.

A component that looks visually close to Material 3 but has incorrect names, focus behavior, keyboard behavior, target size, semantics, or contrast is not Material 3 aligned.

## Baseline expectations

Shared Material components must define or preserve:

- accessible names for interactive controls;
- keyboard activation and navigation where applicable;
- focus-visible behavior;
- correct disabled and readonly semantics;
- minimum target areas required by official Material guidance;
- contrast-safe color role pairings;
- semantic roles only when native HTML semantics are insufficient;
- modal focus handling for dialogs, sheets, and overlays;
- screen-reader-visible state when the state is meaningful.

## Native semantics first

Prefer native HTML semantics when they match the component behavior. Add ARIA only when native semantics are insufficient or when Material guidance requires an additional accessible description.

Do not add roles that conflict with the rendered element's native behavior.

## Color and contrast

Use Material color roles in their intended pairings. Do not remap color roles for visual effect when doing so can break contrast, dynamic color, or future contrast modes.

## Target area

Target area requirements belong to the component contract. Do not rely on consumers to add padding around undersized interactive controls.

When Material docs define a minimum target area for a component or size, the component should enforce it internally or document an explicit deviation.

## Verification

Accessibility-sensitive changes require verification appropriate to the changed behavior:

- keyboard smoke check for keyboard/focus changes;
- browser smoke or Playwright check for modal focus traps and overlays;
- Storybook documentation for accessible names and required props;
- visual checks for focus indicators and state layers when appearance changes.
