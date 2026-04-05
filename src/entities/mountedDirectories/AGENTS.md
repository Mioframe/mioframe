# src/entities/mountedDirectories

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/mountedDirectories` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useFileSystem.ts`: entity-facing mounted-directory and filesystem state.
- `index.ts`: public entry point.

## Patterns

- Keep mounted-directory state on top of shared filesystem services rather than direct browser API usage.
- Treat mount/disconnect and directory visibility as entity state with explicit side effects.
- Keep directory-picker dialogs, browser permission prompts, and user-action orchestration in `features`, not in entity composables.

## Anti-patterns

- Do not bypass the entity contract for mount, disconnect, or directory mutation flows.
- Do not mix mounted-directory state with unrelated repository or document logic.

## Constraints

- Changes here affect local directory selection, mount state, and filesystem-backed flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of mount/disconnect or directory selection behavior.
