import type { Ref } from 'vue';
import { computed, onBeforeUnmount, watch } from 'vue';
import type { LocationQuery } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { createGlobalState, tryOnScopeDispose, until } from '@vueuse/core';
import pLimit from 'p-limit';
import { isArray, toString } from 'es-toolkit/compat';
import { isNil } from 'es-toolkit';

const layerActionQueue = pLimit(1);

const useOverlayNavigationState = createGlobalState(() => {
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
          [paramKey]: [...stackQuery.value.filter((x) => usedIds.includes(x)), stringId],
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
        const filteredStack = stackQuery.value.filter((x) => x !== stringId && usedIds.includes(x));
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

  const useOverlay = (id: Ref<PropertyKey>) => {
    const stringId = computed(() => toString(id.value));

    watch(
      stringId,
      (nextStringId, oldStringId) => {
        if (oldStringId) {
          const index = usedIds.indexOf(oldStringId);
          if (index >= 0) {
            usedIds.splice(index, 1);
          }
        }

        usedIds.push(nextStringId);
      },
      { immediate: true },
    );

    const show = computed<boolean>({
      get() {
        const included = stackQuery.value.includes(stringId.value);
        return included;
      },
      set(v) {
        if (v && !show.value) {
          void layerActionQueue(async () => {
            await open(id.value);
          });
        } else if (!v && show.value) {
          void layerActionQueue(async () => {
            await close(id.value);
          });
        }
      },
    });

    tryOnScopeDispose(() => {
      const index = usedIds.indexOf(stringId.value);

      if (index >= 0) {
        usedIds.splice(index, 1);
      }
    });

    return { show };
  };

  return { useOverlay, stack: stackQuery };
});

/**
 * @param id
 * @deprecated
 */
export const useOverlayNavigation = (id: Ref<PropertyKey>) => {
  const { useOverlay } = useOverlayNavigationState();

  const { show } = useOverlay(id);

  onBeforeUnmount(() => {
    show.value = false;
  });

  return { show };
};
