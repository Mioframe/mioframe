# src/shared/service/fileSystem

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/fileSystem` and its descendants.

## Contains

- File-system service wiring, mounted-directory refresh behavior, persisted directory handle hydration, and UI-facing filesystem service queries.

## Patterns

- Re-read mounted directory contents by path after create or provider update events. Do not synthesize final directory listings from watch payloads or provider create success alone.
- Treat persisted `FileSystemDirectoryHandle` values as runtime-validated boundary data, not as type-only guarantees.
- Keep provider, VFS, and mounted-directory flows aligned on refresh and hydration behavior.

## Anti-patterns

- Do not trust create-event payloads to fully describe the post-create directory state.
- Do not hydrate stored handles without the runtime guard that matches the active browser or test environment.

## Constraints

- Changes here affect mounted directories, persisted handles, and browser filesystem flows at once.
- Minimum verification: `pnpm type-check`, then run focused filesystem service tests for refresh behavior, provider updates, and handle hydration when those paths change.
