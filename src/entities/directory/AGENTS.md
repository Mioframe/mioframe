# src/entities/directory

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/directory` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Reactive directory listing state and small reusable UI for rendering directory entries.

## Patterns

- Treat directory contents as live filesystem state rather than a static snapshot.
- Keep file and directory distinctions explicit in typed contracts and rendered UI.
- Render state and emit intents here, but leave rename, create, and remove flows to features.

## Anti-patterns

- Do not mix directory listing state with destructive action orchestration.
- Do not assume filesystem state is synchronous or stable across navigation.

## Constraints

- Changes here affect repository and local-filesystem navigation surfaces.
- Minimum verification: `pnpm type-check`, then enter the touched directory view, trigger a rename, create, or remove flow through the existing features, and confirm the listing updates without losing navigation state.
