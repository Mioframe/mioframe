# src/shared/lib/changeObject KNOWLEDGE BASE

## OVERVIEW
Deep object manipulation utilities for JSON/CRDT data. Provides safe deep patching, putting, and checking for unknown records.

## STRUCTURE
```
src/shared/lib/changeObject/
├── index.ts               # Main exports
├── deepPatchJsonObject.ts # Deep merge with delete markers
├── deepPutJsonObject.ts   # Deep property setting
├── isUnknownRecord.ts    # Type guard for unknown objects
└── __tests__/            # Unit tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Deep patch | `deepPatchJsonObject.ts` | Merge changes, supports delete markers |
| Deep put | `deepPutJsonObject.ts` | Set nested properties |
| Type guard | `isUnknownRecord.ts` | Check for unknown object types |

## CONVENTIONS
- Deep patch with delete markers:
  ```typescript
  import { deepPatchJsonObject, DELETE_MARKER } from '@shared/lib/changeObject';
  deepPatchJsonObject(target, { property: DELETE_MARKER }); // Delete
  deepPatchJsonObject(target, { nested: { value: newVal } }); // Update
  ```
- Options for trimming and custom delete markers:
  ```typescript
  deepPatchJsonObject(target, source, { trimString: true, deleteMarker: '__DEL__' });
  ```
- Deep put for creating nested paths:
  ```typescript
  deepPutJsonObject(obj, ['a', 'b', 'c'], value);
  ```

## ANTI-PATTERNS
- **NEVER** use for CRDT document mutations (use adapter methods)
- **NEVER** skip delete marker pattern (use undefined doesn't work)
- **NEVER** mutate without understanding deep vs shallow
