# src

Inherits the rules from the root `AGENTS.md`. Applies to `src` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Application source code for app bootstrap, pages, widgets, features, entities, shared services, and shared UI.

## Patterns

- Use the `material-design-3` skill for UI work that touches components, typography, layout, adaptive behavior, color roles, shape, elevation, motion, interaction states, or accessibility.
- Keep user-facing UI mobile-first and Material 3-aligned before optimizing for wider desktop layouts.
- Prefer existing shared `MD*` primitives, Material tokens, and layout components before adding local CSS or a new one-off component.
- When Material guidance and product requirements conflict, make the product decision explicit in the task, PR, or nearest maintainable code comment.

## Anti-patterns

- Do not introduce ad hoc visual systems beside Material tokens and shared primitives.
- Do not implement desktop-only hover or wide-screen behavior as the primary interaction path.
- Do not choose dialogs for ordinary branching, navigation, or supplemental selection when a sheet, menu, pane, or explicit action fits the Material model better.

## Constraints

- UI changes that affect real DOM layout, focus, keyboard navigation, pointer or touch behavior, overlays, scrolling, responsive styling, Material state visuals, or mobile behavior must also follow the `ui-browser-behavior` skill.
- Visual appearance changes must also follow the `visual-regression-testing` skill when screenshot coverage or visual state verification is relevant.