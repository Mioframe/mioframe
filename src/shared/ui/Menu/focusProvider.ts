import { tryOnScopeDispose } from '@vueuse/core';
import type { InjectionKey, Ref } from 'vue';
import { inject, provide, shallowReactive, watch } from 'vue';

const focusSymbol: InjectionKey<Map<string, () => void>> = Symbol('MenuFocusSymbol');

export const useProvideFocusRegister = () => {
  const focusRegister = shallowReactive(new Map<string, () => void>());
  provide(focusSymbol, focusRegister);

  return focusRegister;
};

export const useInjectFocusRegister = (
  text: Ref<string>,
  focus: Ref<(() => unknown) | undefined>,
) => {
  const focusRegister = inject(focusSymbol, undefined);

  watch(
    [text, focus],
    ([text, focus], [oldText]) => {
      if (focusRegister && focus) {
        if (oldText !== undefined) {
          focusRegister.delete(oldText);
        }
        focusRegister.set(text, focus);
      }
    },
    {
      immediate: true,
    },
  );

  tryOnScopeDispose(() => {
    focusRegister?.delete(text.value);
  });
};
