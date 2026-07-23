# Material 3 accessibility

## Principle

Accessibility is part of a Material component's design and implementation contract, not a final visual check.

A component is not aligned when names, semantics, focus, keyboard behavior, target size, state exposure, or contrast are incorrect even if its visual appearance is close.

## Requirements

Shared Material components define or preserve applicable:

- accessible names;
- native keyboard activation and navigation;
- focus-visible behavior;
- disabled and readonly semantics;
- minimum target areas;
- contrast-safe role pairings;
- native roles and states;
- modal focus entry, containment, dismissal, and restoration;
- assistive-technology exposure of meaningful state.

## Native semantics first

Use the native HTML element that matches the behavior whenever possible.

Add ARIA only when native semantics are insufficient. Do not add roles or attributes that conflict with the rendered element's behavior.

## Ownership

For every interactive or semantic part, identify the owner of:

- native element or role;
- accessible name and description;
- focus and tab order;
- disabled or readonly behavior;
- semantic state exposure;
- target area;
- keyboard and pointer activation.

Do not split one concern implicitly between parent, child, consumer, and foundation.

## Color and contrast

Use Material color roles in their intended pairings. Do not remap roles for appearance when doing so can break contrast, dynamic color, or future contrast modes.

Focus indicators and non-color state cues must remain perceivable against every supported container role.

## Target area

The component owns target-area requirements published for its supported surface. Consumers must not need undocumented surrounding padding to make a control accessible.

## Verification

Use the proof type that observes the changed contract:

- component tests for native element, accessible name, explicit ARIA, disabled/readonly, and semantic-state wiring;
- browser tests for focus order, keyboard operation, pointer targets, overlays, and restoration;
- visual checks for focus indicators, target geometry, and contrast-sensitive state appearance;
- assistive-technology smoke testing for complex composite widgets when required behavior cannot be established otherwise.

Automated accessibility scans are supplemental and do not replace interaction verification.
