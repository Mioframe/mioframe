import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from './logger';
import type { Promisable } from 'type-fest';
import detectBackButton from 'detect-browser-back-navigation';

const { debug } = createLogger('onBack');

type Handler = () => Promisable<boolean | undefined>;

const useBackHandler = createGlobalState(() => {
  const handlerList: Handler[] = [];

  const backBtnListener = async () => {
    debug('backBtnListener');
    const result = await handlerList.at(-1)?.();
    unDetectBackBtn();
    if (result !== false) {
      window.history.back();
    }
    setTimeout(() => {
      unDetectBackBtn = detectBackButton(() => {
        void backBtnListener();
      });
    }, 0);
  };

  let unDetectBackBtn = detectBackButton(() => {
    void backBtnListener();
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

/**
 * @deprecated - работает ужасно, браузеры неадекватно ведут себя, похоже на кеширование состояния страницы. заменить на роутинг
 * @param handler
 */
export const onBack = (handler: Handler) => {
  const { addHandler, removeHandler } = useBackHandler();

  addHandler(handler);

  tryOnScopeDispose(() => {
    removeHandler(handler);
  });
};
