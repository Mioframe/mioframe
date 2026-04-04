# src/shared/service/databaseDocument

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/databaseDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `databaseService.ts`: shared database document service.
- `databasePropertiesService.ts`: property operations.
- `databaseDataService.ts`: item operations.
- `types.ts` and `index.ts`: shared types and public API.
- `data/` and `view/`: query, sorting, filtering, and view-specific service logic.

## Patterns

- Keep query and mutation primitives for database documents here.
- Ensure query keys and input contracts account for all result-shaping parameters.
- Keep mutations as atomic and predictable as the data model allows.
- Normalize service-layer errors here instead of pushing low-level details upward.

## Anti-patterns

- Do not add UI presentation or screen orchestration here.
- Do not change document structure without coordinated schema, migration, and type updates.
- Do not add hidden read-time side effects.
- Do not break consistency between data, property, and view operations.

## Constraints

- This directory defines low-level contracts used by many entities and features.
- Sorting and filtering changes must be checked for persistence and cache/subscription correctness.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused tests or smoke checks for touched database document operations.
