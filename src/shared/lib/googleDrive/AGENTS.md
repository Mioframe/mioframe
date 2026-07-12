# src/shared/lib/googleDrive

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/googleDrive` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Typed Google Drive wrappers, query building, cache-aware API helpers, and Drive entry or error contracts.

## Patterns

- Keep Google Drive access behind typed wrappers and normalized response contracts.
- Treat cache keys, invalidation, and metadata freshness as part of the public behavior.
- Keep query construction separate from transport details when that improves reuse or testability.

## Anti-patterns

- Do not spread raw Drive API calls across upper layers.
- Do not change caching behavior without reviewing post-mutation and refresh invalidation.
- Do not couple this module to page or feature UI assumptions.

## Constraints

- Changes here affect Drive-backed reads, cache freshness, and mutation follow-up behavior.
- Minimum verification: run `pnpm verify --only type-check`, then run focused verify-managed Drive tests when available and verify the touched query or cache path for cache hit, cache bust, and normalized error handling. Final completion still requires `pnpm verify`.
