import type { MaybeElement } from '@vueuse/core';
import { computedWithControl } from '@vueuse/core';
import { getCurrentInstance, onMounted } from 'vue';

type WebElement = HTMLElement | SVGElement;

export const findClosestElement = (target: MaybeElement): WebElement => {
  if (target instanceof Element) {
    return target;
  }
  if (target?.$el instanceof HTMLElement) {
    return target.$el;
  }

  if (target?.$parent) {
    return findClosestElement(target.$parent);
  }

  return document.body;
};

export const useClosestElement = () => {
  const currentInstance = getCurrentInstance();

  const closestElement = computedWithControl(
    () => undefined,
    (): WebElement | undefined => {
      if (currentInstance?.proxy) {
        return findClosestElement(currentInstance.proxy);
      }

      return undefined;
    },
  );

  onMounted(closestElement.trigger);

  return closestElement;
};
