# src/shared/lib/databaseDocument

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/databaseDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `types.ts`: canonical database document types.
- `databaseDocument.ts` and related constants: base document contract.
- nested schema and migration modules for properties, items, views, and related parts of the document.
- `index.ts`: public entry point.

## Patterns

- Treat this directory as the canonical source of schema, types, and constants for database documents.
- Update types, validation, and migrations together whenever document shape changes.
- Store durable data in the document schema, not temporary UI state.

## Anti-patterns

- Do not add fields that only exist for one screen or one rendering shortcut.
- Do not duplicate database document constants in entities or features.
- Do not change enum-like values without checking serialization and backward compatibility.

## Constraints

- Changes here affect services, entities, features, import/export behavior, and old-document loading.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and checks for types, validation, and migrations in the touched schema path.
