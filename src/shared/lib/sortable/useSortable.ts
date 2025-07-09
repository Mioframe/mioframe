import './dnd-transition.css';

import { unrefElement, type MaybeElementRef } from '@vueuse/core';
import { debounce, throttle } from 'es-toolkit';
import { indexOf, isUndefined } from 'es-toolkit/compat';
import type { MaybeRefOrGetter } from 'vue';
import { computed, shallowRef, toValue } from 'vue';
import { useDragListener } from './useDragStartListener';

export const useSortable = <T>(
  container: MaybeElementRef,
  listReactive: MaybeRefOrGetter<T[]>,
) => {
  const containerElRef = computed(() => unrefElement(container));

  const childrenIndexOf = (el: Element) => {
    if (el.parentElement?.children) {
      const index = indexOf(el.parentElement.children, el);
      if (index >= 0) {
        return index;
      }
    }
    return undefined;
  };

  const currentIndexRef = shallowRef<number>();

  const closestDraggable = (
    el: EventTarget | Element | HTMLElement | null,
  ): Element | undefined => {
    if (el instanceof HTMLElement) {
      if (el.draggable) {
        return el;
      }
    }

    if (el instanceof Element) {
      const foundClosest = el.closest('[draggable="true"]') ?? undefined;

      return foundClosest;
    }
    return undefined;
  };

  let lastOverElement: EventTarget | Element | null | undefined = undefined;

  const onDrag = throttle((overElement: EventTarget | Element | null) => {
    const overDraggableElement = closestDraggable(overElement);

    if (!overDraggableElement || lastOverElement === overDraggableElement) {
      return;
    }

    lastOverElement = overDraggableElement;

    if (
      overDraggableElement instanceof Element &&
      overDraggableElement.parentElement === containerElRef.value
    ) {
      const overIndex = childrenIndexOf(overDraggableElement);

      if (!isUndefined(overIndex) && overIndex !== currentIndexRef.value) {
        if (!isUndefined(currentIndexRef.value)) {
          const list = toValue(listReactive);

          const [movedItem]: T[] = list.splice(currentIndexRef.value, 1);

          list.splice(overIndex, 0, movedItem);

          currentIndexRef.value = overIndex;
        }
      }
    }
  }, 1e3 / 20);

  const onDragStart = (target: Element | EventTarget | null) => {
    const el = closestDraggable(target);
    if (el) {
      const currentIndex = childrenIndexOf(el);

      currentIndexRef.value = currentIndex;
    }
  };

  const onDragEnd = () => {
    currentIndexRef.value = undefined;
  };

  const onDragOver = debounce(({ target }: { target: EventTarget | null }) => {
    onDrag(target);
  }, 1e3);

  useDragListener(containerElRef, {
    onDragStart: ({ target }) => {
      onDragStart(target);
    },
    onDragOver: ({ target }) => {
      onDragOver({ target });
    },
    onDragEnd: () => {
      onDragEnd();
    },
    onDragEnter: ({ target }) => {
      onDrag(target);
    },
  });

  return {
    draggableItem: computed(() =>
      isUndefined(currentIndexRef.value)
        ? undefined
        : toValue(listReactive).at(currentIndexRef.value),
    ),
    draggableIndex: computed(() => currentIndexRef.value),
  };
};

// FIXME: добавить прокрутку на границе экрана
// TODO: добавить замену ghost элементу
