# src/shared/ui

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/ui` and its descendants until a deeper `AGENTS.md` refines it.

Use the `shared-ui-implementation` and `material3-guidelines` skills when implementing or reviewing shared UI / Material primitives. Public Material component-family work must also follow `docs/material-3/component-architecture.md`.

## Contains

- Shared presentation primitives, layout building blocks, overlay infrastructure, and interaction helpers.

## Patterns

- Drive components through props, emits, slots, and composables rather than hidden global state.
- Keep public props explicit, small, and domain-agnostic.
- Accessibility, keyboard behavior, and focus management are part of the component contract.
- Extend an existing primitive through props or slots before adding a near-duplicate component.
- Keep scroll-aware, sticky, floating, and teleport-aware behavior tied to the actual rendered DOM hierarchy.
- Do not write styles that affect the styling or positioning of neighboring elements in the parent flow. External spacing or visual treatment may move or style the component itself, but must not reach outward and change how adjacent elements are laid out or rendered.
- For every new or materially changed public `MD*` component, record `Architecture impact: none`, ready `layered-v1`, or `blocked` before production edits.
- A `layered-v1` component must use the exact production files, layer ownership, token pipeline, state precedence, property owners, and verification matrix from its ready Material component contract.
- If implementation requires an architecture choice not present in the ready contract, stop and return it for resolution; do not infer a reasonable default.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple shared UI to document, property, or view models.
- Do not hide multiple unrelated behaviors behind one broad `options` prop.
- Do not introduce a generic Material base component, token resolver, cross-family state machine, or family-specific knowledge in generic state/ripple/focus primitives.

## Constraints

- Base control and layout changes have a wide UI blast radius.
- Minimum verification: run `pnpm verify --only type-check`, then use focused verify-managed browser or visual checks for the touched control when keyboard, pointer, focus, overlay, scroll-container, state routing, property ownership, or appearance contracts changed. Final completion still requires `pnpm verify`.
