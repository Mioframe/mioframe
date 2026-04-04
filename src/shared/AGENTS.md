# src/shared

Inherits the rules from the root `AGENTS.md`. Applies to `src/shared` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `lib/`: utilities, composables, adapters, schema helpers, migrations, filesystem/API abstractions.
- `service/`: infrastructural services, worker wiring, storage wiring, Google and document services.
- `ui/`: reusable UI primitives and interaction helpers.
- root shared modules such as configuration files.

## Patterns

- Code in `shared` should be domain-agnostic or define a formal cross-layer contract.
- Keep public submodule APIs small and predictable.
- Place validation, adapters, and wrappers close to the infrastructure they protect.
- Shared UI and infrastructure should solve recurring problems, not single business cases.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, `pages`, or `app` from `shared`.
- Do not move code into `shared` just because it is convenient to import.
- Do not mix business terminology into generic UI or infrastructure without a real cross-layer contract.
- Do not hide global side effects or singleton behavior without making ownership explicit.

## Constraints

- Any module in `shared` should remain usable from multiple upper layers.
- If a directory exposes an `index.ts`, treat it as the external entry point unless documented otherwise.
- Minimum verification: `pnpm type-check`; add focused tests or smoke checks for infrastructure changes.
