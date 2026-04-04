# src/shared/lib/cfrDocument

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/cfrDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- legacy composables and helpers around the CFR document API.
- older document and repo wrappers still used by current callers.
- `index.ts` and related type/migration helpers.

## Patterns

- Treat this directory as a legacy compatibility layer.
- If a change is necessary, keep it minimal and compatible with existing callers.
- Prefer newer document/database abstractions for new work.

## Anti-patterns

- Do not expand the legacy API without a clear need.
- Do not move new domain logic into this directory.
- Do not break existing callers to simplify one new path.

## Constraints

- Any change here needs a backward-compatibility check and awareness of migration paths to newer abstractions.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a smoke check of affected legacy callers.
