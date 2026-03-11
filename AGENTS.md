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
