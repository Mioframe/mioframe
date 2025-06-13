import type { MaybeRefOrGetter } from 'vue';
import { ref, computed, watch, toValue } from 'vue';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseView,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseDocument,
  type DatabaseItemId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { debounce } from 'perfect-debounce';
import { useReduceIterable } from '@shared/lib/useReduce';
import { useSortWorker } from './useSortWorker';
import type { DocHandle } from '@shared/lib/cfrDocument/automergeTypes';

export function useDataWorker(
  docHandle: MaybeRefOrGetter<DocHandle | undefined>,
  viewId: MaybeRefOrGetter<DatabaseViewId | undefined>,
) {
  const orderOfItems = ref<DatabaseItemId[]>([]);

  const docHandleRef = computed(() => toValue(docHandle));

  const { data: databaseData, view } = useDatabaseDocument(docHandleRef);

  const currentView = computed(() => {
    const id = toValue(viewId);

    if (id) {
      return view.state.value?.[id];
    }

    return undefined;
  });

  const worker = useSortWorker();

  const applyView = debounce(
    async (databaseData?: DatabaseData, databaseView?: DatabaseView) => {
      if (databaseData && databaseView) {
        orderOfItems.value = await worker.sortData(databaseData, databaseView);
      } else {
        orderOfItems.value = []; // FIXME:
      }
    },
    500,
    { leading: true, trailing: true },
  );

  watch(
    [databaseData, currentView],
    ([databaseData, databaseView]) => {
      void applyView(databaseData, databaseView);
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
