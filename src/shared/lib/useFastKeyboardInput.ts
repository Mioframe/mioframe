import { onKeyStroke, refAutoReset } from '@vueuse/core';

/**
 * Captures single character keyboard input globally.
 *
 * Creates a reactive ref that captures single key presses (exactly one character).
 * Useful for quick search triggers or keyboard shortcuts.
 * The value resets to undefined after 500ms of inactivity.
 *
 * @returns Ref that contains the last single character key pressed
 *
 * @example
 * ```ts
 * const input = useFastKeyboardInput();
 * watch(input, (key) => {
 *   if (key) console.log('Quick search:', key);
 * });
 * ```
 */
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
