import { computed } from 'vue';
import type { LocationQuery } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { uniqueId } from './uniqueId';
import { createGlobalState, tryOnScopeDispose, until } from '@vueuse/core';
import pLimit from 'p-limit';
import { isArray } from 'es-toolkit/compat';
import { isNil } from 'es-toolkit';

const layerActionQueue = pLimit(1);

export const useOverlayNavigationState = createGlobalState(() => {
  const router = useRouter();
  const route = useRoute();

  const paramKey = 'overlay';

  const stack = computed((): string[] => {
    const q = route.query[paramKey];
    if (!q) return [];
    return isArray(q) ? q.filter((v) => !isNil(v)) : [q];
  });

  const open = async (id: string) => {
    if (!stack.value.includes(id)) {
      await router.push({
        query: { ...route.query, [paramKey]: [...stack.value, id] },
      });
    }
    await until(() => stack.value.includes(id)).toBeTruthy();
  };

  const close = async (id: string) => {
    debugger;
    if (stack.value.includes(id)) {
      if (stack.value.at(-1) === id) {
        router.back();
      } else {
        const filteredStack = stack.value.filter((x) => x !== id);
        const query: LocationQuery = {
          ...route.query,
          [paramKey]: filteredStack,
        };
        if (!query[paramKey]?.length) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- remove stack from query
          delete query[paramKey];
        }
        await router.replace({ query });
      }
    }
    await until(() => !stack.value.includes(id)).toBeTruthy();
  };

  const useOverlay = (id: string) => {
    const show = computed<boolean>({
      get() {
        return stack.value.includes(id);
      },
      set(v) {
        if (v) {
          void layerActionQueue(() => open(id));
        } else {
          void layerActionQueue(() => close(id));
        }
      },
    });
    return { show };
  };

  return { useOverlay, stack };
});

export const useOverlayNavigation = (id: string = uniqueId('overlay')) => {
  const { useOverlay } = useOverlayNavigationState();

  const { show } = useOverlay(id);

  tryOnScopeDispose(() => {
    show.value = false;
  });

  return { show };
};
