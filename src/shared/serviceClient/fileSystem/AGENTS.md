# src/shared/serviceClient/fileSystem

Inherits the rules from `src/shared/serviceClient/AGENTS.md`. Applies to main-thread file-system access adapters and descendants until a deeper `AGENTS.md` refines it.

## Contains

- User-activation-bound file-system permission brokers and other browser-only adapters that talk to the shared file-system service proxy.

## Patterns

- Fetch temporary handles from the service only for one explicit user action, call the browser API, then release the handle.
- Keep `requestPermission()` and other browser user-activation APIs here even when service-layer retry coordination changes elsewhere.
- Return safe status results to UI callers; do not expose raw handles or browser errors through ordinary UI-facing contracts.

## Constraints

- Use focused verify-managed browser coverage for changed permission or picker behavior. Final completion still requires `pnpm verify`.
