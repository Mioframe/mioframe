import { unrefElement, useCurrentElement } from '@vueuse/core';
import { computed } from 'vue';

interface MaybeElement {
  parentElement: MaybeElement | Element | null | undefined;
}

export const useClosestParentFrame = () => {
  const currentElement = useCurrentElement();

  const findParentElement = (maybeEl: MaybeElement | Element) => {
    if (maybeEl instanceof Element) {
      return maybeEl;
    }
    if (maybeEl.parentElement) {
      return findParentElement(maybeEl.parentElement);
    }
    return undefined;
  };

  const closestParentFrame = computed(() => {
    const maybeEl = unrefElement(currentElement.value);

    if (maybeEl) {
      const el = findParentElement(maybeEl);
      if (el) {
        return (
          el.closest('dialog, [role="dialog"], [data-v-app], body') ||
          document.body
        );
      }
    }

    return document.body;
  });

  return closestParentFrame;
};
