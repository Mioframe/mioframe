import type { UseFocusOptions } from '@vueuse/core';
import { unrefElement, useFocus, type MaybeElementRef } from '@vueuse/core';
import { computed } from 'vue';

export const useFirstFocus = (
  target: MaybeElementRef,
  options?: UseFocusOptions,
) => {
  const focusableTarget = computed(() => {
    const el = unrefElement(target);
    const focusableEl = el?.querySelector(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    return focusableEl instanceof HTMLElement ? focusableEl : undefined;
  });

  useFocus(focusableTarget, options);
};
