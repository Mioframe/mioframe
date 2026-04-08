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
- Use the `MD*` prefix only for shared UI components that intentionally follow Material Design visual and interaction conventions.
- Prefer a concrete surface suffix in component names, such as `Dialog`, `Sheet`, `ListItem`, `Field`, `Button`, `Table`, or `Layout`, over vague role-based names.
- Accessibility, keyboard behavior, and focus management are part of the component contract.
- Shared UI should remain neutral enough for use from multiple domain scenarios.
- Extend existing primitives through props or slots before adding another near-duplicate component.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple generic UI to document, property, or view models.
- Do not place global styles here; use `src/app` for that.
- Do not break widely used base component APIs without a clear reason and migration plan.

## Constraints

- Base control and layout changes have a wide UI blast radius.
- Interactive component changes should be checked for mouse, keyboard, and focus behavior, not just appearance.
- Use `index.ts` as the public entry point when present.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected interaction behavior.
