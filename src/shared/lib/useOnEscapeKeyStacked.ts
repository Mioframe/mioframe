import {
  createGlobalState,
  onKeyStroke,
  tryOnScopeDispose,
} from '@vueuse/core';
import type { MaybeRefOrGetter } from 'vue';
import { toValue, watch } from 'vue';

type EscapeHandler =
  | ((e: KeyboardEvent) => boolean)
  | ((e: KeyboardEvent) => void);

const useEscapeKeyStack = createGlobalState(() => {
  const handlerStack: EscapeHandler[] = [];

  const mainHandler = (e: KeyboardEvent) => {
    let allowNextHandler: boolean | undefined = true;
    for (
      let index = handlerStack.length - 1;
      index > -1 && index <= handlerStack.length && allowNextHandler;
      index--
    ) {
      allowNextHandler = handlerStack.at(index)?.(e) ?? false;
    }
  };

  onKeyStroke('Escape', mainHandler);

  const onEscapeKeyStacked = (handler: EscapeHandler) => {
    handlerStack.push(handler);

    const removeListener = () => {
      const index = handlerStack.indexOf(handler);
      if (index >= 0) {
        handlerStack.splice(index, 1);
      }
    };

    tryOnScopeDispose(() => {
      removeListener();
    });

    return removeListener;
  };

  return onEscapeKeyStacked;
});

/**
 * Stacked Escape-key hook.
 *
 * Register a handler that should react to `Escape` only while the current
 * component scope is active. Handlers run in reverse registration order, so the
 * most recently mounted component receives the key first.
 *
 * Return `true` to pass the key press to the next stacked handler.
 * Return `false` or nothing to consume the key press and stop propagation.
 */
export const useOnEscapeKeyStacked = (handle: EscapeHandler) => {
  const onEscapeKeyStacked = useEscapeKeyStack();
  onEscapeKeyStacked(handle);
};

/**
 * Conditional stacked Escape-key hook.
 *
 * Register the handler only while `when` is `true`.
 *
 * Use this for overlays that stay mounted while hidden, such as menus or
 * tooltips controlled by a local `show` ref.
 *
 * Return `true` to pass the key press to the next stacked handler.
 * Return `false` or nothing to consume the key press and stop propagation.
 */
export const useOnEscapeKeyStackedWhen = (
  when: MaybeRefOrGetter<boolean | undefined>,
  handle: EscapeHandler,
) => {
  const onEscapeKeyStacked = useEscapeKeyStack();
  let removeListener: (() => void) | undefined;

  const stopWatch = watch(
    () => toValue(when) === true,
    (shouldRegister) => {
      if (shouldRegister && !removeListener) {
        removeListener = onEscapeKeyStacked(handle);
      } else if (!shouldRegister && removeListener) {
        removeListener();
        removeListener = undefined;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  tryOnScopeDispose(() => {
    stopWatch();
    removeListener?.();
    removeListener = undefined;
  });
};
