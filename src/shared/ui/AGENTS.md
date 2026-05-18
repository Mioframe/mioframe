# src/shared/ui

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/ui` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Shared presentation primitives, Material-style controls, layout building blocks, overlay infrastructure, and interaction helpers.

## Patterns

- Use the `material-design-3` skill for every non-trivial shared UI change.
- Drive components through props, emits, slots, and composables rather than hidden global state.
- Keep public props explicit, small, and domain-agnostic.
- Accessibility, keyboard behavior, touch behavior, text resizing, and focus management are part of the component contract.
- Extend an existing primitive through props or slots before adding a near-duplicate component.
- Keep scroll-aware, sticky, floating, and teleport-aware behavior tied to the actual rendered DOM hierarchy.
- Prefer Material system tokens and component-local `--md-*` variables over hard-coded values. Hard-code only documented fixed component geometry or values that cannot reasonably be tokenized.
- Keep Material state visuals complete for each supported state: enabled, disabled, hovered, focused, pressed, selected, loading, and error.
- Preserve paired color roles: container roles must use matching `on-*` roles for text and icons.
- Keep labels, supporting text, error text, and accessible names visible or programmatically determinable according to the component contract.
- Do not write styles that affect the styling or positioning of neighboring elements in the parent flow. External spacing or visual treatment may move or style the component itself, but must not reach outward and change how adjacent elements are laid out or rendered.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple shared UI to document, property, or view models.
- Do not hide multiple unrelated behaviors behind one broad `options` prop.
- Do not create a new shared `MD*` component from one screen-specific need without first checking whether an existing primitive can be extended.
- Do not use local CSS to bypass missing Material tokens, typography roles, color roles, state layers, or layout primitives without documenting the gap.

## Constraints

- Base control and layout changes have a wide UI blast radius.
- Minimum verification: `pnpm type-check`, then check the touched control with keyboard and pointer input and recheck real focus, overlay, responsive, and scroll-container behavior when those contracts changed.
- Shared primitive visual changes should have Storybook coverage or an explicit reason why a browser smoke check is sufficient.