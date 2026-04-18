# src/entities

Inherits the rules from the root `AGENTS.md`. Applies to `src/entities` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Domain read models, typed access composables, and small reusable domain UI fragments.

## Patterns

- `entities` may import only `shared`.
- Keep canonical domain access patterns and derived read state here rather than redistributing them into features or widgets.
- Keep entity UI small, reusable, and display-oriented.
- Keep entity props and composable inputs narrow: IDs, display records, and small query inputs are preferred over services, mutation bundles, or broad mutable models.
- Entity UI may render domain state and emit intents, but user mutation flows, confirmation logic, and snackbar orchestration belong in `features`.
- Keep stored and derived read contracts explicitly named rather than mixing them into one vague entity API.

## Anti-patterns

- Do not move dialog flows, action menus, or submit orchestration into `entities`.
- Do not bypass shared contracts with direct storage or API access.
- Do not turn entity components into heavy composition containers.

## Constraints

- Entity API changes usually affect features and widgets above this layer.
- Minimum verification: `pnpm type-check`, then exercise the touched entity through at least one consuming feature or widget and confirm loading, display, and emitted intents still match the contract.
