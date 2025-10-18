import type { VueInstance } from '@vueuse/core';
import { computed } from 'vue';
import { teleportContainerAndParent } from './teleportContainer/useChildTeleportContainer';
import { findClosestElement, useClosestElement } from './useClosestElement';

/**
 * Ссылка на ближайший фрейм элемент
 * @returns
 */
export const useClosestParentFrame = () => {
  const closestElement = useClosestElement();

  const closestParentFrame = computed(() => {
    const closestEl = closestElement.value;

    if (closestEl instanceof HTMLElement) {
      const el = findParentVueElement(
        closestEl,
        '.md-pane-container, dialog, [role="dialog"], [data-v-app], body',
      );
      return el;
    }

    return document.body;
  });

  return closestParentFrame;
};

/**
 * Поиск родителей по селектору с учётом телепортов
 * @param current
 * @param selectors
 * @returns
 */
const findParentVueElement = (
  current: HTMLElement | VueInstance,
  selectors: string,
) => {
  if (current instanceof HTMLElement) {
    const teleportParent = teleportContainerAndParent.get(current);

    if (teleportParent && teleportParent.matches(selectors)) {
      return teleportParent;
    }

    const parentElement = current.parentElement;

    if (parentElement) {
      if (parentElement.matches(selectors)) {
        return parentElement;
      }

      return findParentVueElement(parentElement, selectors);
    }

    return document.body;
  }

  const $parent = current.$parent;

  if ($parent) {
    const closestElement = findClosestElement($parent);

    if (closestElement.matches(selectors)) {
      return closestElement;
    }

    return findParentVueElement($parent, selectors);
  }

  return document.body;
};
