# src/shared/ui

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/ui` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- base controls: `Button`, `Checkbox`, `TextField`, `Select`, `Menu`, `Dialog`.
- layout and navigation primitives: `Layout`, `AppBar`, `Toolbar`, `Navigation`.
- display components: `Lists`, `Chips`, `Table`, `Tooltips`, `EmptyState`, `ProgressIndicators`, `Snackbar`.
- interaction and overlay helpers: `Overlay`, `Sheets`, `State`.
- other generic building blocks such as `Query`, `NavigationPath`, and `performance`.

## Patterns

- Components should be driven by props, emits, slots, and composables.
- Shared UI component props should stay small, explicit, and domain-agnostic. Prefer primitives, simple option records, and slot APIs over opaque config objects or nested domain payloads.
- Use the `MD*` prefix only for shared UI components that intentionally follow Material Design visual and interaction conventions.
- Prefer a concrete surface suffix in component names, such as `Dialog`, `Sheet`, `ListItem`, `Field`, `Button`, `Table`, or `Layout`, over vague role-based names.
- Accessibility, keyboard behavior, and focus management are part of the component contract.
- Shared UI should remain neutral enough for use from multiple domain scenarios.
- Extend existing primitives through props or slots before adding another near-duplicate component.
- Prefer determinate progress presentation when callers can provide real progress. Indeterminate spinners are the fallback for work that has no trustworthy progress signal.
- For primitives that derive behavior from DOM position, such as components using `useParentElement`, `useCurrentElement`, teleport targets, sticky layout, or floating positioning, preserve the expected parent-child structure unless the dependency is intentionally redesigned and rechecked in the browser.
- When a shared UI primitive depends on a specific scroll container or DOM ancestor, make that dependency explicit in code comments or in the surrounding composition instead of relying on a misleading wrapper name.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple generic UI to document, property, or view models.
- Do not place global styles here; use `src/app` for that.
- Do not hide multiple behaviors behind one broad `options` prop when a few explicit props or slots would keep the public API clearer.
- Do not break widely used base component APIs without a clear reason and migration plan.

## Constraints

- Base control and layout changes have a wide UI blast radius.
- Interactive component changes should be checked for mouse, keyboard, and focus behavior, not just appearance.
- Changes to overlay, sticky, floating, teleport, or scroll-aware primitives must be checked against the real scroll container and rendered DOM parentage, not only against template indentation.
- Use `index.ts` as the public entry point when present.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected interaction behavior.
