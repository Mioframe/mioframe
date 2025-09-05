import { createGlobalState, useEventListener } from '@vueuse/core';
import { get, isNumber } from 'es-toolkit/compat';
import type { Promisable } from 'type-fest';
import type { Plugin } from 'vue';
import { readonly, ref, toRef } from 'vue';
import type {
  RouteLocationNormalizedGeneric,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';

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
    });
  },
};

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
