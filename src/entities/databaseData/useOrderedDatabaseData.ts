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
import type { ItemIdQuery } from './queryTypes';

export function useOrderedDatabaseData(
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawView: MaybeRefOrGetter<DatabaseView | undefined>,
  idQuery: MaybeRefOrGetter<ItemIdQuery | undefined>,
) {
  const docHandle = computed(() => toValue(rawDocHandle));
  const view = computed(() => toValue(rawView));
  const idQueryRef = computed(() => toValue(idQuery));

  const orderOfItems = ref<DatabaseItemId[]>([]);

  const { data: databaseData } = useDatabaseData(docHandle);

  const { queryData } = useSortWorker();

  const applyView = debounce(
    async (
      databaseData?: DatabaseData,
      databaseView?: DatabaseView,
      idQuery?: ItemIdQuery,
    ) => {
      const sorting: DatabaseSortMap | undefined = databaseView?.sorting;

      if (databaseData) {
        orderOfItems.value = await queryData(databaseData, {
          sorting,
          idQuery,
        });
      } else {
        orderOfItems.value = [];
      }
    },
    500,
    { leading: true, trailing: true },
  );

  watch(
    [databaseData, view, idQueryRef],
    ([databaseData, databaseView, idQuery]) => {
      void applyView(
        cloneDeep(databaseData),
        cloneDeep(databaseView),
        cloneDeep(idQuery),
      );
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
