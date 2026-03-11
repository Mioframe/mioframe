# src/widgets/DocumentView/Database KNOWLEDGE BASE

## OVERVIEW
Widget composition layer for database document views — table rendering, property sheets, and toolbar actions.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Table rendering | `DatabaseViewWidget.vue` | Main table component |
| Property sheets | `DatabasePropertiesSheet.vue` | Column configuration |
| Toolbar | `DatabaseToolbar.vue` | Actions bar |

## CONVENTIONS
- Binds domain from `entities/database*` to UI from `shared/ui`
- Uses `useQuery` for reactive data subscriptions
- Passes entity IDs, not full objects, to child components

## ANTI-PATTERNS
- **NEVER** perform mutations here (delegate to `features/`)
- **NEVER** import business logic directly from `shared/lib`
