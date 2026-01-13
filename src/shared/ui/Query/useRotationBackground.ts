import type { ComputedRef } from 'vue';
import { computed, inject, provide, type InjectionKey } from 'vue';

const rotationKey: InjectionKey<ComputedRef<boolean>> = Symbol('rotationKey');

export const useRotationBackground = () => {
  const initialSpin = computed(() => false);

  const spin = inject(rotationKey, initialSpin);

  provide(
    rotationKey,
    computed(() => !spin.value),
  );

  return spin;
};
