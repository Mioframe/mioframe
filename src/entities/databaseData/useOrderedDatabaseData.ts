import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabaseView,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import { useDatabaseData } from '@shared/lib/databaseDocument';
import { useReduceIterable } from '@shared/lib/useReduce';
import { useSortWorker } from './useSortWorker';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { cloneDeep } from 'es-toolkit';
import type { ItemIdQuery } from './queryTypes';
import { asyncComputed } from '@vueuse/core';

export function useOrderedDatabaseData(
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawView: MaybeRefOrGetter<DatabaseView | undefined>,
  rawIdQuery: MaybeRefOrGetter<ItemIdQuery | undefined>,
) {
  const docHandle = computed(() => toValue(rawDocHandle));
  const view = computed(() => toValue(rawView));
  const idQuery = computed(() => toValue(rawIdQuery));

  const { data: databaseData } = useDatabaseData(docHandle);

  const { queryData } = useSortWorker();

  const orderOfItems = asyncComputed(
    async () => {
      const sorting: DatabaseSortMap | undefined = view.value?.sorting;

      if (databaseData.value) {
        return await queryData(
          databaseData.value,
          cloneDeep({
            sorting,
            idQuery: idQuery.value,
          }),
        );
      }
      return [];
    },
    [],
    { lazy: true },
  );

  const itemList = useReduceIterable(
    () => orderOfItems.value,
    (acc, id) => {
      const item = databaseData.value?.[id];
      if (item) {
        acc.push([id, item]);
      }
    },
    <[DatabaseItemId, DatabaseItem][]>[],
  );

  return {
    orderOfItems: computed(() => orderOfItems.value),
    itemList: computed(() => itemList.value),
  };
}
