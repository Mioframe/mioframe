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

export const useModalAriaHidden = () => {
  const { add, quantity, remove } = useAriaHiddenStack();

  const order = add();

  tryOnScopeDispose(() => {
    remove();
  });

  return computed(() => order < quantity.value);
};

export const useMainContentAriaHidden = () => {
  const { quantity } = useAriaHiddenStack();

  return computed(() => quantity.value > 0);
};
