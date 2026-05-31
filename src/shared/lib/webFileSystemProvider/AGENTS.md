# src/shared/lib/webFileSystemProvider

Inherits the rules from `src/shared/AGENTS.md`. Applies to the browser File System Access provider implementation.

## Contains

- Browser `FileSystemHandle` provider adapter logic, handle operation semantics, provider-specific validation, provider-specific errors, and focused provider tests.

## Patterns

- This provider owns browser File System Access operation semantics: stat, list, read, write, create, move, remove, watch-related reads, and permission-state checks needed before those operations.
- Define and create provider-specific errors here, next to the provider condition that detects them.
- Missing browser access for an existing handle is an access-required provider failure, not not-found and not a reason to unmount the provider.
- The provider may call `queryPermission()` to decide whether an operation can continue.
- The provider must not call `requestPermission()`. Browser permission prompts belong to an explicit user-action flow above the provider.
- Keep provider contracts independent from service modules. Services may supply callbacks, registries, or context, but this provider must not import from `shared/service`.
- Keep error payloads transfer-safe and privacy-safe. Handles, paths, names, and raw browser errors must not appear in reportable messages, causes, serialized errors, or diagnostics.

## Anti-patterns

- Do not import `shared/service`, `entities`, `features`, `widgets`, or `pages` from this provider.
- Do not define provider errors in a service module only because the service supplies pending request context.
- Do not return browser handles through ordinary display records.
- Do not convert missing browser access into a generic not-found result.
- Do not hide permission checks in UI code when the provider is the boundary that detects access failure.
- Do not duplicate provider operation semantics in service, entity, widget, or page layers.

## Constraints

- Changes here can affect every local file-system backed space.
- Minimum verification: `pnpm type-check`, then focused `WebFileSystemProvider` tests for touched operations and access-required behavior.
