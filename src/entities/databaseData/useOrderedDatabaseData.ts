import type { MaybeRefOrGetter } from 'vue';
import { ref, computed, watch, toValue, watchEffect } from 'vue';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabaseView,
  DatabaseViewId,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { debounce } from 'perfect-debounce';
import { useReduceIterable } from '@shared/lib/useReduce';
import { useSortWorker } from './useSortWorker';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { cloneDeep } from 'es-toolkit';

export function useOrderedDatabaseData(
  docHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  viewId: MaybeRefOrGetter<DatabaseViewId | undefined>,
) {
  const orderOfItems = ref<DatabaseItemId[]>([]);

  const docHandleRef = computed(() => toValue(docHandle));

  const { data: databaseData, view } = useDatabaseDocument(docHandleRef);

  const currentView = computed((): DatabaseView | undefined => {
    const id = toValue(viewId);

    if (id) {
      return view.state.value?.[id];
    }

    return undefined;
  });

  const { sortData } = useSortWorker();

  const applyView = debounce(
    async (databaseData?: DatabaseData, databaseView?: DatabaseView) => {
      const sorting: DatabaseSortMap | undefined = databaseView?.sorting;

      if (databaseData) {
        orderOfItems.value = await sortData(databaseData, sorting);
      } else {
        orderOfItems.value = [];
      }
    },
    500,
    { leading: true, trailing: true },
  );

  watch(
    [databaseData, currentView],
    ([databaseData, databaseView]) => {
      void applyView(cloneDeep(databaseData), cloneDeep(databaseView));
    },
    {
      immediate: true,
      deep: true,
    },
  );

  const itemList = useReduceIterable(
    orderOfItems,
    (acc, id) => {
      console.debug('useReduceIterable');
      const item = databaseData.value?.[id];
      if (item) {
        acc.push([id, item]);
      }
    },
    <[DatabaseItemId, DatabaseItem][]>[],
  );

  watchEffect(() => {
    console.debug('orderOfItems', cloneDeep(orderOfItems.value));
  });

  return {
    orderOfItems: computed(() => orderOfItems.value),
    itemList: computed(() => itemList.value),
  };
}
