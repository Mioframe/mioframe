import { computedWithControl, type VueInstance } from '@vueuse/core';
import { getCurrentInstance, onMounted } from 'vue';

type WebElement = HTMLElement | SVGElement;

export const findClosestElement = (target: VueInstance): WebElement => {
  if (target.$el instanceof HTMLElement) {
    return target.$el;
  }

  if (target.$parent) {
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
