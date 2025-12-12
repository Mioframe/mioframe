import { onKeyStroke, refAutoReset } from '@vueuse/core';

export const useFastKeyboardInput = () => {
  const keyboardInput = refAutoReset<string | undefined>(undefined, 500);
  onKeyStroke(
    ({ key }) => /^.$/.test(key),
    ({ key }) => {
      keyboardInput.value = (keyboardInput.value ?? '') + key;
    },
  );

  return keyboardInput;
};
