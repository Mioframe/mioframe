# src/shared/lib/virtualFileSystem

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/virtualFileSystem` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `VirtualFileSystem.ts`: the main filesystem abstraction contract.
- `PathUtils.ts`: path manipulation helpers.
- `EventEmitter.ts`: filesystem event delivery.
- `LockManager.ts`: concurrency coordination.
- `MemoryFileSystem.ts` and tests: in-memory and verification utilities.

## Patterns

- Keep one consistent filesystem contract across providers and implementations.
- Keep path semantics, error semantics, and event semantics aligned across implementations.
- Make concurrency and locking behavior explicit instead of relying on incidental ordering.

## Anti-patterns

- Do not bypass this layer with direct browser filesystem calls when a shared contract is required.
- Do not change event order or lock semantics without tests.
- Do not leave listener or handle cleanup as an undocumented caller responsibility.

## Constraints

- Event, lock, and read/write semantics changes require updated tests and parallel-flow checks.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused tests for events, locking, and concurrent access.
