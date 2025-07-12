import {
  createGlobalState,
  onKeyStroke,
  tryOnScopeDispose,
} from '@vueuse/core';

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

export const useOnEscapeKeyStacked = (handle: EscapeHandler) =>
  useEscapeKeyStack()(handle);
