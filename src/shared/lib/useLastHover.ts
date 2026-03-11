import type { MaybeElementRef } from '@vueuse/core';
import {
  createGlobalState,
  unrefElement,
  useEventListener,
} from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const useGlobalHover = createGlobalState(() => {
  const targetList = ref<Element[]>([]);
  const lastTarget = computed(() => targetList.value.at(-1));

  const push = (el: Element) => {
    if (targetList.value.includes(el)) {
      remove(el);
    }
    targetList.value.push(el);
  };

  const remove = (el: Element) => {
    const i = targetList.value.indexOf(el);
    if (i >= 0) {
      targetList.value.splice(i, 1);
    }
  };

  return {
    push,
    remove,
    lastTarget,
  };
});

/**
 * Tracks which element was hovered last in a group.
 *
 * Global state that tracks the most recently hovered element among multiple targets.
 * Useful for tooltips, context menus, or hover-based UI patterns.
 *
 * @param rawEl - Element or ref to track
 * @returns Computed ref that is true if this element is the last hovered
 *
 * @example
 * ```ts
 * const isLast = useLastHover(itemRef);
 * // Multiple items - only the most recent hover returns true
 * ```
 */
export const useLastHover = (rawEl: MaybeElementRef) => {
  const el = computed(() => unrefElement(rawEl));

  const { lastTarget, push, remove } = useGlobalHover();

  useEventListener(el, 'pointerenter', ({ currentTarget }: PointerEvent) => {
    if (currentTarget instanceof Element && currentTarget === el.value) {
      push(currentTarget);
    }
  });

  useEventListener(el, 'pointerleave', ({ currentTarget }: PointerEvent) => {
    if (currentTarget instanceof Element) {
      remove(currentTarget);
    }
  });

  watch(
    el,
    (_el, oldEl) => {
      if (oldEl instanceof Element) {
        remove(oldEl);
      }
    },
    { immediate: true },
  );

  return computed(() => !!el.value && el.value === lastTarget.value);
};
