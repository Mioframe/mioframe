# src/entities/databaseData KNOWLEDGE BASE

## OVERVIEW
Database data items (rows) management. Handles CRUD operations for individual database records. Data is filtered by view and can be queried with sift queries.

## STRUCTURE
```
src/entities/databaseData/
├── index.ts             # Exports: DatabaseDataTable, useDatabaseData
├── useDatabaseData.ts   # Main composable for data operations
├── DatabaseDataTable.vue # Table rendering component
└── types.ts            # Item ID query types
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Data fetching | `useDatabaseData.ts` | Returns itemIdList, errorMessage, isLoading |
| Table rendering | `DatabaseDataTable.vue` | Virtual scrolling table |
| Item CRUD | `@shared/service/databaseDocument/data` | Service layer operations |
| Item types | `@shared/lib/databaseDocument` | DatabaseItem, DatabaseItemId |

## CONVENTIONS
- Data composable accepts optional view and query filters:
  ```typescript
  const { itemIdList, errorMessage, isLoading, postItem, removeItem }
    = useDatabaseData(path, documentId, viewId, idQuery);
  ```
- `postItem(item, itemId?)` - Create or update item
- `removeItem(itemId)` - Delete item
- Uses `filteredIdList` query for view-aware data
- Sift library for query filtering

## ANTI-PATTERNS
- **NEVER** fetch raw items without using the composable
- **NEVER** bypass view filtering when displaying data
- **NEVER** skip error handling for data operations
