# src/shared/lib/typeGuards KNOWLEDGE BASE

## OVERVIEW
Type guard utilities for runtime type checking. Uses Zod for type-safe type narrowing without instanceof issues.

## STRUCTURE
```
src/shared/lib/typeGuards/
├── index.ts            # Main exports
├── isEnum.ts          # Enum value checking with Zod
├── isArray.ts         # Array checking
├── isInteger.ts       # Integer checking
├── isObjectLike.ts    # Object-like checking
├── isFileSystemDirectoryHandle.ts  # FS API checking
└── hasValue.ts        # Non-nullish checking
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Enum guards | `isEnum.ts` | isEnumValue(value, enumLike) |
| Usage | `@features/databaseFilterEdit` | Filter operator checking |
| Validation | `@shared/lib/validateZodScheme` | zodIs, zodCheck |

## CONVENTIONS
- Enum value checking:
  ```typescript
  import { isEnumValue } from '@shared/lib/typeGuards';
  if (isEnumValue(key, LOGICAL_FILTER_OPERATOR)) {
    // key is typed as LOGICAL_FILTER_OPERATOR[key]
  }
  ```
- Zod-based guards:
  ```typescript
  import { zodIs } from '@shared/lib/validateZodScheme';
  if (zodIs(value, zodSchema)) {
    // value is typed as output<typeof zodSchema>
  }
  ```

## ANTI-PATTERNS
- **NEVER** use plain JavaScript typeof for type narrowing
- **NEVER** skip Zod validation for user input
- **NEVER** use enum members directly for runtime checks
