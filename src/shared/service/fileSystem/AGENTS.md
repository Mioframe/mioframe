# src/shared/service/fileSystem

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/fileSystem` and its descendants.

## Contains

- File-system service wiring, persisted directory handle hydration, mounted-directory refresh behavior, VFS provider registration, pending provider access request state, and UI-facing filesystem service queries.

## Patterns

- The file-system service owns VFS runtime state, provider registration, mount/unmount, persisted local directory handle records, mounted-directory refresh, and service query invalidation.
- Main-thread permission prompts and browser user-activation calls belong in `src/shared/serviceClient/fileSystem`, while this service keeps the pending-request registry and refresh wiring.
- This service may coordinate post-grant retry hooks, but Automerge-specific pending-save storage stays owned by repository persistence and repo-cache services rather than by provider adapters.
- Re-read mounted directory contents by path after create or provider update events. Do not synthesize final directory listings from watch payloads or provider create success alone.
- Treat persisted `FileSystemDirectoryHandle` values as runtime-validated boundary data, not as type-only guarantees.
- Keep provider, VFS, and mounted-directory flows aligned on refresh and hydration behavior.
- Preserve provider-supplied directory metadata such as optional descriptions through persisted mounts, VFS reads, and UI-facing queries.
- Service APIs may expose display records and explicit recovery/action APIs, but ordinary UI-facing lists must not include provider capabilities or browser handles.
- Service-owned provider recovery state must be deduplicated and cleaned up. Define lifecycle for created, resolved, denied, stale, and provider-removed requests.
- Service errors belong here only when the service detects the failure. Provider-specific errors must be defined next to the provider and only transformed/transported through the service boundary when needed.

## Anti-patterns

- Do not trust create-event payloads to fully describe the post-create directory state.
- Do not hydrate stored handles without the runtime guard that matches the active browser or test environment.
- Do not call browser permission prompts such as `requestPermission()` from the service or worker side.
- Do not filter remembered local providers out of VFS or UI-facing display queries only because temporary browser access is missing.
- Do not define provider-specific errors in this service when the provider itself detects the condition.
- Do not expose `FileSystemDirectoryHandle`, provider instances, or service internals through `deviceFiles` or other ordinary display queries.
- Do not let pages or widgets create, resolve, or inspect service recovery registries directly when a feature/entity contract should own the user flow.

## Constraints

- Changes here affect mounted directories, persisted handles, browser filesystem flows, and repository access at once.
- Minimum verification: `pnpm type-check`, then run focused filesystem service tests for refresh behavior, provider updates, handle hydration, and provider recovery lifecycle when those paths change.
