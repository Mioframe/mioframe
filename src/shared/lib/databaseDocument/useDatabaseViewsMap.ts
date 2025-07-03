import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import { useDatabaseDocument } from './useDatabaseDocument';
import { toRefs } from '@vueuse/core';
import { useWrapStrictRecord } from '../strictRecord';
import type { DatabaseViewsMap } from './migrations/versions';
import {
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from './migrations/versions';
import { deepPutJsonObject, deepReplaceJsonObject } from '../changeObject';
import type { RecordEntries } from '../objectEntries';

export const useDatabaseViewsMap = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
): {
  entries: () => IterableIterator<[DatabaseViewId, DatabaseView]> | undefined;
  keys: () => IterableIterator<DatabaseViewId> | undefined;
  values: () => IterableIterator<DatabaseView> | undefined;
  has: (id: DatabaseViewId) => boolean | undefined;
  get: (viewId: DatabaseViewId) => DatabaseView | undefined;
  forEach: (
    callbackfn: (view: DatabaseView, id: DatabaseViewId) => void,
  ) => void;
  size: number | undefined;
  list: readonly [DatabaseViewId, DatabaseView][] | undefined;

  set: (id: DatabaseViewId, view: DatabaseView) => Promise<void>;
  create: (view: DatabaseView) => Promise<DatabaseViewId>;
  update: (
    id: DatabaseViewId,
    partialView: Partial<DatabaseView>,
  ) => Promise<void>;
  remove: (id: DatabaseViewId) => Promise<void>;
} => {
  const docHandle = computed(() => toValue(rawDocHandle));

  const { update: updateDatabaseDocument, state } = toRefs(
    useDatabaseDocument(docHandle),
  );

  const viewStrictRecord = computed(() => state.value?.views);

  const viewMap = useWrapStrictRecord(viewStrictRecord);

  const set = async (id: DatabaseViewId, view: DatabaseView) => {
    await updateDatabaseDocument.value((d) => {
      if (d.views[id]) {
        deepReplaceJsonObject(d.views[id], view);
      } else {
        d.views[id] = view;
      }

      return d;
    });
  };

  const create = async (view: DatabaseView) => {
    const id = generateViewId();

    await set(id, view);

    return id;
  };

  const update = async (
    id: DatabaseViewId,
    partialView: Partial<DatabaseView>,
  ) => {
    if (!has(id)) {
      throw new Error('View for update is missing');
    }

    await updateDatabaseDocument.value((d) => {
      return deepPutJsonObject(d, {
        views: {
          [id]: partialView,
        },
      });
    });
  };

  const entries = ():
    | IterableIterator<[DatabaseViewId, DatabaseView]>
    | undefined => viewMap.value?.entries();

  const keys = (): IterableIterator<DatabaseViewId> | undefined =>
    viewMap.value?.keys();

  const values = (): IterableIterator<DatabaseView> | undefined =>
    viewMap.value?.values();

  const has = (id: DatabaseViewId): boolean | undefined =>
    viewMap.value?.has(id);

  const get = (viewId: DatabaseViewId): DatabaseView | undefined =>
    viewMap.value?.get(viewId);

  const forEach = (
    callbackfn: (view: DatabaseView, id: DatabaseViewId) => void,
  ): void => {
    viewMap.value?.forEach(callbackfn);
  };

  const size = computed((): number | undefined => viewMap.value?.size);

  const list = computed(
    (): Readonly<RecordEntries<DatabaseViewsMap>> | undefined => {
      const iterator = entries();

      if (iterator) {
        return Array.from(iterator).sort(
          ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
        );
      }

      return undefined;
    },
  );

  const remove = async (id: DatabaseViewId) => {
    await updateDatabaseDocument.value((d) => {
      delete d.views?.[id];
    });
  };

  return reactive({
    entries,
    keys,
    values,
    has,
    get,
    forEach,
    size,
    list,

    set,
    create,
    update,
    remove,
  });
};
