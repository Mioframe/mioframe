# src/shared/lib - Foundation Layer

**Scope:** Low-level utilities, CRDT (Automerge), OPFS filesystem abstractions, Google Drive API integration. Core foundation with 80+ files across 15+ submodules.

## CRITICAL WARNINGS

- **8 TypeScript `any` types** in 6 files - violates strict TypeScript requirement
- **72 ESLint `eslint-disable-next-line`** in 37 files - reduce systematically
- **Memory leaks**: `scopePool.ts` (lines 123, 79) - investigate lifecycle management
- **Deprecated**: `useLiveResource.ts` - migrate to `useQuery` + `defineQuery`

## SUBMODULES

### automerge/
CRDT core types and validation schemas.

**Exports**: `AMDocHandle<T>`, `AMDocumentId`, `AMDoc<T>`, `AMValue`, `AMChangeFn<T>`

```typescript
export type * from './automergeTypes';
export const zodSimpleDocumentId = string().check(...);
export const zodDocumentId = zodStrictDocumentId;
```

### automergeAdapter/
CRDT-Vue integration layer.

**Adapters**: VFS adapter for OPFS, FS adapter for local storage.

```typescript
export { createVFSAdapter } from './createVFSAdapter';
export { createFSStorageAdapter } from './createFSStorageAdapter';
export { fileNameToPartialKey, partialKeyToFileName };
```

### databaseDocument/
DB schema, migrations, validation types.

**Exports**: `DATABASE_DOCUMENT_TYPE`, `zodDatabaseDocument`, migration system v1-v3.

### googleDrive/
Google Drive API client and queries.

**Components**: API client, query builder, space constants.

### googleApi/
Google API loading utilities.

**Loaders**: gapi, gapi.drive, gsi, oauth2 initialization.

### virtualFileSystem/
OPFS abstraction layer with event system.

**Classes**: `VirtualFileSystem`, `PathUtils`, `EventEmitter`, `LockManager`.

### cfrDocument/
CRDT document handling.

## SINGLE-FILE UTILS

| File | Purpose | Pattern |
|------|---------|---------|
| `debounce.ts` | Perfect debounce | `export { debounce }` |
| `throttle.ts` | Es-toolkit throttle | `export { throttle }` |
| `dayjs.ts` | DayJS wrapper | `export { dayjs, Dayjs }` |
| `generateColor.ts` | MD5-based colors | `export const generateColor = ...` |
| `generateId.ts` | UUID generation | `export const generateId = ...` |
| `objectEntries.ts` | Type-safe entries | `export const objectEntries = ...` |
| `objectKeys.ts` | Type-safe keys | `export const objectKeys = ...` |
| `readonlyDeep.ts` | Readonly cast | `export const defineReadonlyDeep = ...` |
| `shallowClone.ts` | Shallow clone | `export const shallowClone = ...` |
| `writableDeepClone.ts` | Deep clone writable | `export const writableDeepClone = ...` |
| `WeakValueMap.ts` | WeakRef map | `export class WeakValueMap<T> { ... }` |

## VUE COMPOSABLES

| Composable | Purpose | Pattern |
|------------|---------|---------|
| `useQueryState` | URL query sync | `export const useQueryState = ...` |
| `useLazyState` | Lazy loading | `export const useLazyState = ...` |
| `useDeepModel` | Deep reactive model | `export const useDeepModel = ...` |
| `useFirstFocus` | Auto-focus | `export const useFirstFocus = ...` |
| `useLastHover` | Track hover | `export const useLastHover = ...` |
| `useMatchSorter` | Fuzzy search | `export const useMatchSorter = ...` |
| `useFastKeyboardInput` | Key capture | `export const useFastKeyboardInput = ...` |
| `useKeyboardSearch` | Search input | `export const useKeyboardSearch = ...` |
| `useOverlayNavigation` | Overlay nav | `export const useOverlayNavigation = ...` |
| `useClosestElement` | DOM traversal | `export const useClosestElement = ...` |
| `useClosestParentFrame` | Frame detection | `export const useClosestParentFrame = ...` |
| `useIterable` | Async iterable | `export const useIterable = ...` |
| `useAsyncIterable` | Async iterable | `export const useAsyncIterable = ...` |
| `useReduce` | Reduce with state | `export const useReduce = ...` |
| `extendedAsyncComputed` | Async computed | `export const extendedAsyncComputed = ...` |

## SCOPE MANAGEMENT

| Utility | Purpose | Pattern |
|---------|---------|---------|
| `scopePool.ts` | Ref-counted scopes | `export const defineScopePool = ...` |
| `usePoolState` | Reactive pool access | `export const usePoolState = ...` |
| `scopesMap.ts` | WeakMap scope cache | `export const createScopesMap = ...` |
| `useScopesMapByKey` | Reactive map access | `export const useScopesMapByKey = ...` |

**WARNING**: `usePoolState` requires active `EffectScope` - call within reactive context.

## TYPE GUARDS

| File | Purpose | Pattern |
|------|---------|---------|
| `typeGuards/isArray.ts` | Array check | `export const isArray = ...` |
| `typeGuards/hasOwnKey.ts` | Own key check | `export const hasOwnKey = ...` |

## ERROR HANDLING

```typescript
export { FileSystemError, VfsError } from './VfsError';
export { DomainError } from './error';
```

## Migrations

```typescript
export * from './migrations';
export { defineVersion, defineMigrations };
```

**Versions**: v1 (properties), v2 (views), v3 (extensions).

## EXPORT PATTERNS

- **Types only**: `export type * from './types'`
- **Named exports**: `export { ClassName, functionName } from './module'`
- **Composables**: `export const useComposable = ...`
- **Errors**: `export { ErrorClass } from './Error'`

## CODE STYLE

- **Naming**: `use*` for composables, `*Adapter` for adapters, `*Store*` for state
- **JSDoc**: Required for all public API functions
- **Type safety**: No `any`, no `@ts-ignore`, no `eslint-disable`
- **Pure utilities**: No side effects, no Vue reactivity (unless composable)
- **Single responsibility**: One file, one export pattern

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| CRDT Types | `automerge/automergeTypes.ts` | AMDoc, DocumentId |
| CRDT Adapters | `automergeAdapter/` | VFS, FS adapters |
| DB Schema | `databaseDocument/types.ts` | Zod schemas |
| Migrations | `databaseDocument/migrations/` | v1-v3 versions |
| OPFS API | `virtualFileSystem/VirtualFileSystem.ts` | File operations |
| Google Drive | `googleDrive/simplifiedAPI.ts` | API client |
| URL State | `useQueryState.ts` | Query param sync |
| Scope Pool | `scopePool.ts` | Ref-counted scopes |
| Weak Cache | `scopesMap.ts` | WeakMap cache |
| Utilities | root level | debounce, throttle, clones |

## ANTI-PATTERNS

- **NEVER** import from `features`, `widgets`, or `pages` (strict FSD layer violation)
- **NEVER** mutate CRDT documents without proper adapter methods
- **NEVER** bypass type guards (use `typeGuards/` for runtime checks)
- **NEVER** create memory leaks (proper cleanup in composables)
- **NEVER** use `any` type or `@ts-ignore`
- **NEVER** leave empty catch blocks

## DEPRECATED

- `useLiveResource.ts` - use `useQuery` with `defineQuery` instead
- `cfrDocument/` - migrate to databaseDocument
