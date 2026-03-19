# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-17
**Commit:** 8ce11f5
**Branch:** feature/google-drive-caching

## OVERVIEW

Local-first Personal Data Manager. Vue 3 + TypeScript + Vite. OPFS + Automerge (CRDT) for offline sync. FSD architecture. 681 TypeScript files across 170+ directories.

## STRUCTURE

```
.
├── src/
│   ├── app/           # Global styles, providers, router
│   ├── pages/         # Custom stack navigation (SplitView)
│   ├── widgets/       # Cross-layer compositions (DocumentView)
│   ├── features/      # User actions (edit, CRUD, export)
│   ├── entities/      # Domain models (database, property, view)
│   └── shared/        # Foundation layer
│       ├── lib/       # CRDT, OPFS, Google Drive adapters
│       ├── service/   # DB orchestration, sync workers
│       └── ui/        # Generic UI (Buttons, Dialogs, Tables)
├── cypress/           # E2E tests
├── .github/workflows/ # CI/CD
├── vite.config.ts     # Build, PWA, Sentry, WASM
├── package.json       # Scripts, deps, pnpm config
└── main.ts            # App entry
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| UI Components | `src/shared/ui/` | MDButton, Dialog, Table, Layout |
| CRDT / Automerge | `src/shared/lib/automerge/` | Sync logic, types |
| OPFS / FS | `src/shared/lib/virtualFileSystem/` | Local storage API |
| DB Services | `src/shared/service/databaseDocument/` | CRUD, migrations |
| Domain models | `src/entities/` | database*, repository, property |
| Routing | `src/pages/SplitView/` | Custom stack navigation |
| Google Drive | `src/shared/lib/googleDrive/` | API client, caching |
| Composables | `src/shared/lib/use*.ts` | Vue reactivity |

## COMMANDS

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm type-check       # Run TS compiler checks
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm test             # Run Vitest
pnpm cy:open          # E2E Cypress tests
```

## DEVELOPMENT PATTERNS

### 1. Audit Required
- **ALWAYS** run Oracle audit before finalizing non-trivial implementation
- **ALWAYS** fix critical issues before completing
- Audit checks: logic bugs, edge cases, performance, memory leaks, race conditions

### 2. Less Code = Less Breakage
- **USE** proven libraries (e.g., `lru-cache`, `ky` deduplication)
- **PREFER** built-in solutions over custom
- **IMPLEMENT** only what is necessary

### 3. Type Safety First
- **NEVER** use `any` type
- **USE** existing exported types (`GDriveFile` instead of `z.infer`)
- **PREFER** separate typed stores over generic stores

### 4. TDD Workflow
1. **Plan** — document requirements
2. **Write failing tests** — tests are contract
3. **Implement** — document code
4. **Audit** — verify with Oracle
5. **Verify** — `pnpm type-check && pnpm eslint && pnpm vitest run`
6. **Review** — trim documentation

### 5. Third-Party API Caching
- **INVALIDATION**: Always invalidate on mutations
- **KEY DESIGN**: Include all relevant parameters
- **LRU**: Use `lru-cache` with `max` (items) and `maxSize` (bytes)
- **TTL**: Appropriate expiration based on data freshness

## NOTES

### Build Pipeline
- Vite with 9 plugins (Vue, WASM, PWA, Sentry, SSL, TurboConsole)
- Aggressive vendor chunking: Each dependency gets its own chunk
- Terser 2-pass compression for production
- Conditional Sentry: Only builds sourcemaps when SENTRY_AUTH_TOKEN present

### Test Coverage
- Vitest: 13 unit tests (happy-dom environment)
- Cypress: 12 E2E tests (production preview URL)
- No snapshot tests
- No explicit coverage thresholds
- Empty `src/setupVitest.ts` (opportunity for global mocks)

### Third-Party API Caching
- Google Drive cache: LRU with max entries and size limits
- Invalidates on mutations
- Keys include all relevant parameters
- `src/shared/lib/cfrDocument/useLiveResource.ts` - deprecated composable

### Missing
- `.prettierrc` - no Prettier configuration
- `.editorconfig` - no EditorConfig
- Complete Cypress E2E tests (multiple TODOs in cypress/e2e/)

### Performance
- Build vendor chunks per dependency (`vite.config.ts` line 184)
- Service worker caching with PWA (3 cache strategies: CacheFirst, StaleWhileRevalidate, NetworkFirst)
- Sentry integration in production for error tracking
