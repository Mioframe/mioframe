import type { MaybeRefOrGetter } from 'vue';
import { ref, computed, watch, toValue } from 'vue';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabaseView,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import { useDatabaseData } from '@shared/lib/databaseDocument';
import { debounce } from 'perfect-debounce';
import { useReduceIterable } from '@shared/lib/useReduce';
import { useSortWorker } from './useSortWorker';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { cloneDeep } from 'es-toolkit';

export function useOrderedDatabaseData(
  docHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  view: MaybeRefOrGetter<DatabaseView | undefined>,
) {
  const docHandleRef = computed(() => toValue(docHandle));
  const viewRef = computed(() => toValue(view));

  const orderOfItems = ref<DatabaseItemId[]>([]);

  const { data: databaseData } = useDatabaseData(docHandleRef);

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
    [databaseData, viewRef],
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
