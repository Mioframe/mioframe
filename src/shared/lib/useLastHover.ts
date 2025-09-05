import type { MaybeElementRef } from '@vueuse/core';
import {
  createGlobalState,
  unrefElement,
  useEventListener,
} from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const useGlobalHover = createGlobalState(() => {
  const targetList = ref<Element[]>([]);
  const lastTarget = computed(() => targetList.value.at(-1));

  const push = (el: Element) => {
    if (targetList.value.includes(el)) {
      remove(el);
    }
    targetList.value.push(el);
  };

  const remove = (el: Element) => {
    const i = targetList.value.indexOf(el);
    if (i >= 0) {
      targetList.value.splice(i, 1);
    }
  };

  return {
    push,
    remove,
    lastTarget,
  };
});

export const useLastHover = (rawEl: MaybeElementRef) => {
  const el = computed(() => unrefElement(rawEl));

  const { lastTarget, push, remove } = useGlobalHover();

  useEventListener(el, 'pointerenter', ({ currentTarget }: PointerEvent) => {
    if (currentTarget instanceof Element && currentTarget === el.value) {
      push(currentTarget);
    }
  });

  useEventListener(el, 'pointerleave', ({ currentTarget }: PointerEvent) => {
    if (currentTarget instanceof Element) {
      remove(currentTarget);
    }
  });

  watch(
    el,
    (_el, oldEl) => {
      if (oldEl instanceof Element) {
        remove(oldEl);
      }
    },
    { immediate: true },
  );

  return computed(() => el.value && el.value === lastTarget.value);
};
