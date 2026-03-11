# src/shared/lib/sortable KNOWLEDGE BASE

## OVERVIEW
Drag-and-drop sorting utilities for lists. Provides composables for implementing sortable list interfaces.

## STRUCTURE
```
src/shared/lib/sortable/
├── index.ts              # Main exports
├── useSortable.ts        # Main sortable composable
├── useDragStartListener.ts # Drag event handling
├── dnd-transition.css   # Drag-and-drop CSS transitions
└── UseSortablePlayground.vue  # Development playground
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Sortable list | `useSortable.ts` | Main composable |
| Drag events | `useDragStartListener.ts` | Event handlers |
| Usage | `@features/databaseItemSorting` | View sorting UI |

## CONVENTIONS
- Basic sortable usage:
  ```typescript
  const { draggableItem, draggableIndex } = useSortable(
    containerRef,  // MaybeElementRef
    listReactive   // MaybeRefOrGetter<T[]>
  );
  ```
- Uses throttle/debounce from es-toolkit for performance
- Handles drag start, over, enter, end events
- Updates reactive list in place

## ANTI-PATTERNS
- **NEVER** use without throttling (performance)
- **NEVER** mutate source array without using splice
- **NEVER** skip container element validation
