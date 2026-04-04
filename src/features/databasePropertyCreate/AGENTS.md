# src/features/databasePropertyCreate

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databasePropertyCreate` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DatabasePropertyCreationDialog.vue`: the main property creation flow.
- `index.ts`: public feature entry point.

## Patterns

- Build property drafts through a valid intermediate form state.
- Use canonical property types and schema contracts instead of local duplicates.
- Close and reset the dialog predictably after successful creation.

## Anti-patterns

- Do not create properties from partially valid state.
- Do not hardcode property kinds outside shared constants and schema helpers.
- Do not scatter post-create side effects across multiple components.

## Constraints

- Changes here should be checked against property edit, value rendering, filter, and sorting flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the property creation flow.
