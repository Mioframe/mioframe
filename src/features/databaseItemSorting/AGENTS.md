# src/features/databaseItemSorting KNOWLEDGE BASE

## OVERVIEW
Feature for managing database view sorting. UI for selecting properties and sort direction (ascending/descending).

## STRUCTURE
```
src/features/databaseItemSorting/
├── index.ts                        # Exports
├── DatabaseItemSortingListSection.vue  # Main sort UI
├── DatabaseSortingListItem.vue    # Individual sort option
└── PropertySortDirectionMenuItem.vue  # Direction selector
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Sort logic | `@entity/databaseSorting` | useDatabaseSorting |
| Property list | `@entity/databaseProperty` | useDatabaseProperties |
| Sort service | `@shared/service/databaseDocument/view` | Sort operations |

## CONVENTIONS
- Uses entity composables:
  ```typescript
  const { patch: patchSort } = useDatabaseSorting(path, documentId, viewId);
  const { propertiesIdList } = useDatabaseProperties(path, documentId);
  ```
- Direction options: ASCENDING, DESCENDING
- Patch format: `{ propertyId: { direction: 'ASCENDING' } }`

## ANTI-PATTERNS
- **NEVER** sort without direction
- **NEVER** skip property validation
- **NEVER** mutate sort directly
