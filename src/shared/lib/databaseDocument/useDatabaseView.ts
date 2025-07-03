import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import type { DatabaseView, DatabaseViewId } from './migrations/state';
import { useDatabaseViewsMap } from './useDatabaseViewsMap';

export const useDatabaseView = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawViewId: MaybeRefOrGetter<DatabaseViewId | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));
  const viewId = computed(() => toValue(rawViewId));

  const databaseViewsMap = useDatabaseViewsMap(docHandle);

  const view = computed(() =>
    viewId.value ? databaseViewsMap.get(viewId.value) : undefined,
  );

  const update = async (partialView: Partial<DatabaseView>) => {
    if (viewId.value) {
      await databaseViewsMap.update(viewId.value, partialView);
    }
  };

  return reactive({
    view,
    update,
  });
};
