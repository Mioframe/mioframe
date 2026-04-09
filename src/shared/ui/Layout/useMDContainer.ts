import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { computed, inject, provide } from 'vue';

const PROVIDE_CONTAINER_KEY: InjectionKey<ComputedRef<HTMLElement | undefined | null>> =
  Symbol('PROVIDE_CONTAINER_KEY');

export const definePaneContainer = (el: Ref<HTMLElement | undefined | null>) => {
  provide(
    PROVIDE_CONTAINER_KEY,
    computed(() => el.value),
  );
};

export const usePaneContainer = () => {
  return inject(
    PROVIDE_CONTAINER_KEY,
    computed(() => document.body),
  );
};
