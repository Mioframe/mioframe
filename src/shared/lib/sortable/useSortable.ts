import {
  unrefElement,
  useEventListener,
  type MaybeElementRef,
} from '@vueuse/core';
import { debounce, throttle } from 'es-toolkit';
import { indexOf, isUndefined } from 'es-toolkit/compat';
import type { MaybeRefOrGetter } from 'vue';
import { computed, shallowRef, toValue } from 'vue';

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
    if (target instanceof Element) {
      const currentIndex = childrenIndexOf(target);

      currentIndexRef.value = currentIndex;
    }
  };

  const onDragEnd = () => {
    currentIndexRef.value = undefined;
  };

  useEventListener(containerElRef, 'dragstart', (e: DragEvent) => {
    cancelPseudoDrag();

    const { target } = e;
    onDragStart(target);
  });

  useEventListener(containerElRef, 'dragenter', (e: DragEvent) => {
    cancelPseudoDrag();

    const { target } = e;

    onDrag(target);
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

  /**
   * Native DnD response timeout.
   * @default 600 // it's a little longer than the response time in chromium on android
   *  */
  const nativeDnDResponseTimeout = 600;

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

      if (!isUndefined(navigator) && 'vibrate' in navigator) {
        navigator.vibrate([10]);
      }

      onDragStart(e.target);
    }, nativeDnDResponseTimeout);
  });

  const onTouchMove = throttle(
    ({ changedTouches: [{ clientX, clientY }] }: TouchEvent) => {
      onDrag(document.elementFromPoint(clientX, clientY));
    },
    1e3 / 120,
  );

  useEventListener(containerElRef, 'touchmove', (e: TouchEvent) => {
    clearTimeout(timeoutPseudoDragStart);

    if (usePseudoDrag && !isUndefined(currentIndexRef.value)) {
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
