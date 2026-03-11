# src/entities/repository KNOWLEDGE BASE

## OVERVIEW
Repository (folder/directory) management. Handles listing and creating documents within a repository path.

## STRUCTURE
```
src/entities/repository/
├── index.ts            # Exports
└── useRepository.ts   # Repository operations
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| List docs | `useRepository.ts` | documentIdList query |
| Create doc | `useRepository.ts` | createDocument function |
| Delete doc | `useRepository.ts` | deleteDocument function |
| Doc types | `@shared/lib/databaseDocument` | Document type constants |

## CONVENTIONS
- Repository composable:
  ```typescript
  const { state, errorMessage, isLoading, createDocument, deleteDocument }
    = useRepository(path);  // Ref<string>
  ```
- Returns document ID list for the path
- createDocument accepts CFRDocumentContent (type, name, version, body)
- Uses DomainError for path-related errors

## ANTI-PATTERNS
- **NEVER** use arbitrary document types (use DATABASE_DOCUMENT_TYPE)
- **NEVER** skip error handling for document creation
- **NEVER** mutate state directly
