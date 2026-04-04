# src/shared/lib/googleDrive

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/googleDrive` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DriveQueryBuilder.ts`: query construction helpers.
- `api/`: simplified API wrappers, query helpers, metadata and file-content caches.
- `gDriveEntry.ts`, `types.ts`, `error.ts`: entry models, types, and error contracts.
- `index.ts`: public entry point.

## Patterns

- Keep Google Drive access behind typed wrappers and cache-aware helpers.
- Treat cache keys, invalidation, and response normalization as part of the module contract.
- Keep query construction separate from transport details when that improves reuse and testing.

## Anti-patterns

- Do not spread raw Google Drive API calls across upper layers when this module can own them.
- Do not change caching behavior without considering invalidation after mutations.
- Do not couple this module to page or feature UI assumptions.

## Constraints

- Changes here affect Drive-backed reads, metadata freshness, and mutation follow-up behavior.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused tests or smoke checks for the touched cache/query behavior.
