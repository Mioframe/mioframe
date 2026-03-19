# src/shared/lib/cfrDocument - CRDT Document

**Scope:** CRDT document handling. 24 files.

## DEPRECATED
- Use `databaseDocument/` instead

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Document handling | `useDocument.ts` | Document state management |
| Document lists | `DocumentList.vue` | List component |
| Select options | `DatabaseDocumentSelectOption.vue` | Select component |

## ANTI-PATTERNS
- **NEVER** use cfrDocument APIs directly
- **ALWAYS** migrate to `databaseDocument/`
