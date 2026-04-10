import { useCurrentElement } from '@vueuse/core';

import type { ComputedRef, InjectionKey } from 'vue';
import { computed, inject, provide, type Ref } from 'vue';
import { findParentVueElement } from '@shared/lib/useClosestParentFrame';

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- standard Vue InjectionKey pattern
const OVERLAY_CONTAINER_KEY = Symbol('overlay-container') as InjectionKey<
  ComputedRef<HTMLElement | SVGElement | null | undefined>
>;

export const provideOverlayContainer = (el: Ref<HTMLElement | SVGElement | null | undefined>) => {
  provide(
    OVERLAY_CONTAINER_KEY,
    computed(() => el.value),
  );
};

export const useOverlayContainer = () => {
  const current = useCurrentElement();

  const defaultContainer = computed(() => {
    const c = current.value;

    if (c) {
      return findParentVueElement(c, '[data-v-app]');
    }
    return document.body;
  });

  const container = inject(OVERLAY_CONTAINER_KEY, defaultContainer);

  return computed(() => container.value ?? defaultContainer.value);
};
