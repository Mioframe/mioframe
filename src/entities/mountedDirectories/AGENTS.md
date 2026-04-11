# src/entities/mountedDirectories

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/mountedDirectories` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Entity-facing mounted-directory state and derived filesystem visibility built on shared filesystem services.

## Patterns

- Keep mount and disconnect state on top of shared filesystem services rather than direct browser APIs.
- Expose mounted-directory state as read contracts plus explicit intents.
- Leave directory pickers, permission prompts, and other user-action surfaces to features.

## Anti-patterns

- Do not bypass this entity contract for mount or disconnect flows.
- Do not mix mounted-directory state with unrelated repository or document logic.

## Constraints

- Changes here affect local directory selection, mounted-directory visibility, and disconnect flows.
- Minimum verification: `pnpm type-check`, then mount or disconnect the touched directory source through the existing feature and confirm the visible state updates in the consuming screen.
