# src/entities/cfrDocument

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/cfrDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDocument.ts`: entity-level access to document state.
- `DocumentMDListItem.vue`: document list item UI.
- `DatabaseDocumentSelectOption.vue`: document selection UI.
- `index.ts`: public entry point.

## Patterns

- Read and write document state through the composable contract.
- Keep document-related UI light and free of feature-flow orchestration.
- Treat document handles and subscriptions as lifecycle-managed resources.

## Anti-patterns

- Do not mutate document structure directly.
- Do not mix page/widget orchestration into this entity access layer.
- Do not move schema ownership here when it belongs in `shared/lib/databaseDocument`.

## Constraints

- Changes to the composable API affect document selection, listing, and edit flows above this layer.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected document selection/listing flow.
