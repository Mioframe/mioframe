import type { DragDropManager } from '@dnd-kit/dom';

/**
 * Resolves the active reorder container: the direct DOM parent of the dragged sortable item's
 * element. This is the same element that defines drag movement bounds (see `REORDER_MODIFIERS`'
 * `RestrictToElement` contract in `reorderConfig.ts`) and the element autoscroll must keep
 * visible (see `ReorderAutoScroller`). Both owners resolve it through this one helper so the
 * contract cannot drift between them.
 * @param dragOperation - The active drag operation snapshot, e.g. `manager.dragOperation`.
 * @returns The reorder container element, or `null` when no drag is active or the source has no
 * parent element.
 */
export const getReorderContainer = (
  dragOperation: DragDropManager['dragOperation'],
): Element | null => dragOperation.source?.element?.parentElement ?? null;
