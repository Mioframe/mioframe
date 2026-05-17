# Buttons, icon buttons, and FAB

Buttons communicate actions. In Mioframe, button choice should reflect action priority, not visual preference.

## Button hierarchy

Use higher-emphasis variants for higher-value actions:

- filled button — primary action on a screen, dialog, or form;
- filled tonal button — medium emphasis action that should still stand out;
- outlined button — secondary action that needs visible boundary;
- text button — low-emphasis action, often in dialogs and compact surfaces;
- icon button — compact action with a recognizable icon and accessible label;
- FAB — single prominent creation or primary transformation action for a surface.

## Project rules

- Do not put several filled buttons in the same action group unless they are equally primary.
- Dialog actions should stay simple and direct. Avoid nested decisions inside dialogs.
- Prefer two explicit entry actions when the user is choosing between different flows, for example open existing space vs create new space.
- Icon-only buttons must have an accessible label and visible focus state.
- Button labels should be action verbs, not nouns when possible.
- Destructive actions require explicit wording and error/destructive color only when the action is truly destructive.
- Loading buttons should prevent duplicate activation and preserve layout width when practical.

## Existing components

- `src/shared/ui/Button/MDButton.vue`
- `src/shared/ui/Button/MDIconButton.vue`
- `src/shared/ui/Button/MDFab.vue`

## Review checklist

- Is there only one visually primary action in the group?
- Does the variant match the action priority?
- Does the label describe the action result?
- Does an icon-only button have an accessible label?
- Are focus, hover, pressed, disabled, and loading states covered?
- Does the layout work on compact touch screens?
