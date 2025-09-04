import type { MaybeElementRef } from '@vueuse/core';
import { tryOnScopeDispose, unrefElement } from '@vueuse/core';
import {
  computed,
  inject,
  provide,
  shallowReactive,
  watch,
  type InjectionKey,
} from 'vue';

type Value = HTMLElement | SVGElement;

type StackInjectionKey = InjectionKey<{
  add: (v: Value) => void;
  remove: (v: Value) => void;
}>;

type MainInjectionKey = InjectionKey<StackInjectionKey>;

const mainKey: MainInjectionKey = Symbol('mainKey');

/**
 * For parents
 * @returns
 */
export const useChildTeleportContainerStack = () => {
  const stack = shallowReactive(new Set<Value>());

  const parentStackKey = inject(mainKey, undefined);

  const parentStack = parentStackKey ? inject(parentStackKey) : undefined;

  const stackKey: StackInjectionKey = Symbol('stackKey');

  provide(mainKey, stackKey);

  const add = (v: Value) => {
    stack.add(v);
    parentStack?.add(v);
  };

  const remove = (v: Value) => {
    stack.delete(v);
    parentStack?.remove(v);
  };

  provide(stackKey, { add, remove });

  return {
    stack,
  };
};

/**
 * for child
 */
export const useTeleportContainerRegistry = (containerEl: MaybeElementRef) => {
  const currentElement = computed(() => unrefElement(containerEl));

  const stackSymbol = inject(mainKey, undefined);

  if (stackSymbol) {
    const stack = inject(stackSymbol);

    if (stack) {
      watch(
        currentElement,
        (el, old) => {
          if (old) {
            stack.remove(old);
          }
          if (el) {
            stack.add(el);
          }
        },
        { immediate: true },
      );

      tryOnScopeDispose(() => {
        if (currentElement.value) {
          stack.remove(currentElement.value);
        }
      });
    }
  }
};
