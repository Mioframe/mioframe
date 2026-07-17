import type { SortableTransition } from '@dnd-kit/dom/sortable';
import type { ComputedRef, InjectionKey } from 'vue';

/** Internal contract a `ReorderSurface` provides to its descendant `useReorderItem` calls. */
export interface ReorderSurfaceContext {
  /** Whether a reorder commit is unresolved; new drag activation must stay disabled while true. */
  disabled: ComputedRef<boolean>;
  /**
   * The dnd-kit sortable transition every item should use, resolved once per surface from the
   * `prefers-reduced-motion` media query: `REORDER_TRANSITION` for `no-preference`, `null` to
   * disable displacement transitions for `reduce`.
   */
  reorderTransition: ComputedRef<SortableTransition | null>;
}

/** Provide/inject key linking `ReorderSurface` to `useReorderItem`. Not part of the public API. */
export const reorderSurfaceInjectionKey: InjectionKey<ReorderSurfaceContext> =
  Symbol('reorder-surface');
