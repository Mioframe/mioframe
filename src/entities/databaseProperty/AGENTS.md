# src/entities/databaseProperty

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseProperty` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Database property read models and reusable property display primitives.

## Patterns

- Use canonical property kinds, labels, and schema-driven metadata.
- Route property reads and writes through the entity contracts in this directory.
- Keep property UI small, reusable, and display-oriented.

## Anti-patterns

- Do not hardcode property kinds or duplicate property metadata in UI fragments.
- Do not move create or edit dialog orchestration into this entity layer.

## Constraints

- Property contract changes affect rendering, editors, filters, sorting, and persistence.
- Minimum verification: run `pnpm verify --only type-check`, then confirm the touched property kind still renders in list or table surfaces and remains usable from create, edit, filter, or sort flows. Use focused verify-managed coverage where available. Final completion still requires `pnpm verify`.
