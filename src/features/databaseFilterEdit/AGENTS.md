# src/features/databaseFilterEdit KNOWLEDGE BASE

## OVERVIEW
Feature for creating and editing database filters. Provides UI for building filter query trees with logical operators (AND/OR) and unary operators (EQUALS, CONTAINS, etc.).

## STRUCTURE
```
src/features/databaseFilterEdit/
├── index.ts                          # Exports
├── DatabaseQueryFilterForm.vue       # Main filter form
├── DatabaseFilterAddButton.vue       # Add filter button
├── DatabaseUnaryFilterFormDialog.vue # Single value filter dialog
├── UnaryOperatorFilterMenuItemList.vue
├── UnaryOperatorFilterMenuItem.vue
├── PropertyFilterMenuItem.vue
├── LogicalOperatorFilterMenuItem.vue
├── LogicalOperatorFilterMenuItemList.vue
└── types.ts                         # FilterPath, zodFilterPath
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Filter UI | `DatabaseQueryFilterForm.vue` | Main component |
| Filter mutations | `@entity/databaseFilter` | useDatabaseViewFilter |
| Property access | `@entity/databaseProperty` | Property selection |
| Value editing | `@widget/DocumentView/Database/ValueField.vue` | Value input |

## CONVENTIONS
- Uses typed slots for nested rendering:
  ```typescript
  defineSlots<{
    value: (p: { value: unknown; propertyId: DatabasePropertyId }) => unknown;
  }>();
  ```
- Filter path tracks nested groups:
  ```typescript
  type FilterPath = (DatabasePropertyId | LOGICAL_FILTER_OPERATOR)[];
  ```
- Uses zodIs for type narrowing:
  ```typescript
  if (zodIs(property, zodDatabasePropertyId)) {...}
  ```
- Uses es-toolkit get/set for nested path manipulation

## ANTI-PATTERNS
- **NEVER** build filter paths without using FilterPath type
- **NEVER** skip Zod validation for filter values
- **NEVER** mutate filterQuery directly
