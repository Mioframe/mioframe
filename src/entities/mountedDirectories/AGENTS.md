# src/entities/mountedDirectories

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/mountedDirectories` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useFileSystem.ts`: entity-facing mounted-directory and filesystem state.
- `MountedDirectoriesList.vue`: mounted-directory UI fragment.
- `index.ts`: public entry point.

## Patterns

- Keep mounted-directory state on top of shared filesystem services rather than direct browser API usage.
- Treat mount/unmount and directory visibility as entity state with explicit side effects.
- Keep UI fragments focused on representation and entry-point actions, not low-level filesystem logic.

## Anti-patterns

- Do not bypass the entity contract for mount, unmount, or directory mutation flows.
- Do not hide filesystem permission assumptions inside UI fragments.
- Do not mix mounted-directory state with unrelated repository or document logic.

## Constraints

- Changes here affect local directory selection, mount state, and filesystem-backed flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of mount/unmount or directory selection behavior.
