# Typography

Mioframe typography should use the Material 3 type scale as semantic UI roles. Do not choose font size only by visual preference.

## Type scale roles

### Display

Use display styles rarely. They are for large marketing or onboarding moments, not dense application UI.

### Headline

Use headline styles for major page or pane titles when there is enough room and the title anchors the whole surface.

### Title

Use title styles for app bars, dialogs, cards, sheets, list section headers, and prominent form groups.

### Body

Use body styles for primary readable content, form help text, settings descriptions, dialog body text, and markdown content.

### Label

Use label styles for buttons, chips, compact metadata, navigation labels, field labels, and low-density control text.

## Project usage

- Prefer `body-medium` for normal application copy.
- Prefer `body-small` for secondary metadata only when it remains readable on compact screens.
- Prefer `title-medium` or `title-small` for dense app surfaces.
- Use `label-large` for button text and high-emphasis control labels.
- Avoid display styles in ordinary product screens.
- Do not use typography to fake disabled, selected, or error states. Use state, color, and component rules.

## Current implementation notes

`src/shared/lib/md/tokens.css` defines Material 3 typescale token groups for display, headline, title, body, and label. Shared components should consume these tokens or expose a documented local mapping.

## Compact UI rules

Mioframe is mobile-first. On compact screens:

- avoid reducing text below the existing type scale;
- prefer wrapping over truncating when the user must understand the content;
- use truncation only when the full value is still available through context or detail view;
- avoid dense all-caps labels;
- keep line height from the typescale to preserve touch readability.

## Review checklist

- Is the type role semantic and consistent with similar screens?
- Does the text remain readable on compact screens?
- Is wrapping behavior intentional?
- Is truncation safe for the user task?
- Are labels and helper text visually subordinate without becoming unreadable?
