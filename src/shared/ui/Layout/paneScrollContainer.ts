import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { computed, inject, provide } from 'vue';

const PROVIDE_PANE_SCROLL_CONTAINER_KEY: InjectionKey<ComputedRef<HTMLElement | undefined | null>> =
  Symbol('PROVIDE_PANE_SCROLL_CONTAINER_KEY');

/**
 * Shared fallback used outside a pane. `document.body` is only read lazily on `.value` access,
 * so allocating this computed at module scope does not touch `document` during module evaluation.
 */
const FALLBACK_PANE_SCROLL_CONTAINER = computed(() => document.body);

/**
 * Provides the pane body scroll container element for descendants to inject via
 * {@link usePaneScrollContainer}.
 * @param el - Ref to the pane body scroll element, e.g. `MDPane`'s `.md-pane__content`.
 */
export const definePaneScrollContainer = (el: Ref<HTMLElement | undefined | null>) => {
  provide(
    PROVIDE_PANE_SCROLL_CONTAINER_KEY,
    computed(() => el.value),
  );
};

/**
 * Injects the nearest ancestor pane's body scroll container, falling back to `document.body`
 * outside a pane.
 * @returns Computed ref to the pane body scroll element.
 */
export const usePaneScrollContainer = () => {
  return inject(PROVIDE_PANE_SCROLL_CONTAINER_KEY, FALLBACK_PANE_SCROLL_CONTAINER);
};
