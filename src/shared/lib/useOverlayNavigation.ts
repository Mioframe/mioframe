import { computed, onBeforeUnmount } from 'vue';
import type { LocationQuery } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { uniqueId } from './uniqueId';
import { createGlobalState, tryOnScopeDispose, until } from '@vueuse/core';
import pLimit from 'p-limit';
import { isArray, toString } from 'es-toolkit/compat';
import { isNil } from 'es-toolkit';

const layerActionQueue = pLimit(1);

export const useOverlayNavigationState = createGlobalState(() => {
  const router = useRouter();
  const route = useRoute();

  const paramKey = 'overlay';

  const stackQuery = computed((): string[] => {
    const q = route.query[paramKey];
    if (!q) return [];
    return isArray(q) ? q.filter((v) => !isNil(v)).map(toString) : [q];
  });

  const open = async (id: PropertyKey) => {
    const stringId = toString(id);
    if (!stackQuery.value.includes(stringId)) {
      await router.push({
        query: {
          ...route.query,
          [paramKey]: [
            ...stackQuery.value.filter((x) => usedIds.includes(x)),
            stringId,
          ],
        },
      });
    }
    await until(() => stackQuery.value.includes(stringId)).toBeTruthy();
  };

  const close = async (id: PropertyKey) => {
    const stringId = toString(id);
    if (stackQuery.value.includes(stringId)) {
      if (stackQuery.value.at(-1) === stringId) {
        router.back();
      } else {
        const filteredStack = stackQuery.value.filter(
          (x) => x !== stringId && usedIds.includes(x),
        );
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
    await until(() => !stackQuery.value.includes(stringId)).toBeTruthy();
  };

  const usedIds: string[] = [];

  const useOverlay = (id: PropertyKey) => {
    const stringId = toString(id);

    usedIds.push(stringId);

    const show = computed<boolean>({
      get() {
        const included = stackQuery.value.includes(stringId);
        return included;
      },
      set(v) {
        if (v && !show.value) {
          void layerActionQueue(async () => {
            await open(id);
          });
        } else if (!v && show.value) {
          void layerActionQueue(async () => {
            await close(id);
          });
        }
      },
    });

    tryOnScopeDispose(() => {
      const index = usedIds.indexOf(stringId);

      if (index >= 0) {
        usedIds.splice(index, 1);
      }
    });

    return { show };
  };

  return { useOverlay, stack: stackQuery };
});

export const useOverlayNavigation = (id: PropertyKey = uniqueId('overlay')) => {
  const { useOverlay } = useOverlayNavigationState();

  const { show } = useOverlay(id);

  onBeforeUnmount(() => {
    show.value = false;
  });

  return { show };
};
