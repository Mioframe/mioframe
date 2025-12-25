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
  const onMovedItem = (from: number, to: number) => {
    const list = toValue(listReactive);

    const [movedItem]: T[] = list.splice(from, 1);

    if (!isUndefined(movedItem)) {
      list.splice(to, 0, movedItem);
    }
  };

  const { draggableIndex } = useSortableListener(container, onMovedItem);

  return {
    draggableItem: computed(() =>
      isUndefined(draggableIndex.value)
        ? undefined
        : toValue(listReactive).at(draggableIndex.value),
    ),
    draggableIndex,
  };
};

export const useSortableListener = (
  container: MaybeElementRef,
  onMovedItem: (fromIndex: number, toIndex: number) => unknown,
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

  const currentDragIndex = shallowRef<number>();

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

      if (!isUndefined(overIndex) && overIndex !== currentDragIndex.value) {
        if (!isUndefined(currentDragIndex.value)) {
          onMovedItem(currentDragIndex.value, overIndex);

          currentDragIndex.value = overIndex;
        }
      }
    }
  }, 1e3 / 20);

  const onDragStart = (target: Element | EventTarget | null) => {
    const el = closestDraggable(target);
    if (el) {
      const currentIndex = childrenIndexOf(el);

      currentDragIndex.value = currentIndex;
    }
  };

  const onDragEnd = () => {
    currentDragIndex.value = undefined;
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
    draggableIndex: computed(() => currentDragIndex.value),
  };
};

// FIXME: добавить прокрутку на границе экрана
// TODO: добавить замену ghost элементу
