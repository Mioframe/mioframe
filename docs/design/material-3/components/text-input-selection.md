# Text input and selection controls

Text fields, checkboxes, and chips are high-frequency controls in Mioframe. They must stay predictable, readable, and accessible on compact screens.

## Text fields

Use text fields for direct user input. Keep labels stable and visible when the value is empty or focused.

Project rules:

- Prefer explicit labels over placeholders.
- Placeholder text must not replace a label.
- Helper text should explain format, consequence, or recovery, not restate the label.
- Error text should say what is wrong and how to fix it.
- Preserve focus visibility.
- Avoid putting complex branching flows inside a text field interaction.
- Do not truncate the active value while the user is editing.

Existing component:

- `src/shared/ui/TextField/MDTextField.vue`

## Checkboxes

Use checkboxes for independent boolean choices.

Project rules:

- The label must describe the checked state clearly.
- Do not use a checkbox for mutually exclusive options; use another pattern.
- Keep label and checkbox activation area connected.
- Support keyboard interaction and visible focus.
- Error state should be used only when the choice is required or invalid.

Existing component:

- `src/shared/ui/Checkbox/MDCheckbox.vue`

## Chips

Use chips for compact pieces of selection, filtering, or metadata.

Project rules:

- Use chips for lightweight classification or quick filters, not primary page navigation.
- Do not use chips when a normal button or list row would be clearer.
- Selected state must be visually clear and accessible.
- Removable chips need a clear remove action and accessible name.
- Long chip labels should wrap only if the surrounding layout supports it; otherwise use a detail surface.

Existing component:

- `src/shared/ui/Chips/MDChip.vue`

## Review checklist

- Does each input have a stable label?
- Are helper and error texts actionable?
- Are selected/checked states visually clear?
- Does keyboard interaction work?
- Does the control remain usable on compact screens?
