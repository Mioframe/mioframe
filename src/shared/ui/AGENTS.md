# src/shared/ui

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/ui` and its descendants until a deeper `AGENTS.md` refines it.

Use the `shared-ui-implementation` skill for detailed guidance on Vue state composition, DOM-critical attrs, native activation semantics, parent/child styling boundaries, and browser-specific CSS when implementing or reviewing shared UI / Material primitives.

## Contains

- Shared presentation primitives, layout building blocks, overlay infrastructure, and interaction helpers.

## Patterns

- Drive components through props, emits, slots, and composables rather than hidden global state.
- Keep public props explicit, small, and domain-agnostic.
- Accessibility, keyboard behavior, and focus management are part of the component contract.
- Extend an existing primitive through props or slots before adding a near-duplicate component.
- Keep scroll-aware, sticky, floating, and teleport-aware behavior tied to the actual rendered DOM hierarchy.
- Do not write styles that affect the styling or positioning of neighboring elements in the parent flow. External spacing or visual treatment may move or style the component itself, but must not reach outward and change how adjacent elements are laid out or rendered.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple shared UI to document, property, or view models.
- Do not hide multiple unrelated behaviors behind one broad `options` prop.

## Constraints

- Base control and layout changes have a wide UI blast radius.
- Minimum verification: run `pnpm verify --only type-check`, then use focused verify-managed browser or visual checks for the touched control when keyboard, pointer, focus, overlay, scroll-container, or appearance contracts changed. Final completion still requires `pnpm verify`.
