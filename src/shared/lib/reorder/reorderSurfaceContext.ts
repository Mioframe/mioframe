import type { ComputedRef, InjectionKey } from 'vue';

/** Internal contract a `ReorderSurface` provides to its descendant `useReorderItem` calls. */
export interface ReorderSurfaceContext {
  /** Whether a reorder commit is unresolved; new drag activation must stay disabled while true. */
  disabled: ComputedRef<boolean>;
}

/** Provide/inject key linking `ReorderSurface` to `useReorderItem`. Not part of the public API. */
export const reorderSurfaceInjectionKey: InjectionKey<ReorderSurfaceContext> =
  Symbol('reorder-surface');
