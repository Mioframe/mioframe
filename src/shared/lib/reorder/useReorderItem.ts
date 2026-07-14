import { useSortable } from '@dnd-kit/vue/sortable';
import { inject, type MaybeRefOrGetter } from 'vue';
import { REORDER_TRANSITION } from './reorderConfig';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';

/** Reactive inputs for one reorderable row registered with a `ReorderSurface`. */
export interface UseReorderItemOptions {
  /** Stable item id, matching one entry of the surface's `itemIds`. */
  id: MaybeRefOrGetter<string>;
  /** The item's position within the surface's displayed order. */
  index: MaybeRefOrGetter<number>;
  /** The row's root element used for pointer geometry and drag transforms. */
  element: MaybeRefOrGetter<HTMLElement | undefined>;
  /** The element that must receive the pointer-down gesture to activate a drag. */
  handle: MaybeRefOrGetter<HTMLElement | undefined>;
}

/**
 * Registers one row as a reorderable item within the nearest ancestor `ReorderSurface`.
 * Applies the surface's centralized pointer sensor, plugin set, and Material transition, and
 * disables drag activation while that surface has an unresolved reorder commit.
 * @param options - Reactive id, index, element, and handle for this row.
 * @returns Whether this item is currently the active drag source.
 * @throws Error - When called without an ancestor `ReorderSurface`.
 */
export const useReorderItem = ({ id, index, element, handle }: UseReorderItemOptions) => {
  const surface = inject(reorderSurfaceInjectionKey, null);

  if (!surface) {
    throw new Error('useReorderItem must be used within a ReorderSurface');
  }

  const { isDragging } = useSortable({
    id,
    index,
    element,
    handle,
    disabled: surface.disabled,
    transition: REORDER_TRANSITION,
  });

  return { isDragging };
};
