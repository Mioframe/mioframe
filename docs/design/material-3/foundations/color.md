# Color

Material 3 color roles are semantic roles, not visual names. Mioframe components should style surfaces and content through system tokens instead of raw palette values.

## Role groups

### Primary, secondary, tertiary

Use primary roles for the most important actions and active emphasis. Use secondary and tertiary roles for supporting accents, not for arbitrary decoration.

Common pairs:

- `--md-sys-color-primary` with `--md-sys-color-on-primary`;
- `--md-sys-color-primary-container` with `--md-sys-color-on-primary-container`;
- `--md-sys-color-secondary` with `--md-sys-color-on-secondary`;
- `--md-sys-color-tertiary` with `--md-sys-color-on-tertiary`.

### Surface roles

Use surfaces to build hierarchy before adding elevation or borders.

Common roles:

- `--md-sys-color-surface` — base app surface;
- `--md-sys-color-surface-container-lowest` to `--md-sys-color-surface-container-highest` — nested containers;
- `--md-sys-color-on-surface` — main content on surface;
- `--md-sys-color-on-surface-variant` — supporting content;
- `--md-sys-color-outline` and `--md-sys-color-outline-variant` — dividers and boundaries.

### Error roles

Use error roles only for validation, destructive actions, or unrecoverable states.

- `--md-sys-color-error`
- `--md-sys-color-on-error`
- `--md-sys-color-error-container`
- `--md-sys-color-on-error-container`

Do not use error red for neutral warnings or product emphasis.

## Project rules

- Pair every background/container color with its matching `on-*` role.
- Prefer surface-container roles over ad hoc neutral colors.
- Use outline roles for boundaries; do not use arbitrary gray borders.
- Disabled controls should reduce emphasis consistently, not invent new gray values.
- Avoid using primary color for every interactive element; reserve it for the primary path.
- On compact screens, color should clarify hierarchy but not replace labels.

## Current implementation notes

`src/shared/lib/md/tokens.css` already defines light and dark mappings for primary, secondary, tertiary, error, surface, outline, fixed, inverse, scrim, and shadow roles. New shared components should consume these roles instead of adding their own palette.

## Review checklist

- Are text/icon colors readable on the chosen container?
- Does the component use `on-*` roles instead of raw colors?
- Are dark theme values inherited correctly?
- Is primary color reserved for meaningful emphasis?
- Is error color used only for real error/destructive states?
