// import './debug.css';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import { computed, ref } from 'vue';

const useAriaHiddenStack = createGlobalState(() => {
  const quantity = ref<number>(0);

  return {
    add: () => (quantity.value += 1),
    remove: () => (quantity.value -= 1),
    quantity,
  };
});

export const useAriaHidden = () => {
  const { add, quantity, remove } = useAriaHiddenStack();

  const order = add();

  tryOnScopeDispose(() => {
    remove();
  });

  return computed(() => order < quantity.value);
};
