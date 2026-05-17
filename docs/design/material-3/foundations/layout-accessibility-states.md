# Layout, accessibility, and states

Mioframe is a compact-first data application. Layout, accessibility, and interaction states are part of the same UI contract.

## Layout

Project rules:

- Start from compact/mobile layout, then expand.
- Preserve full functionality on compact screens.
- Prefer progressive disclosure over hiding important actions.
- Avoid dialog branching when the user is choosing between clearly different flows; use explicit entry actions instead.
- Keep repeated actions close to the content they affect.
- Do not create dense desktop-only affordances that are hard to discover on touch devices.
- Prefer wrapping labels over ambiguous icons when the action is not obvious.

## Touch targets

- Interactive controls must be comfortable for touch use.
- Adjacent controls need enough spacing to avoid accidental activation.
- Icon-only controls need accessible names and visible focus.
- Dense table/list controls should still have reliable pointer and keyboard affordances.

## Accessibility

Project rules:

- Every icon-only button needs an accessible label.
- Form fields need stable visible labels or equivalent accessible labels.
- Validation errors must be connected to the relevant field.
- Focus must remain visible and logical during keyboard navigation.
- Dialogs and menus must manage focus according to their interaction model.
- Disabled state must not be the only way to explain why an action is unavailable.

## Interaction states

Every reusable component should define or inherit states for enabled, hover, focus-visible, pressed, selected or checked, disabled, error, and loading when those states apply.

Use existing state opacity tokens for hover, focus, and pressed state layers. Do not replace state layers with unrelated background colors unless this is a deliberate component exception.

## Soft disabled

Use soft-disabled behavior only when the disabled control must remain keyboard-discoverable, for example in a toolbar where the unavailable action teaches the user what may become available later.

Do not use soft-disabled controls as a substitute for clear validation or permission messaging.

## Review checklist

- Can the flow be completed on a compact touch device?
- Does the keyboard path match visual order?
- Are focus, hover, pressed, disabled, selected, error, and loading states covered?
- Are icon-only controls named?
- Are disabled controls explained when the reason is not obvious?
