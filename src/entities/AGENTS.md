# src/entities

Inherits the rules from the root `AGENTS.md`. Applies to `src/entities` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- document-oriented entities such as `cfrDocument`.
- database entities such as `databaseData`, `databaseProperty`, `databaseView`, `databaseFilter`, `databaseValue`, and typed value modules.
- filesystem/settings/integration entities such as `directory`, `fsEntry`, `mountedDirectories`, `localSettings`, and `googleUserInfo`.

## Patterns

- An entity provides domain-facing composables, typed access patterns, and small reusable UI fragments.
- `entities` may import only `shared`.
- Keep canonical domain access patterns here rather than redistributing them into features or widgets.
- Entity components should stay small and reusable across higher-level flows.

## Anti-patterns

- Do not move screen flows or dialog orchestration into `entities`.
- Do not bypass shared service/lib contracts with direct storage or API access.
- Do not duplicate schema constants or domain types across sibling entity directories.
- Do not turn entity components into heavy composition containers.

## Constraints

- Entity API changes usually affect features and widgets above this layer.
- Persistent behavior changes must preserve or intentionally revise loading/error/mutation contracts.
- Use `index.ts` as the external entry point when present.
- Minimum verification: `pnpm type-check` and a focused smoke or test check for the touched entity scenario.
