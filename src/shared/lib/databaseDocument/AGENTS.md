# src/shared/lib/databaseDocument

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/databaseDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Canonical database document schema, types, constants, migrations, and default-aware read helpers.

## Patterns

- Treat this directory as the single source of truth for durable database document shape.
- Update types, validation, and migrations together whenever the schema changes.
- Store durable document data here, not temporary UI state.

## Anti-patterns

- Do not add fields that exist only for one screen or rendering shortcut.
- Do not duplicate schema constants in entities, features, or services.
- Do not change serialized enum-like values without compatibility review.

## Constraints

- Changes here affect old-document loading, services, entities, and import or export behavior.
- Minimum verification: `pnpm type-check`, then verify the touched schema path against validation, migration from an older payload, and effective-value behavior when defaults are involved.
