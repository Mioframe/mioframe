# src/shared/serviceClient/fileSystem

Inherits the rules from `src/shared/serviceClient/AGENTS.md`. Applies to main-thread file-system access adapters.

## Contains

- User-activation-bound file-system permission brokers and other browser-only adapters that talk to the shared file-system service proxy.

## Patterns

- Fetch temporary handles from the service only for one explicit user action, call the browser API, then release the handle.
- Return safe status results to UI callers; do not expose raw handles or browser errors through ordinary UI-facing contracts.
