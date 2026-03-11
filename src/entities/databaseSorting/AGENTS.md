# src/entities/databaseSorting KNOWLEDGE BASE

## OVERVIEW
Database view sorting management. Handles property-based sorting (ascending/descending) for database views.

## STRUCTURE
```
src/entities/databaseSorting/
├── index.ts                 # Exports
├── useDatabaseSorting.ts    # Sorting operations composable
└── useDatabaseSortDescription.ts  # Sort description helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Sort mutations | `useDatabaseSorting.ts` | patch function |
| Sort description | `useDatabaseSortDescription.ts` | Human-readable descriptions |
| Sort UI | `@features/databaseItemSorting` | Sort selector UI |
| Sort service | `@shared/service/databaseDocument/view` | Sort service |

## CONVENTIONS
- Sorting composable:
  ```typescript
  const { patch: patchSort, sortDescription }
    = useDatabaseSorting(path, documentId, viewId);
  ```
- Sort direction: ASCENDING, DESCENDING
- Sorts by property ID with direction
- Provides sortDescription for UI display

## ANTI-PATTERNS
- **NEVER** sort without specifying direction
- **NEVER** mutate sort directly (use patch)
- **NEVER** skip error handling
