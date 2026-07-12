# src/shared/lib/webFileSystemProvider

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to the browser File System Access provider implementation and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Browser `FileSystemHandle` provider adapter logic, handle operation semantics, provider-specific validation, provider-specific errors, and focused provider tests.

## Patterns

- This provider owns browser File System Access operation semantics: stat, list, read, write, create, move, remove, watch-related reads, and permission-state checks needed before those operations.
- Define and create provider-specific errors here, next to the provider condition that detects them.
- Missing browser access for an existing handle is an access-required provider failure, not not-found and not a reason to unmount the provider.
- The provider may call `queryPermission()` to decide whether an operation can continue.
- The provider must not call `requestPermission()`. Browser permission prompts belong to an explicit user-action flow above the provider.
- Delayed Automerge save retry does not belong here. Provider writes should fail fast with the original access-required error and leave any later retry policy to repository persistence owners above this boundary.
- Keep provider contracts independent from service modules. Services may supply callbacks, registries, or context, but this provider must not import from `shared/service`.
- Preserve the original caught `Error` or `DOMException` as trusted in-app `DomainError.cause` when needed for stack and diagnostics. Keep serialized metadata, reportable messages, diagnostics, and user-facing payloads transfer-safe and privacy-safe; never include handles, raw paths, provider/service objects, credentials, capabilities, or raw browser text there.
- Do not put raw user file-system paths into reportable error payloads.
- A safe mounted root display name is allowed only for controlled access-recovery errors when UI and service recovery need a stable lookup key.
- `spaceName` is allowed in `WebFileSystemAccessRequiredError` because it is the mounted root display key used by recovery UI and pending request lookup. Do not treat it as a raw path or a browser handle.

## Anti-patterns

- Do not import `shared/service`, `entities`, `features`, `widgets`, or `pages` from this provider.
- Do not define provider errors in a service module only because the service supplies pending request context.
- Do not return browser handles through ordinary display records.
- Do not convert missing browser access into a generic not-found result.
- Do not hide permission checks in UI code when the provider is the boundary that detects access failure.
- Do not duplicate provider operation semantics in service, entity, widget, or page layers.
- Do not replace trusted raw causes with feature-local synthetic safe-error wrappers or classifiers.

## Constraints

- Changes here can affect every local file-system backed space.
- Minimum verification: run `pnpm verify --only type-check`, then focused verify-managed `WebFileSystemProvider` tests for touched operations and access-required behavior. Final completion still requires `pnpm verify`.
