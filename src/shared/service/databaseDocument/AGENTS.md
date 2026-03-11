# src/shared/service/databaseDocument KNOWLEDGE BASE

## OVERVIEW
Service layer for database document operations. Provides queries and mutations for properties, items, views, sorting, and filtering.

## STRUCTURE
```
src/shared/service/databaseDocument/
├── index.ts                 # Main exports
├── databaseService.ts       # Core database service
├── databasePropertiesService.ts  # Property CRUD
├── databaseDataService.ts  # Item CRUD  
├── view/                   # View operations
│   ├── databaseViewsService.ts
│   ├── databaseViewSortService.ts
│   ├── databaseViewFilterService.ts
│   └── types.ts
└── data/                   # Data query operations
    ├── queryData.ts
    ├── filters.ts
    ├── sortData.ts
    └── partialSort.ts
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Property ops | `databasePropertiesService.ts` | post, patch, remove |
| Item ops | `databaseDataService.ts` | postItem, removeItem, filteredIdList |
| View ops | `view/databaseViewsService.ts` | create, patch views |
| Filter ops | `view/databaseViewFilterService.ts` | filter mutations |
| Sort ops | `view/databaseViewSortService.ts` | sort mutations |

## CONVENTIONS
- Accessed via useMainServiceClient:
  ```typescript
  const {
    databaseDocument: {
      properties: { post, patch, remove, databasePropertiesIdList },
      data: { postItem, removeItem, filteredIdList },
      views: { create, patch, databaseViews },
    }
  } = useMainServiceClient();
  ```
- Each service provides query definitions (for useQuery) and mutation functions
- Queries accept documentId, path, and operation-specific params

## ANTI-PATTERNS
- **NEVER** call service methods directly from UI (use entities)
- **NEVER** skip error handling for mutations
- **NEVER** bypass entities for CRUD operations
