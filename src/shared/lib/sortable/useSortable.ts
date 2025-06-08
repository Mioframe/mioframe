import {
  unrefElement,
  useEventListener,
  type MaybeElementRef,
} from '@vueuse/core';
import { debounce, throttle } from 'es-toolkit';
import { indexOf, isUndefined } from 'es-toolkit/compat';
import type { Ref } from 'vue';
import { computed, shallowRef } from 'vue';

export const useSortable = <T>(container: MaybeElementRef, list: Ref<T[]>) => {
  const containerElRef = computed(() => unrefElement(container));

  const childrenIndexOf = (el: Element) =>
    indexOf(el.parentElement?.children, el);

  const draggableItem = shallowRef<T | undefined>();

  let lastOverElement: EventTarget | Element | null | undefined = undefined;

  const onDrag = throttle((overElement: EventTarget | Element | null) => {
    if (lastOverElement === overElement) {
      return;
    }
    lastOverElement = overElement;

    if (
      overElement instanceof Element &&
      overElement.parentElement === containerElRef.value
    ) {
      const overIndex = childrenIndexOf(overElement);

      const overItem = list.value.at(overIndex);

      if (
        !isUndefined(draggableItem.value) &&
        overItem !== draggableItem.value
      ) {
        console.log('from', draggableItem.value, 'to', overItem);
        moveItem(draggableItem.value, overIndex);
      }
    }
  }, 1e3 / 20);

  const moveItem = (item: T, newIndex: number) => {
    const oldIndex = list.value.indexOf(item);
    if (oldIndex !== newIndex) {
      const [movedItem]: T[] = list.value.splice(oldIndex, 1);
      list.value.splice(newIndex, 0, movedItem);
    }
  };

  const onDragStart = (target: Element | EventTarget | null) => {
    if (target instanceof Element) {
      const currentIndex = childrenIndexOf(target);
      draggableItem.value = list.value.at(currentIndex);
    }
  };

  const onDragEnd = () => {
    draggableItem.value = undefined;
  };

  useEventListener(containerElRef, 'dragstart', (e: DragEvent) => {
    cancelPseudoDrag();

    const { target } = e;
    onDragStart(target);
  });

  useEventListener(containerElRef, 'dragenter', (e: DragEvent) => {
    cancelPseudoDrag();

    onDrag(e.target);
  });

  useEventListener(
    containerElRef,
    'dragover',
    debounce((e: DragEvent) => {
      cancelPseudoDrag();

      onDrag(e.target);
    }, 1e3),
  );

  useEventListener(containerElRef, 'dragend', onDragEnd);

  // примерное значение удержания элемента для начала замены нативного dnd, должен быть больше реального значения
  const holdTouchTimeout = 600;

  let timeoutPseudoDragStart: ReturnType<typeof setTimeout> | undefined =
    undefined;

  let usePseudoDrag = false;

  const cancelPseudoDrag = () => {
    usePseudoDrag = false;
    clearTimeout(timeoutPseudoDragStart);
  };

  useEventListener(containerElRef, 'touchstart', (e) => {
    timeoutPseudoDragStart = setTimeout(() => {
      usePseudoDrag = true;

      onDragStart(e.target);
    }, holdTouchTimeout);
  });

  const onTouchMove = throttle(
    ({ changedTouches: [{ clientX, clientY }] }: TouchEvent) => {
      onDrag(document.elementFromPoint(clientX, clientY));
    },
    1e3 / 120,
  );

  useEventListener(containerElRef, 'touchmove', (e: TouchEvent) => {
    clearTimeout(timeoutPseudoDragStart);

    if (usePseudoDrag && draggableItem.value) {
      e.preventDefault();

      onTouchMove(e);
    }
  });

  useEventListener(containerElRef, 'touchend', () => {
    if (usePseudoDrag) {
      onDragEnd();
    }

    cancelPseudoDrag();
  });

  useEventListener(containerElRef, 'touchcancel', () => {
    if (usePseudoDrag) {
      onDragEnd();
    }

    cancelPseudoDrag();
  });

  return {
    draggableItem: computed(() => draggableItem.value),
  };
};

// FIXME: добавить прокрутку на границе экрана
// TODO: добавить замену ghost элементу
