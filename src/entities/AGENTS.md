# src/entities

Inherits the rules from `src/AGENTS.md`. Applies to `src/entities` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Domain read models, typed access composables, and small reusable domain UI fragments.

## Patterns

- `entities` may import only `shared`.
- Keep canonical domain access patterns and derived read state here rather than redistributing them into features, widgets, or pages.
- Keep entity UI small, reusable, and display-oriented.
- Keep entity props and composable inputs narrow: IDs, display records, and small query inputs are preferred over services, mutation bundles, provider objects, or broad mutable models.
- Entity UI may render domain state and emit intents, but user mutation flows, confirmation logic, permission prompts, and snackbar orchestration belong in `features` or higher composition.
- Keep stored and derived read contracts explicitly named rather than mixing them into one vague entity API.
- Entity composables may adapt service query results into typed domain facts, but must not duplicate service-owned scans, indexing, persistence, or lifecycle decisions.

## Anti-patterns

- Do not move dialog flows, action menus, submit orchestration, or browser prompt orchestration into `entities`.
- Do not bypass shared contracts with direct storage or API access.
- Do not turn entity components into heavy composition containers.
- Do not expose provider capabilities, browser handles, service clients, or mixed read/write models through ordinary entity display records.
- Do not define provider-specific errors here unless the entity itself detects the failure.

## Constraints

- Entity API changes usually affect features and widgets above this layer.
- Minimum verification: `pnpm type-check`, then exercise the touched entity through at least one consuming feature or widget and confirm loading, display, and emitted intents still match the contract.
