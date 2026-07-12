# src/shared

Inherits the rules from `src/AGENTS.md`. Applies to `src/shared` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Cross-layer infrastructure, background services, shared UI, reusable utilities, adapters, schemas, and configuration.

## Patterns

- Code in `shared` must remain independent of upper-layer business context or define a formal lower-level contract owned by shared infrastructure.
- Multiple current consumers are not required; ownership is determined by dependency direction and responsibility, not call-site count.
- Keep public submodule APIs small and predictable.
- Place validation, adapters, and boundary wrappers close to the infrastructure they protect.
- Shared UI and infrastructure should solve an upper-layer-independent concern, not encode one feature's business scenario.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, `pages`, or `app` from `shared`.
- Do not move code into `shared` just because it is convenient to import.
- Do not generalize an API merely to manufacture reuse or additional consumers.
- Do not hide singleton behavior or global side effects without explicit ownership.

## Constraints

- A module with one current consumer may remain in `shared` when its responsibility is genuinely upper-layer-independent and its API does not encode that consumer's business context.
- Minimum verification: run the type-check gate through `pnpm verify --only type-check`, plus focused verify-managed tests or smoke checks for the specific shared contract that changed.
