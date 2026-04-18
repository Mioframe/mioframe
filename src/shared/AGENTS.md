# src/shared

Inherits the rules from the root `AGENTS.md`. Applies to `src/shared` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Cross-layer infrastructure, background services, shared UI, reusable utilities, adapters, schemas, and configuration.

## Patterns

- Code in `shared` should either stay domain-agnostic or define a formal contract reused by multiple upper layers.
- Keep public submodule APIs small and predictable.
- Place validation, adapters, and boundary wrappers close to the infrastructure they protect.
- Shared UI and infrastructure should solve recurring problems, not one-off business cases.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, `pages`, or `app` from `shared`.
- Do not move code into `shared` just because it is convenient to import.
- Do not hide singleton behavior or global side effects without explicit ownership.

## Constraints

- Any module in `shared` should remain reusable from multiple upper layers.
- Minimum verification: `pnpm type-check`, plus focused tests or smoke checks for the specific shared contract that changed.
