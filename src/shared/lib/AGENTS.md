# src/shared/lib KNOWLEDGE BASE

## OVERVIEW
Core utilities, CRDT (Automerge) adapters, OPFS filesystem abstractions, and Google Drive integrations. Contains both general TypeScript utilities and Vue composables.

## STRUCTURE
```
src/shared/lib/
├── automerge/              # CRDT logic and types
├── automergeAdapter/       # Integration of Automerge with Vue
├── changeObject/           # Deep patch/put utilities for JSON objects
├── databaseDocument/       # DB sync and migrations
├── debounce.ts             # Re-exports from perfect-debounce
├── throttle.ts             # Re-exports from es-toolkit
├── fileSystem/             # FS types and guards
├── googleApi/              # Google API loading utilities
├── googleDrive/            # Google Drive API integration
├── migrations/             # Version migration utilities
├── objectKeys.ts           # Type-safe key extraction
├── onInteractionOutside.ts # Click-outside detection
├── playground/             # Developer utilities and test beds
├── proxyService/          # Remote procedure call via message passing
├── removeEmptyStructures.ts # Recursive empty structure removal
├── scopePool.ts            # Reactive scope pooling with ref counting
├── scopesMap.ts            # WeakMap-based reactive scope cache
├── sortable/               # Drag-and-drop sorting utilities
├── subscriptions/          # Subscription service/client
├── teleportContainer/      # Vue teleport helpers
├── typeGuards/             # TypeScript type guards
├── useClosestParentFrame.ts # Find parent frame element
├── useFastKeyboardInput.ts # Single-char keyboard capture
├── useFirstFocus.ts        # Auto-focus first element
├── useIterable.ts          # Iterable type utilities
├── useLastHover.ts         # Track last-hovered element
├── useLazyState.ts         # Lazy-loading reactive state
├── useLiveResource.ts      # Reactive resource (deprecated)
├── useMatchSorter.ts       # Fuzzy search filtering
├── useQueryState.ts        # URL query param sync
├── virtualFileSystem/      # File system abstractions (OPFS)
├── WeakValueMap.ts         # WeakRef-based map
├── writableDeepClone.ts    # Deep clone with writable types
└── wrapWorker/             # Web Worker proxy utilities
```

## UTILITY FUNCTIONS

| Function | Purpose |
|----------|---------|
| `objectKeys` | Type-safe key extraction for objects/arrays |
| `moveArrayValue` | Move array element by index (in-place) |
| `removeEmptyStructures` | Recursively remove empty arrays/objects |
| `arrayStartsWith` | Check if array starts with prefix |
| `defineReadonlyDeep` | Type cast to readonly (no copy) |
| `writableDeepClone` | Deep clone with writable types |
| `jsonStringify` / `jsonParse` | Type-safe JSON with brand typing |
| `isStandardBufferView` | Type guard for ArrayBuffer views |

## VUE COMPOSABLES

| Composable | Purpose |
|------------|---------|
| `useQueryState` | Two-way sync with URL query params |
| `useLazyState` | Lazy-loading with loading/error states |
| `useLiveResource` | Fetch + subscription pattern (deprecated) |
| `useFirstFocus` | Auto-focus first focusable element |
| `useLastHover` | Track last-hovered in a group |
| `useMatchSorter` | Fuzzy search with ranking |
| `useFastKeyboardInput` | Capture single-char keypresses |
| `onInteractionOutside` | Detect clicks outside element |
| `setupMetaThemeColor` | Sync theme-color meta with body |
| `useClosestParentFrame` | Find parent frame/dialog |

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Document Migrations | `databaseDocument/migrations/` | Versioning for CRDT structures |
| File System Logic | `virtualFileSystem/` & `localFileSystem/` | OPFS API usage and fallback |
| CRDT Sync | `automergeAdapter/` | Data synchronization with UI |
| Remote Calls | `proxyService/` | Cross-context RPC via postMessage |
| State Pooling | `scopePool.ts`, `scopesMap.ts` | Cached reactive scopes |

## CONVENTIONS
- Pure TypeScript, minimal Vue reactivity where possible (isolated to adapters).
- Heavy use of TypeScript utility types and type guards (`src/shared/lib/typeGuards`).
- Errors are explicitly typed and thrown.
- JSDoc documentation for all public API functions.

## ANTI-PATTERNS
- **NEVER** import from `features`, `widgets`, or `pages` (strict FSD layer violation).
- **NEVER** mutate CRDT documents without using the proper Automerge adapter mechanisms.