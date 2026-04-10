import type { UseFocusOptions } from '@vueuse/core';
import { unrefElement, useFocus, type MaybeElementRef } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

const focusableSelector = 'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';

/**
 * Focus management for the first focusable element within a target.
 *
 * Automatically finds and manages focus on the first focusable element
 * (input, select, textarea, button, or element with tabindex) inside the target.
 *
 * @param target - Element or ref to target container
 * @param options - Focus options including initialValue and useTarget flag
 * @returns Object with focused ref
 *
 * @example
 * ```ts
 * const { focused } = useFirstFocus(containerRef, { initialValue: true });
 * ```
 */
export const useFirstFocus = (
  target: MaybeElementRef,
  options?: UseFocusOptions & {
    /**
     * Наводить фокус на target
     */
    useTarget?: boolean;
  },
) => {
  const focusableTarget = computed(() => {
    const el = unrefElement(target);
    if (el) {
      if (options?.useTarget && el.matches(focusableSelector)) {
        return el;
      }
      const focusableEl = el.querySelector(focusableSelector);
      return focusableEl instanceof HTMLElement ? focusableEl : undefined;
    }
    return undefined;
  });

  const { focused } = useFocus(focusableTarget, options);

  watchEffect(() => {
    if (options?.initialValue) {
      focused.value = !!focusableTarget.value;
    }
  });

  return {
    focused,
  };
};
