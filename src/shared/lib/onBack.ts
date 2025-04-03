import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from './logger';
import type { Promisable } from 'type-fest';

const { debug } = createLogger('onBack');

type Handler = () => Promisable<boolean | undefined>;

const useBackHandler = createGlobalState(() => {
  const handlerList: Handler[] = [];

  const addFakeState = () => {
    if (!window.history.state) {
      window.history.pushState(
        { id: Date.now() },
        document.title,
        window.location.href,
      );
    }
    debug('addFakeState', {
      length: window.history.length,
      state: window.history.state,
    });
    window.history.pushState(
      { id: Date.now() },
      document.title,
      window.location.href,
    );
    debug('addFakeState 2', {
      length: window.history.length,
      state: window.history.state,
    });
  };

  const goBack = () => {
    debug('goBack');
    window.history.back();
  };

  const popstateListener = async () => {
    debug('popstateListener', {
      length: window.history.length,
      state: window.history.state,
    });
    const result = await handlerList.at(-1)?.();

    debug('popstateListener 2', { result });

    if (result === false) {
      addFakeState();
    } else {
      goBack();
    }
    debug('popstateListener 3', {
      length: window.history.length,
      state: window.history.state,
    });
  };

  addFakeState();
  window.addEventListener('popstate', () => {
    void popstateListener();
  });

  const addHandler = (handler: Handler) => {
    handlerList.push(handler);
  };

  const removeHandler = (handler: Handler) => {
    const index = handlerList.indexOf(handler);
    handlerList.splice(index, 1);
  };

  return {
    addHandler,
    removeHandler,
  };
});

export const onBack = (handler: Handler) => {
  const { addHandler, removeHandler } = useBackHandler();

  addHandler(handler);

  tryOnScopeDispose(() => {
    removeHandler(handler);
  });
};
