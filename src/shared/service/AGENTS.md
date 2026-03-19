# src/shared/service - Service Layer

**Scope:** Database orchestration, sync workers, service coordination. Bridges `lib` → `entities`. 80+ files across 8 subdirectories.

## SUBDIRECTORIES

### databaseDocument/data
Document operations, CRUD, validation.

### databaseDocument/view
Query builders, projections, aggregations.

### google
Google Drive client wrappers, auth, permissions.

### directories
Path resolution, tree traversal, filtering.

### document
Document lifecycle, versioning, conflict resolution.

### repositories
Generic data access layer, query execution.

### fileSystem
OPFS wrappers, stream handling, chunking.

### orchestration
Service coordination, event buses, workers.

## ARCHITECTURE RULES

### Layer Boundaries
- **lib/**: Pure utilities, no Vue, no domain types
- **service/**: Bridges lib → entities, no UI logic
- **ui/**: Vue components only, no business logic, no entities imports
- **NEVER** import entities/features/widgets/pages from shared

### TypeScript
- **Strict mode**: No `any`, no `as`, no `@ts-ignore`
- **Type guards**: Use `typeGuards` lib for runtime checks
- **Zod schemas**: Validate at boundaries, not in UI

### Service Pattern
- **Bridge pattern**: lib → entities → UI
- **No direct FS**: Use `localFileSystem` or `virtualFileSystem`
- **No direct API**: Use `googleDrive` or `googleApi`
- **Event-driven**: Workers via `wrapWorker`, comms via subscriptions

## ANTI-PATTERNS

- **NEVER** import from `@entity`, `@feature`, `@widget`, `@page`
- **NEVER** include domain models in `ui/` or `service/`
- **NEVER** put Vue logic in `service/` or `lib/`
- **NEVER** bypass `lib` abstractions for direct FS/API access
- **NEVER** use `any` or `@ts-ignore`
- **NEVER** leave empty catch blocks
- **NEVER** mutate reactive state directly

## CONVENTIONS

### Imports
```typescript
import { AutomergeAdapter } from "@shared/lib/automergeAdapter"
import { useDatabaseDocument } from "@shared/lib/databaseDocument/useDatabaseDocument"
import { MDButton } from "@shared/ui/Button"
// NEVER: import from @entity, @feature, @widget, @page
```

### Service Pattern
```typescript
// service/ → entities/ → UI
export async function saveDocument(doc: DatabaseDocument) {
  const adapter = new AutomergeAdapter()
  const fs = getLocalFileSystem()
  await adapter.applyToFS(fs, doc)
}
```

## TESTING

- **lib/:** Unit tests (Vitest, happy-dom)
- **service/:** Mock lib deps, test orchestration
- **ui/:** Component tests, integration with features

## KEY FILES

| Layer | Location | Purpose |
|-------|----------|---------|
| CRDT | `lib/automergeAdapter` | Sync with UI |
| FS | `lib/virtualFileSystem/` | Local storage API |
| Google | `lib/googleDrive/` | API client, caching |
| DB | `service/databaseDocument/` | CRUD, migrations |
| UI | `ui/Table`, `ui/Dialog` | Generic components |

## COMMANDS

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm type-check       # Run TS compiler checks
pnpm lint             # Run ESLint
pnpm test             # Run Vitest
pnpm cy:open          # E2E Cypress tests
```