# src/features/databasePropertyCreate

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databasePropertyCreate` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- The flow for creating a database property from a user-editable draft.

## Patterns

- Keep the draft state valid enough to map cleanly into the persisted property contract on submit.
- Source property kinds, defaults, and validation from canonical schema helpers rather than local copies.
- Keep close, reset, and post-create follow-up behavior owned in one place.

## Anti-patterns

- Do not submit partially valid property payloads.
- Do not hardcode property kinds or scatter post-create side effects across multiple components.

## Constraints

- Changes here affect property rendering, editors, filters, and sorting flows.
- Minimum verification: `pnpm type-check`, then create a property of the touched kind, confirm it appears in the current view and related editors, and reopen the dialog to confirm the draft reset.
