# src/shared/service/databaseDocument

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/databaseDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Low-level database document queries and mutations, including data, property, view, sorting, and filtering service logic.

## Patterns

- Keep query keys and inputs complete for every parameter that changes the result set.
- Keep mutations atomic and explicit about invalidation side effects.
- Resolve stored versus effective default-aware reads in this service layer rather than redistributing that logic upward.
- Coordinate document-structure changes with schema, migration, and type updates.

## Anti-patterns

- Do not add UI presentation or screen orchestration here.
- Do not introduce hidden read-time side effects.
- Do not let data, property, and view operations drift into incompatible contracts.

## Constraints

- This directory defines contracts used by many entities and features.
- Minimum verification: `pnpm type-check`, run focused database-document tests for the touched branch, then verify create, edit, remove, sort, or filter flows still produce correct invalidation and persisted results.
