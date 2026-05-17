# Tokens

Mioframe uses Material 3-style CSS custom properties as the design contract between global theme data and shared UI components.

## Token layers

### Reference tokens

Reference tokens describe raw palette and typeface values. In Mioframe these are represented by variables such as:

- `--md-ref-palette-primary40`
- `--md-ref-palette-neutral98`
- `--md-ref-typeface-plain`

Do not use reference tokens directly in component styles unless the component is defining or remapping a system role.

### System tokens

System tokens describe semantic roles used across the app:

- color: `--md-sys-color-primary`, `--md-sys-color-surface`, `--md-sys-color-on-surface`, `--md-sys-color-outline`;
- shape: `--md-sys-shape-corner-small`, `--md-sys-shape-corner-large`, `--md-sys-shape-corner-full`;
- elevation: `--md-sys-elevation-level0` to `--md-sys-elevation-level5`;
- typography: `--md-sys-typescale-body-medium-*`, `--md-sys-typescale-title-medium-*`;
- state: `--md-sys-state-hover-state-layer-opacity`, `--md-sys-state-focus-state-layer-opacity`, `--md-sys-state-pressed-state-layer-opacity`;
- motion: `--md-sys-motion-duration-*`, `--md-sys-motion-easing-*`.

Shared UI components should prefer system tokens.

### Component tokens

Component tokens customize a specific component surface or part, for example `--md-comp-progress-indicator-active-indicator-color`.

Use component tokens when a style belongs to one component family and should not become a global semantic role.

## Project rules

- Keep tokens in `src/shared/lib/md/tokens.css` unless there is a clear reason to split by theme or platform.
- Do not hardcode colors in components when a system color role exists.
- Do not hardcode type sizes in components when a typescale token exists.
- Do not introduce one-off CSS variables with vague names such as `--border-color` or `--main-bg` inside shared components.
- Use `on-*` color roles with their matching background roles.
- Use component tokens for component internals, not product-specific screen layout.
- Dark theme overrides belong near the token definition, not inside individual components.

## Review checklist

- Does the component consume system/component tokens rather than raw palette values?
- Are light and dark theme values covered?
- Does the token name describe a semantic role rather than a visual accident?
- Is the fallback useful for debugging?
- Could the token be reused by another component without weakening its meaning?
