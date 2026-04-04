# src/features/databaseItemEdit

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseItemEdit` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DbItemEditDialog.vue`: edit flow for an existing item.
- `DbItemAddDialog.vue`: add flow built on the same editing contract.
- `index.ts`: public feature entry point.

## Patterns

- Keep add and edit on top of the same editing contract wherever possible.
- Keep value editing property-aware and type-aware.
- Persist through entity/service APIs rather than direct item mutation.

## Anti-patterns

- Do not duplicate the form between add and edit without a strong reason.
- Do not lose the mapping between property type and concrete value editor.
- Do not leave dialog state dirty after close or reopen.

## Constraints

- Changes here affect add/edit flows across multiple supported property types.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of add/edit item flows.
