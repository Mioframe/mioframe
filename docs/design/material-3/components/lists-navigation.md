# Lists and navigation

Lists and navigation surfaces must keep dense data usable on compact screens.

## Lists

Use lists for repeated items that share a structure. A list item should communicate the item identity, key supporting metadata, and available action path.

Project rules:

- List items must support multiline content when item identity or state cannot be safely understood in one line.
- Do not truncate user-critical names by default.
- Keep primary text, secondary text, leading icon/avatar, and trailing actions visually distinct.
- Avoid placing too many trailing actions inside each row.
- Row activation and nested actions must not conflict.
- Empty, loading, and error list states need explicit copy.

## Navigation

Navigation should expose stable product structure, not temporary actions.

Project rules:

- Use tabs for peer sections in the same context.
- Do not use tabs as filters unless the user perceives them as stable categories.
- Keep navigation labels short and concrete.
- Preserve current location after refresh and back navigation where possible.
- On compact screens, avoid hiding the only path to important functionality behind unclear icons.

## Toolbar containers

Existing component:

- `src/shared/ui/Toolbar/MDToolbarContainer.vue`

Toolbar actions should be ordered by task frequency and risk. Destructive actions should not sit next to high-frequency safe actions without spacing or confirmation.

## Review checklist

- Can long item names wrap without breaking layout?
- Is truncation safe and recoverable?
- Are trailing actions clear and reachable on touch devices?
- Is selected/current navigation state visible?
- Does keyboard navigation follow the visual order?
