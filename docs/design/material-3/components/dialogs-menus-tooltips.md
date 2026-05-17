# Dialogs, menus, and tooltips

Dialogs, menus, and tooltips are temporary surfaces. They should reduce uncertainty, not become hidden application flows.

## Dialogs

Use dialogs for important prompts that interrupt the current flow and require a decision or acknowledgement.

Project rules:

- Dialogs should have a clear headline unless the accessible name is provided another way.
- Keep dialog content focused on one decision.
- Do not use a dialog as a branching wizard when separate entry actions would be clearer.
- Actions should be explicit and limited.
- Destructive confirmations should name the destructive result.
- Dialog size should be controlled by layout constraints, not arbitrary content overflow.

## Menus

Use menus for compact sets of contextual commands.

Project rules:

- Menu items should be short action labels.
- Do not put long explanations inside a menu item.
- Use disabled menu items only when their presence helps discoverability.
- Preserve keyboard navigation and focus return.
- Prefer a visible button or list row when the action is important enough to show directly.

## Tooltips

Use tooltips for brief explanatory text for icon-only controls or ambiguous affordances.

Project rules:

- Tooltips must be short.
- Tooltip text should wrap within its max width instead of overflowing.
- Do not rely on tooltips for essential information on touch devices.
- Do not use tooltips as validation or error messages.
- The control must remain understandable without hover.

## Review checklist

- Is this really a temporary surface, or should it be inline content?
- Is focus managed correctly?
- Does the surface close predictably?
- Is the content concise enough for compact screens?
- Is the user making one clear decision?
