# src/shared/lib/playground/ui

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/playground/ui` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- playground-only UI and demo components used to inspect interaction behavior.

## Patterns

- Use this directory to isolate and observe UI behavior quickly.
- If a playground duplicates production behavior, extract the shared part and reuse it instead.

## Anti-patterns

- Do not make playground UI a production dependency.
- Do not keep the only implementation of important behavior here.
- Do not let demo-only shortcuts leak into public shared UI APIs.

## Constraints

- Everything here should remain safe to remove or move without breaking production flows.
- Minimum verification: `pnpm type-check` and a manual smoke check of the touched playground scenario when relevant.
