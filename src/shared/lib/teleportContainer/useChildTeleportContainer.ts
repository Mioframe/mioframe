import type { MaybeElementRef } from '@vueuse/core';
import { tryOnScopeDispose, unrefElement } from '@vueuse/core';
import type { Ref } from 'vue';
import {
  computed,
  inject,
  provide,
  reactive,
  shallowReactive,
  watch,
  type InjectionKey,
} from 'vue';
import { useClosestElement } from '../useClosestElement';

type WebElement = HTMLElement | SVGElement;

type Stack = {
  add: (v: WebElement) => void;
  remove: (v: WebElement) => void;
};

type StackInjectionKey = InjectionKey<Stack>;

type MainInjectionKey = InjectionKey<StackInjectionKey>;

const keyForChildrenStack: MainInjectionKey = Symbol('childrenStackKey');

/**
 * Стек контейнеров дочерних телепортов
 * @returns
 */
export const useChildTeleportContainerStack = () => {
  const childStack = shallowReactive(new Set<WebElement>());

  const parentStackKey = inject(keyForChildrenStack, undefined);

  const parentStack = parentStackKey ? inject(parentStackKey) : undefined;

  const currentStackKey: StackInjectionKey = Symbol('childrenStackKey');

  provide(keyForChildrenStack, currentStackKey);

  const add = (v: WebElement) => {
    childStack.add(v);
    parentStack?.add(v);
  };

  const remove = (v: WebElement) => {
    childStack.delete(v);
    parentStack?.remove(v);
  };

  const stackApiForChild: Stack = { add, remove };

  provide(currentStackKey, stackApiForChild);

  return {
    childStack,
  };
};

const parentStackKey: InjectionKey<Ref<ReadonlySet<WebElement>>> = Symbol('parentStackKey');

/**
 * Стек родителей телепортированных контенеров
 * @returns
 */
export const useParentTeleportContainerStack = () => {
  const stack = inject(parentStackKey);

  return {
    stack: computed(() => stack?.value ?? new Set<WebElement>()),
  };
};

/**
 * key - телепортированный контейнер
 * value - источник телепортации
 */
export const teleportContainerAndParent = reactive<Map<WebElement, WebElement>>(new Map());

/**
 * Регистрация контейнера телепорта
 * @param teleportedContainer
 */
export const useTeleportContainerRegistry = (teleportedContainer: MaybeElementRef) => {
  const teleportedContainerElement = computed(() => unrefElement(teleportedContainer));

  const stackSymbol = inject(keyForChildrenStack, undefined);

  const childrenStack = stackSymbol ? inject(stackSymbol, undefined) : undefined;

  watch(
    teleportedContainerElement,
    (container, old) => {
      if (old) {
        childrenStack?.remove(old);
        teleportContainerAndParent.delete(old);
      }
      if (container) {
        childrenStack?.add(container);
      }
    },
    { immediate: true },
  );

  const parentEl = useClosestElement();

  watch(
    [teleportedContainerElement, parentEl],
    ([container, parent], [oldContainer]) => {
      if (oldContainer) {
        teleportContainerAndParent.delete(oldContainer);
      }
      if (container && parent) {
        teleportContainerAndParent.set(container, parent);
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    if (teleportedContainerElement.value) {
      childrenStack?.remove(teleportedContainerElement.value);
      teleportContainerAndParent.delete(teleportedContainerElement.value);
    }
  });
};
