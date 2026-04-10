import { DomainError } from '@shared/lib/error';
import { tryOnScopeDispose } from '@vueuse/core';
import type { Ref } from 'vue';
import { inject, provide, shallowReactive, watch, type InjectionKey } from 'vue';

type Value = string | number;
type Label = string;

const provideSelectOptionKey: InjectionKey<Map<Value, Label>> = Symbol();

const provideClickOption: InjectionKey<(value: Value) => unknown> = Symbol();

export const useSelectOptions = <TValue extends Value>(
  onClickOption: (value: TValue) => unknown,
) => {
  const options = shallowReactive(new Map<TValue, Label>());

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Vue injection key is shared across all select value variants, so the provided map is widened at the injection boundary
  provide(provideSelectOptionKey, options as Map<Value, Label>);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- The injected click handler is stored under a non-generic key and widened only at the provide/inject boundary
  provide(provideClickOption, onClickOption as (value: Value) => unknown);

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
    ([nextValue, nextLabel], [oldValue]) => {
      if (options) {
        if (oldValue !== undefined) {
          options.delete(oldValue);
        }

        options.set(nextValue, nextLabel);
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
