# src/shared/lib/virtualFileSystem

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/virtualFileSystem` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- The provider-neutral virtual filesystem contract, path utilities, event delivery, locking, and in-memory test implementations.

## Patterns

- Keep path, error, and event semantics aligned across implementations.
- Make concurrency and locking rules explicit instead of relying on incidental ordering.
- Treat listener, lock, and handle cleanup as part of the contract, not as caller folklore.

## Anti-patterns

- Do not bypass this layer with direct browser filesystem calls when a shared contract is required.
- Do not change event order or lock semantics without updating tests.

## Constraints

- Event and lock changes affect every filesystem-backed flow.
- Minimum verification: run `pnpm verify --only type-check`, then run focused verify-managed VFS tests for the touched path, lock, and event behavior, plus browser-level checks when concurrency or event delivery changed. Final completion still requires `pnpm verify`.
