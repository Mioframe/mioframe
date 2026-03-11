# src/entities/databaseFilter KNOWLEDGE BASE

## OVERVIEW
Database filtering logic and filter query tree management. Filters define which items are shown in a view based on property values.

## STRUCTURE
```
src/entities/databaseFilter/
├── index.ts                      # Exports
├── useDatabaseViewFilter.ts      # Filter mutation composable
├── DatabaseSimpleFilterValueChip.vue  # Chip showing filter value
├── FilterQuery.vue               # Filter tree renderer
└── types.ts                      # FilterPath, filter types
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Filter mutations | `useDatabaseViewFilter.ts` | patch, remove filter operations |
| Filter UI | `@features/databaseFilterEdit` | Filter creation/editing UI |
| Filter types | `@shared/lib/databaseDocument` | UNARY_FILTER_OPERATOR, LOGICAL_FILTER_OPERATOR |

## CONVENTIONS
- Filter operations:
  ```typescript
  const { patch: patchFilter, filterQuery, remove: removeFilter }
    = useDatabaseViewFilter(path, documentId, viewId);
  ```
- Filter tree uses logical operators: `AND`, `OR`
- Unary operators: `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `GREATER_THAN`, etc.
- Filter path tracks nested group structure

## ANTI-PATTERNS
- **NEVER** build filter queries without using the service layer
- **NEVER** bypass Zod validation for filter values
- **NEVER** mutate filterQuery directly (use patchFilter)
