# src/shared/lib/cfrDocument

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/cfrDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Legacy CFR document compatibility helpers and wrappers still needed by current callers.

## Patterns

- Treat this directory as a compatibility layer and keep changes minimal.
- Prefer newer document or database abstractions for new work.
- Keep migration and compatibility behavior explicit rather than hidden in callers.

## Anti-patterns

- Do not expand the legacy API without a clear compatibility need.
- Do not move new domain logic into this directory.
- Do not break existing callers to simplify one new path.

## Constraints

- Any change here needs a backward-compatibility check.
- Minimum verification: `pnpm type-check`, then verify the touched legacy caller still loads and migrates the relevant document or repo state.
