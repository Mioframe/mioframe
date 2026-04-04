# src/entities/directory

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/directory` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDirectory.ts`: entity API for directory contents.
- `DirectoryContentList.vue` and `DirectoryContentEntry.vue`: directory listing UI fragments.
- `index.ts`: public entry point.

## Patterns

- Treat directory contents as reactive filesystem state rather than a static snapshot.
- Keep file and directory entry differences explicit in typed contracts.
- Keep UI fragments neutral with respect to destructive feature actions.

## Anti-patterns

- Do not mix listing logic with rename, remove, or create flows.
- Do not assume filesystem state is synchronous or stable.
- Do not blur entity data concerns with presentation-only grouping rules.

## Constraints

- Changes here should be checked in Repo Explorer and other directory navigation flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of directory listing/navigation behavior.
