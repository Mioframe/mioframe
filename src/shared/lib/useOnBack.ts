import {
  createGlobalState,
  tryOnScopeDispose,
  useEventListener,
} from '@vueuse/core';
import { zodIs } from './validateZodScheme';
import { isObject } from 'es-toolkit/compat';
import { number } from 'zod/v4-mini';

type BackHandler = (() => boolean) | (() => unknown);

const useGlob = createGlobalState(() => {
  const handlerMap = new Map<number, BackHandler>();

  let lastId = 0;

  const popStateHandler = (e: PopStateEvent) => {
    const { state: newState } = e;

    if (
      isObject(newState) &&
      'onBackId' in newState &&
      zodIs(newState.onBackId, number())
    ) {
      const onBackId = newState.onBackId;

      const handler = handlerMap.get(onBackId);

      if (handler) {
        const allowBack = handler();

        if (allowBack === true) {
          history.back();
        } else {
          history.pushState(newState, document.title);
        }
      } else {
        history.back();
      }
    }
  };

  useEventListener('popstate', popStateHandler);

  const addHandler = (handler: BackHandler, onBackId = lastId + 1) => {
    lastId = onBackId;

    handlerMap.set(onBackId, handler);

    const currentState = history.state;

    history.replaceState({ ...currentState, onBackId }, '');

    history.pushState(currentState, document.title);

    const removeHandler = () => {
      handlerMap.delete(onBackId);
    };

    return removeHandler;
  };

  return {
    addHandler,
  };
});

export const useOnBack = (handler: BackHandler) => {
  const removeHandler = useGlob().addHandler(handler);

  tryOnScopeDispose(() => {
    removeHandler();
  });

  return removeHandler;
};
