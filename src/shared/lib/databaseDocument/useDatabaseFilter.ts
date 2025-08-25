import { computed, reactive, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import type {
  DatabaseFilter,
  DatabaseLogicalCondition,
  DatabaseFieldFilter,
  DatabaseNestedFilter,
  DatabaseUnaryCondition,
  DatabaseViewId,
} from './types';
import { useDatabaseView } from './useDatabaseView';
import { deepReplaceJsonObject } from '../changeObject';
import { isObjectLike } from '../typeGuards';

export type UseDatabaseFilter = {
  filter: DatabaseFilter | undefined;
  update: (mutation: (filter: DatabaseFilter) => unknown) => Promise<void>;
};

export const useDatabaseFilter = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawViewId: MaybeRefOrGetter<DatabaseViewId | undefined>,
): UseDatabaseFilter => {
  const databaseView = useDatabaseView(rawDocHandle, rawViewId);

  const view = computed(() => databaseView.view);

  const filter = computed((): DatabaseFilter | undefined => view.value?.filter);

  const update = async (mutation: (filter: DatabaseFilter) => unknown) => {
    await databaseView.update((view) => {
      if (!view.filter) {
        view.filter = {};
      }
      mutation(view.filter);
    });
  };

  const { remove, set } = useDatabaseFilterMutation(update);

  return reactive({
    filter,
    update,
    remove,
    set,
  });
};

export const useDatabaseFilterMutation = <
  T extends
    | DatabaseFieldFilter
    | DatabaseUnaryCondition
    | DatabaseLogicalCondition
    | DatabaseNestedFilter
    | DatabaseFilter,
>(
  update: (mutation: (filter: T) => unknown) => Promise<void>,
) => {
  const set = async <K extends keyof T>(key: K, value: T[K]) => {
    await update((filter) => {
      if (!isObjectLike(filter[key]) || !isObjectLike(value)) {
        filter[key] = value;
      } else {
        deepReplaceJsonObject(filter[key], value, { trimString: true });
      }
    });
  };

  const remove = async (key: keyof T) => {
    await update((filter) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- for automerge
      delete filter[key];
    });
  };

  return {
    set,
    remove,
  };
};
