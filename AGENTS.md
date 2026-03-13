# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-11
**Commit:** ea1c6e5
**Branch:** develop

## OVERVIEW
Beaver is a local-first Personal Data Manager. Built with Vue 3, TypeScript, and Vite. Uses Origin Private File System (OPFS) and Automerge (CRDT) for data consistency. Strict Feature-Sliced Design (FSD).

## STRUCTURE
```
.
├── src/
│   ├── app/       # Global styles, setup, and providers
│   ├── pages/     # Vue page components and routing
│   ├── widgets/   # Cross-feature compositions
│   ├── features/  # User interactions and focused operations
│   ├── entities/  # Domain models (e.g., CFR docs, DB entities)
│   └── shared/    # Reusable UI, libraries, and custom services
└── main.ts        # Application entry point
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| UI Components | `src/shared/ui/` | Core, reusable elements (Buttons, Layout, Trees) |
| CRDT / Automerge | `src/shared/lib/automerge/` | Data consistency logic |
| File System (OPFS) | `src/shared/lib/fileSystem/` | Local storage adapters |
| Database Services | `src/shared/service/databaseDocument/` | DB sync and management |
| Domain logic | `src/entities/` | Database properties, items, views logic |
| Page structure | `src/pages/` | DocumentViewPane, RepoExplorer, SplitView |

## CONVENTIONS
- **Architecture**: Strict Feature-Sliced Design (FSD).
- **State Management**: Vue reactivity patterns.
- **Styling**: Scoped CSS, CSS modules.
- **TypeScript**: Strict typing required. No `any` or `@ts-ignore`.
- **Framework**: Vue 3 Composition API with `<script setup>`. `defineProps` for props.
- **Linting**: Pre-commit ESLint is strictly enforced. Fix issues locally before pushing.

## ANTI-PATTERNS
- **NEVER** use `any` type or `as` type assertion.
- **NEVER** ignore ESLint or TS errors (`@ts-ignore`, `eslint-disable`).
- **NEVER** leave empty catch blocks.
- **NEVER** directly mutate reactive state objects; use Vue reactivity patterns.
- **NEVER** bypass FSD architecture (e.g., cross-importing features from each other).

## COMMANDS
```bash
pnpm dev           # Start dev server
pnpm build         # Build for production
pnpm lint          # Run ESLint (~2m 50s - large project)
pnpm lint:fix      # Auto-fix linting issues
pnpm type-check    # Run TS compiler checks
pnpm test          # Run tests
pnpm cy:open       # E2E Cypress tests
```

### Линтинг отдельных файлов/директорий
```bash
# Один файл
pnpm eslint src/shared/lib/googleDrive/cache.ts

# Директория
pnpm eslint src/shared/lib/googleDrive/

# Несколько файлов
pnpm eslint src/shared/lib/googleDrive/cache.ts src/shared/lib/googleDrive/simplifiedAPI.ts
```

### Запуск тестов отдельных файлов/директорий
```bash
# Один файл
pnpm vitest run src/shared/lib/googleDrive/cache.test.ts

# Директория
pnpm vitest run src/shared/lib/googleDrive/
```

## DEVELOPMENT PATTERNS

### 1. Independent Audit Required
- **ALWAYS** run independent audit (Oracle) before finalizing any non-trivial implementation
- **ALWAYS** fix critical issues from audit before completing
- Audit should check: logic bugs, edge cases, performance, memory leaks, race conditions

### 2. Less Code = Less Breakage
- **USE** popular proven libraries for common cases (less code = fewer bugs)
- **PREFER** built-in solutions (ky deduplication) over custom
- **IMPLEMENT** only what is necessary — avoid over-engineering
- **USE** established libraries (e.g., `lru-cache`) instead of reinventing
- **PRIORITIZE** performance — app runs on user resources

### 3. Type Safety First
- **NEVER** use `any` type
- **USE** existing exported types (e.g., `GDriveFile` instead of `z.infer`)
- **PREFER** separate typed stores over generic stores with type assertions

### 4. Tests for New Code
- **WRITE** tests BEFORE implementation (TDD)
- **WRITE** unit tests for all new modules
- **DON'T** test third-party libraries (test your code, not their internals)
- Cover edge cases and error paths

### 5. ESLint Discipline
- **ALWAYS** fix lint errors locally before pushing
- **MINIMIZE** eslint-disable usage
- **ONLY** use inline comments with justification: `// eslint-disable-next-line -- reason`
- **NEVER** disable rules for large blocks
- **SPLIT** typed stores by type to avoid type assertions

### 6. Test-Driven Development (TDD)
**Workflow:**
1. **Plan** — document what needs to be done, mark as pending
2. **Write failing tests** — tests are the contract
3. **Implement** — document new code
4. **Audit loop** — update documentation for best practices
5. **Verify** — `pnpm type-check && pnpm eslint && pnpm vitest run`
6. **Review** — check documentation is not bloated, matches implementation, everything is covered

**NEVER** skip the audit step. **NEVER** skip the fix step.

### 7. Task Delegation with Skills
Use appropriate skills for different task types (check available skills via skill tool).

### 8. Third-Party API Caching
For external API integrations (e.g., Google Drive):
- **INVALIDATION**: Always invalidate on mutations
- **KEY DESIGN**: Include all relevant parameters in cache key
- **LRU**: Use `lru-cache` for memory-bounded caches (sets `max` for items, `maxSize` for bytes)
- **TTL**: Appropriate expiration for data freshness
