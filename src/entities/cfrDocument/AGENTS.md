# src/entities/cfrDocument KNOWLEDGE BASE

## OVERVIEW
CRDT (Conflict-free Replicated Data Type) document handling. CFR documents are the base document type supporting all data in the application. Uses Automerge for CRDT implementation.

## STRUCTURE
```
src/entities/cfrDocument/
├── index.ts                 # Public exports
├── useDocument.ts           # Document fetch/use composable
├── DocumentMDListItem.vue   # List item renderer
└── DatabaseDocumentSelectOption.vue  # Select option for DB docs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Document fetching | `useDocument.ts` | Returns state, error, put/patch methods |
| Document types | `@shared/lib/databaseDocument` | Database document schema |
| CRDT operations | `@shared/lib/automerge` | Automerge integration |

## CONVENTIONS
- Document composable pattern:
  ```typescript
  const { state: documentDescription } = useDocument(
    documentDirectory,  // Ref<string>
    documentId,         // Ref<AMDocumentId | undefined>
  );
  // Returns: { state, errorMessage, isLoading, put, patch }
  ```
- Documents have types: `DATABASE_DOCUMENT_TYPE = 'database'`, `JsonObject`
- Use `DomainError` from `@shared/lib/error` for document errors
- State is CRDT-aware; mutations go through `put`/`patch` methods

## ANTI-PATTERNS
- **NEVER** mutate document state directly (breaks CRDT)
- **NEVER** import document handles without using the composable
- **NEVER** skip error handling when fetching documents
