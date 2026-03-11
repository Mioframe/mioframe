# src/entities/directory KNOWLEDGE BASE

## OVERVIEW
File system directory handling. Manages directory content listing and navigation within the repository.

## STRUCTURE
```
src/entities/directory/
├── index.ts                  # Exports
├── useDirectory.ts          # Directory operations
├── DirectoryContentList.vue # Content list renderer
└── DirectoryContentEntry.vue # Individual entry renderer
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Content listing | `useDirectory.ts` | Directory contents |
| FS entries | `@entity/fsEntry` | File/folder representation |
| Directory service | `@shared/service/directories` | Service layer |

## CONVENTIONS
- Directory composable:
  ```typescript
  const { content, errorMessage, isLoading } = useDirectory(path);
  ```
- Content includes files and subdirectories
- Uses FSEntry types for content items

## ANTI-PATTERNS
- **NEVER** assume directory contents are static (reactive)
- **NEVER** skip error handling
- **NEVER** mutate content directly
