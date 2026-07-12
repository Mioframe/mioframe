# src/shared/serviceClient

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/serviceClient` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Main-thread client adapters that call shared service proxies and browser-only user-activation APIs.

## Patterns

- Keep this area limited to short-lived client adapters such as permission prompts, pickers, and clipboard-triggered bridge code.
- Client adapters may hold transferable handles only for the duration of one explicit user action and must release references afterward.
- Call `requestPermission()`, picker APIs, clipboard permission flows, and similar browser prompts here, not in `src/shared/service`.
- Service clients may coordinate with service proxies, but must not own provider state, persisted capabilities, credentials, mounts, or domain data.

## Anti-patterns

- Do not move service-owned registries, caches, providers, or VFS state here.
- Do not keep browser handles alive across unrelated user actions.

## Constraints

- Keep imports directed downward into `shared` infrastructure and approved service proxies only.
- Use verify-managed browser coverage when a client adapter changes a user-activation or permission flow. Final completion still requires `pnpm verify`.
