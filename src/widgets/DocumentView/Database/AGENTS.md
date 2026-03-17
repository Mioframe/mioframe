# src/widgets/DocumentView/Database

Widget composition layer for database document views — table rendering, property sheets, and toolbar actions.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Table rendering | `DatabaseViewWidget.vue` | Main table component |
| Properties sheet | `DatabasePropertiesSheet.vue` | Column configuration |
| Toolbar | `DatabaseToolbar.vue` | Actions bar |
| View layout | `DatabaseViewLayout.vue` | Table slots, scrolling |
| View presets | `DatabaseViewsSheet.vue` | View list, selection |
| Sorting | `DatabaseSortSheet.vue` | Sort configuration |
| Filtering | `DatabaseFiltersSheet.vue` | Filter form |

## CONVENTIONS

- Binds domain from `entities/database*` to UI from `shared/ui`
- Uses `useQuery` for reactive data subscriptions
- Passes entity IDs, not full objects, to child components
- Slot-based composition for value/action rendering
- Delegates mutations to `features/` via dialogs

## ANTI-PATTERNS

- **NEVER** perform mutations here (delegate to `features/`)
- **NEVER** import business logic directly from `shared/lib`
- **NEVER** bypass FSD (widgets → features → entities)
- **NEVER** mutate state directly (use Vue reactivity)

## COMPONENTS

### DatabaseViewWidget.vue
- Main document view container
- Manages view selection, property list, item actions
- Emits `update:property` for value changes

### DatabaseToolbar.vue
- Floating toolbar with view/sort/filter/add buttons
- Manages sheet visibility state
- Passes `selectedViewId` via defineModel

### DatabasePropertiesSheet.vue
- Property list with context actions
- Opens edit/remove dialogs via features
- Uses `DatabasePropertyList` from entities

### DatabaseViewLayout.vue
- Slots: value, action, actionHead, after
- Renders `DatabaseDataTable` with property blocks
- Scroll detection for action elevation

### DatabaseViewsSheet.vue
- View presets list with checkboxes
- Context actions: rename, remove
- Opens create/rename dialogs

### DatabaseSortSheet.vue
- Minimal wrapper for `DatabaseItemSortingListSection`
- Passes view context

### DatabaseFiltersSheet.vue
- Wrapper for `DatabaseFilterForm`
- Displays filtered values via slots
