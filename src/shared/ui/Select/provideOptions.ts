import { DomainError } from '@shared/lib/error';
import { tryOnScopeDispose } from '@vueuse/core';
import type { Ref } from 'vue';
import { inject, provide, shallowReactive, watch, type InjectionKey } from 'vue';

type Value = string | number;
type Label = string;

const provideSelectOptionKey: InjectionKey<Map<Value, Label>> = Symbol();

const provideClickOption: InjectionKey<(value: Value) => unknown> = Symbol();

export const useSelectOptions = (onClickOption: (value: Value) => unknown) => {
  const options = shallowReactive(new Map<Value, Label>());

  provide(provideSelectOptionKey, options);

  provide(provideClickOption, onClickOption);

  return options;
};

export const setupOption = (value: Ref<Value>, label: Ref<Label>) => {
  const options = inject(provideSelectOptionKey, undefined);
  const onClickOption = inject(provideClickOption, () => {
    if (import.meta.env.DEV) {
      throw new DomainError('The Option component must be inside the Select component.');
    }
  });

  watch(
    [value, label],
    ([value, label], [oldValue]) => {
      if (options) {
        if (oldValue !== undefined) {
          options.delete(oldValue);
        }

        options.set(value, label);
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    if (options) {
      options.delete(value.value);
    }
  });

  return {
    onClickOption: () => onClickOption(value.value),
  };
};
