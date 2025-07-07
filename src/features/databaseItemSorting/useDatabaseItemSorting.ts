import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
} from '@shared/lib/databaseDocument';
import {
  SORT_DIRECTION,
  useDatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { shallowClone } from '@shared/lib/shallowClone';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { toRefs } from '@vueuse/core';
import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';

export const useDatabaseViewSorting = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawViewId: MaybeRefOrGetter<DatabaseViewId | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));
  const viewId = computed(() => toValue(rawViewId));

  const databaseView = useDatabaseView(docHandle, viewId);

  const { view } = toRefs(databaseView);

  const sorting = computed(() => view.value?.sorting);

  const sortingMap = useWrapStrictRecord(sorting);

  const sortingList = computed(() =>
    shallowClone(sortingMap.value?.entries)?.sort(
      ([, { priority: a }], [, { priority: b }]) => a - b,
    ),
  );

  const addSorting = async (propertyId: DatabasePropertyId) => {
    await databaseView.update((view) => {
      if (!view.sorting) {
        view.sorting = {};
      }
      view.sorting[propertyId] = {
        priority: sortingMap.value?.size ?? 0,
        direction: SORT_DIRECTION.ascending,
      };
    });
  };

  const has = (propertyId: DatabasePropertyId) =>
    sortingMap.value?.has(propertyId);

  const remove = async (propertyId: DatabasePropertyId) => {
    await databaseView.update((view) => {
      if (view.sorting) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- for automerge
        delete view.sorting[propertyId];
      }
    });
  };

  const update = async (
    propertyId: DatabasePropertyId,
    mutation: (sortDescription: DatabaseSortDescription) => unknown,
  ) => {
    await databaseView.update((view) => {
      if (!view.sorting) {
        view.sorting = {};
      }

      if (!view.sorting[propertyId]) {
        view.sorting[propertyId] = {
          direction: SORT_DIRECTION.ascending,
          priority: sortingMap.value?.size ?? 0,
        };
      }

      mutation(view.sorting[propertyId]);
    });
  };

  return reactive({
    sortingList,
    keys: computed(() => sortingMap.value?.keys),
    addSorting,
    size: computed(() => sortingMap.value?.size),
    has,
    remove,
    update,
  });
};
