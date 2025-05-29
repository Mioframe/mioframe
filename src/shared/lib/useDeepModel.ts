import { useVModel } from '@vueuse/core';
import { cloneDeep } from 'es-toolkit';

export const useDeepModel = <
  P extends object,
  K extends Extract<keyof P, string>,
>(
  props: P,
  key: K,
  emit: (name: `update:${K}`, $event: P[K]) => void,
  { clone }: { clone?: boolean } = {},
) => {
  return useVModel<P, K, `update:${K}`>(props, key, emit, {
    clone: clone ? cloneDeep : false,
    deep: true,
    passive: true,
  });
};
