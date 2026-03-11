# src/entities/databaseProperty KNOWLEDGE BASE

## OVERVIEW
Database property definitions and management. Properties define columns in database tables (name, type, default values). Properties have types: string, number, boolean, date, relation.

## STRUCTURE
```
src/entities/databaseProperty/
├── index.ts                      # Exports: DatabasePropertyList, useDatabaseProperties, useDatabaseProperty
├── useDatabaseProperties.ts      # List of properties for a document
├── useDatabaseProperty.ts        # Single property by ID
├── DatabasePropertyList.vue       # Property list renderer
├── DatabasePropertyListItem.vue  # Individual property item
├── DatabasePropertyBlock.vue     # Header block for table columns
├── DatabasePropertySpan.vue      # Inline property display
├── DatabasePropertyMenuItem.vue   # Menu item for property actions
└── DatabasePropertyEditDialog.vue # Property editing dialog
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Property list | `useDatabaseProperties.ts` | Fetches all properties for doc |
| Single property | `useDatabaseProperty.ts` | Fetches property by ID |
| Property types | `@entity/databaseString`, `databaseNumber`, etc. | Type-specific definitions |
| Property schema | `@shared/lib/databaseDocument` | Zod schemas for properties |

## CONVENTIONS
- Standard entity composable pattern:
  ```typescript
  const { propertiesIdList, errorMessage, isLoading, patch, post, remove }
    = useDatabaseProperties(path, documentId);
  ```
- Properties identified by `DatabasePropertyId` (string)
- Property types defined as constants: `PROPERTY_TYPE_STRING`, etc.
- Zod schemas for validation: `zodStringProperty`, `zodNumberProperty`, etc.
- Create functions: `createStringProperty(name)`, `createNumberProperty(name)`, etc.

## ANTI-PATTERNS
- **NEVER** access properties without using the composable (bypasses CRDT)
- **NEVER** hardcode property types (use constants)
- **NEVER** mutate property arrays directly
