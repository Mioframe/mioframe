# src/shared - Foundation Layer

**Scope:** Domain-agnostic infrastructure. CRDT, OPFS, Google Drive, generic UI.
**No business logic.** No domain models. Bridges `lib` ↔ UI.

## Directory Structure

### lib/ (75+ files, 36 index.ts)
**CRDT & Storage:** automerge, automergeAdapter, cfrDocument, strictRecord, defineId
**Virtual FS:** virtualFileSystem, localFileSystem, fileSystem, teleport, teleportContainer
**Google:** googleDrive, googleApi, google (vfsProviders), cache
**Utilities:** zodToVueProps, changeObject, error, typeGuards, proxyService, wrapWorker
**Components:** md, scrollTo, sortable, subscriptions, onBackNavigation, playground

### service/ (8 subdirs, 80+ files)
**databaseDocument/data:** Document operations, CRUD, validation
**databaseDocument/view:** Query builders, projections, aggregations
**google:** Google Drive client wrappers, auth, permissions
**directories:** Path resolution, tree traversal, filtering
**document:** Document lifecycle, versioning, conflict resolution
**repositories:** Generic data access layer, query execution
**fileSystem:** OPFS wrappers, stream handling, chunking
**orchestration:** Service coordination, event buses, workers

### ui/ (37 components, 163 files)
**Layout:** AppBar, ViewWithPanelLayout, Sheets, Menu, TreeMenu, ButtonGroup, ButtonGrid
**Data:** Table, Chips, State, Message, Tooltips
**Patterns:** Generic, reusable. Scoped CSS. DefineModel props.

## Architecture Rules

### Layer Boundaries
- **lib/**: Pure utilities, no Vue, no domain types
- **service/**: Bridges lib → entities, no UI logic
- **ui/**: Vue components only, no business logic, no entities imports
- **NEVER** import entities/features/widgets/pages from shared

### TypeScript
- **Strict mode:** No `any`, no `as`, no `@ts-ignore`
- **Type guards:** Use `typeGuards` lib for runtime checks
- **Zod schemas:** Validate at boundaries, not in UI

### UI Components
- **Scoped CSS:** `<style scoped>` with custom units (rpx, step, pt, dp)
- **DefineModel:** Reactive props via `defineModel()`
- **No domain types:** Use generic interfaces, not entity models
- **No async in render:** Composables handle data fetching

### Service Layer
- **Bridge pattern:** lib → entities → UI
- **No direct FS:** Use `localFileSystem` or `virtualFileSystem`
- **No direct API:** Use `googleDrive` or `googleApi`
- **Event-driven:** Workers via `wrapWorker`, comms via subscriptions

## Anti-Patterns

- **NEVER** import from `@entity`, `@feature`, `@widget`, `@page`
- **NEVER** include domain models in `ui/` or `service/`
- **NEVER** put Vue logic in `service/` or `lib/`
- **NEVER** bypass `lib` abstractions for direct FS/API access
- **NEVER** use `any` or `@ts-ignore`
- **NEVER** leave empty catch blocks
- **NEVER** mutate reactive state directly

## Conventions

### Imports
```typescript
import { AutomergeAdapter } from "@shared/lib/automergeAdapter"
import { useDatabaseDocument } from "@shared/lib/databaseDocument/useDatabaseDocument"
import { MDButton } from "@shared/ui/Button"
// NEVER: import from @entity, @feature, @widget, @page
```

### Component Props
```typescript
// defineModel for reactive props
const model = defineModel<number>()
// Composables for side effects
const { data, loading } = useFetch()
```

### Service Pattern
```typescript
// service/ → entities/ → features/
export async function saveDocument(doc: DatabaseDocument) {
  const adapter = new AutomergeAdapter()
  const fs = getLocalFileSystem()
  await adapter.applyToFS(fs, doc)
}
```

## Testing

- **lib/:** Unit tests (Vitest, happy-dom)
- **service/:** Mock lib deps, test orchestration
- **ui/:** Component tests, integration with features

## Key Files

| Layer | Location | Purpose |
|-------|----------|---------|
| CRDT | `lib/automergeAdapter` | Sync with UI |
| FS | `lib/virtualFileSystem/` | Local storage API |
| Google | `lib/googleDrive/` | API client, caching |
| DB | `service/databaseDocument/` | CRUD, migrations |
| UI | `ui/Table`, `ui/Dialog` | Generic components |

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm type-check       # Run TS compiler checks
pnpm lint             # Run ESLint
pnpm test             # Run Vitest
pnpm cy:open          # E2E Cypress tests
```
