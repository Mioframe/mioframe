# src/features/databaseItemEdit KNOWLEDGE BASE

## OVERVIEW
Feature for editing and adding database items (rows). Provides dialog-based editing with property-specific value fields.

## STRUCTURE
```
src/features/databaseItemEdit/
├── index.ts              # Exports: DbItemEditDialog, DbItemAddDialog
├── DbItemEditDialog.vue  # Edit existing item dialog
├── DbItemAddDialog.vue   # Add new item dialog
└── types.ts             # Additional types
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Item operations | `@entity/databaseData/useDatabaseData` | postItem, removeItem |
| Value fields | `@widget/DocumentView/Database/ValueField.vue` | Property-specific editors |
| Item schema | `@shared/lib/databaseDocument` | DatabaseItem, DatabaseItemId |

## CONVENTIONS
- Slot forwarding pattern for value fields:
  ```typescript
  defineSlots<{
    valueField(p: {
      propertyId: DatabasePropertyId;
      value: unknown;
      update: (value: unknown) => void;
      index: number;
    }): unknown;
  }>();
  ```
- Uses defineModel: `defineModel<boolean>('show', { required: true })`
- DbItemAddDialog wraps DbItemEditDialog with different headline/events
- Emits created/updated/cancel events

## ANTI-PATTERNS
- **NEVER** access item data without using entity composables
- **NEVER** skip property validation in value fields
- **NEVER** bypass slot pattern for value editing
