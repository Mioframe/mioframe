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

  const getChildrenIndex = (el: Element) =>
    indexOf(el.parentElement?.children, el);

  const draggableItem = shallowRef<T | undefined>();

  useEventListener(containerElRef, 'dragstart', (e: DragEvent) => {
    console.log(e.type, e);

    const { target } = e;

    if (target instanceof Element) {
      const currentIndex = getChildrenIndex(target);
      draggableItem.value = list.value.at(currentIndex);
    }
  });

  const onDrag = throttle((e: DragEvent) => {
    const { target } = e;

    if (
      target instanceof Element &&
      target.parentElement === containerElRef.value
    ) {
      const overIndex = getChildrenIndex(target);

      const overItem = list.value.at(overIndex);

      if (
        !isUndefined(draggableItem.value) &&
        overItem !== draggableItem.value
      ) {
        console.log('from', draggableItem.value, 'to', overItem);
        moveItem(draggableItem.value, overIndex);
      }
    }
  }, 1e3 / 30);

  useEventListener(containerElRef, 'dragenter', onDrag);
  useEventListener(containerElRef, 'dragover', debounce(onDrag, 1e3));

  useEventListener(containerElRef, 'dragend', () => {
    draggableItem.value = undefined;
  });

  const moveItem = (item: T, newIndex: number) => {
    const [movedItem]: T[] = list.value.splice(list.value.indexOf(item), 1);
    list.value.splice(newIndex, 0, movedItem);
  };

  return {
    draggableItem: computed(() => draggableItem.value),
  };
};

// FIXME: не работает на android firefox
// TODO: добавить замену ghost элементу
