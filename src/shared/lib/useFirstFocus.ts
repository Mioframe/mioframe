import type { UseFocusOptions } from '@vueuse/core';
import { unrefElement, useFocus, type MaybeElementRef } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

const focusableSelector =
  'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';

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
