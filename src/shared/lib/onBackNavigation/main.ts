import { createGlobalState, tryOnScopeDispose, useEventListener } from '@vueuse/core';
import { get, isNumber } from 'es-toolkit/compat';
import type { Promisable } from 'type-fest';
import type { Plugin } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { readonly, ref, toRef, toValue, watch } from 'vue';
import type {
  RouteLocationNormalizedGeneric,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';

type BackNavigationHandler = (
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedLoadedGeneric,
) => Promisable<boolean | undefined>;

const useBackNavigationStack = createGlobalState(() => {
  const router = useRouter();
  const globalPosition = usePositionState();
  const handlerStack: BackNavigationHandler[] = [];

  let queuedDispatchResult: Promise<boolean> | undefined;

  const dispatchBackNavigation = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ) => {
    if (!queuedDispatchResult) {
      queuedDispatchResult = (async () => {
        let allowNavigation = true;

        for (let index = handlerStack.length - 1; index >= 0 && allowNavigation; index--) {
          allowNavigation = (await handlerStack.at(index)?.(to, from)) === true;
        }

        return allowNavigation;
      })();

      queueMicrotask(() => {
        queuedDispatchResult = undefined;
      });
    }

    return await queuedDispatchResult;
  };

  const onBackNavigationStacked = (handler: BackNavigationHandler) => {
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

  router.beforeEach(async (to, from) => {
    const lastPosition = globalPosition.value;
    const historyPosition = get(window.history.state, 'position');

    if (isNumber(lastPosition) && isNumber(historyPosition) && lastPosition > historyPosition) {
      return await dispatchBackNavigation(to, from);
    }

    return true;
  });

  return {
    onBackNavigationStacked,
  };
});

export const usePositionState = createGlobalState(() => {
  const router = useRouter();

  const position = ref<number>();

  const updatePosition = () => {
    const historyPosition = get(window.history.state, 'position');
    position.value = isNumber(historyPosition) ? historyPosition : undefined;
  };

  router.afterEach(() => {
    setTimeout(() => {
      updatePosition();
    }, 0);
  });

  useEventListener(window, 'popstate', () => {
    updatePosition();
  });

  return readonly(position);
});

export const backNavigationHandler: Plugin = {
  install(app) {
    app.runWithContext(() => {
      usePositionState();
      useBackNavigationStack();
    });
  },
};

/**
 * Low-level hook for detecting browser back navigation from within a component.
 *
 * This hook only answers "did the router just attempt a backward navigation?".
 * It does not implement any stacking behavior on its own. Prefer
 * `useOnBackNavigationStacked()` for modal or layered UI where only the most
 * recently registered handler should react.
 *
 * Return `false` to consume the back action and keep the current route.
 * Return `true` to allow the router navigation to continue.
 */
export const onBackNavigation = (
  updateGuard: (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ) => Promisable<boolean>,
) => {
  const globalPosition = usePositionState();

  const currentPosition = toRef(() => {
    const { position } = window.history.state;
    return isNumber(position) ? position : undefined;
  });

  onBeforeRouteUpdate(async (to, from) => {
    const lastPosition = globalPosition.value;

    if (
      isNumber(lastPosition) &&
      isNumber(currentPosition.value) &&
      lastPosition > currentPosition.value
    ) {
      return await updateGuard(to, from);
    }
    return true;
  });

  onBeforeRouteLeave(async (to, from) => {
    const lastPosition = globalPosition.value;

    if (
      isNumber(lastPosition) &&
      isNumber(currentPosition.value) &&
      lastPosition > currentPosition.value
    ) {
      return await updateGuard(to, from);
    }
    return true;
  });
};

/**
 * Stacked back-navigation hook.
 *
 * Register a handler that should react to browser back only while the current
 * component scope is active. Handlers are evaluated in reverse registration
 * order, so the most recently mounted component gets the first chance to react.
 *
 * Return `true` to pass the back action to the next stacked handler.
 * Return `false` or nothing to consume the back action and stop propagation.
 */
export const useOnBackNavigationStacked = (handle: BackNavigationHandler) => {
  const { onBackNavigationStacked } = useBackNavigationStack();
  onBackNavigationStacked(handle);
};

/**
 * Conditional stacked back-navigation hook.
 *
 * Register the handler only while `when` is `true`.
 *
 * Use this for overlays that remain mounted while closed, so hidden surfaces
 * do not participate in back-navigation handling.
 *
 * Return `true` to pass the back action to the next stacked handler.
 * Return `false` or nothing to consume the back action and stop propagation.
 */
export const useOnBackNavigationStackedWhen = (
  when: MaybeRefOrGetter<boolean | undefined>,
  handle: BackNavigationHandler,
) => {
  const { onBackNavigationStacked } = useBackNavigationStack();
  let removeListener: (() => void) | undefined;

  const stopWatch = watch(
    () => toValue(when) === true,
    (shouldRegister) => {
      if (shouldRegister && !removeListener) {
        removeListener = onBackNavigationStacked(handle);
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
