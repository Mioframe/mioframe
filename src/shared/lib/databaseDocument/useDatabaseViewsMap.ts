import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import { useDatabaseDocument } from './useDatabaseDocument';
import { toRefs } from '@vueuse/core';
import { useWrapStrictRecord } from '../strictRecord';
import {
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from './migrations/versions';
import { deepPutJsonObject, deepReplaceJsonObject } from '../changeObject';
import { shallowClone } from '../shallowClone';

export const useDatabaseViewsMap = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
): {
  entries: [DatabaseViewId, DatabaseView][] | undefined;
  keys: DatabaseViewId[] | undefined;
  values: DatabaseView[] | undefined;
  has: (id: DatabaseViewId) => boolean | undefined;
  get: (viewId: DatabaseViewId) => DatabaseView | undefined;
  forEach: (
    callbackfn: (view: DatabaseView, id: DatabaseViewId) => void,
  ) => void;
  size: number | undefined;
  list: readonly [DatabaseViewId, DatabaseView][] | undefined;
  defaultView: [DatabaseViewId, DatabaseView] | undefined;

  set: (id: DatabaseViewId, view: DatabaseView) => Promise<void>;
  create: (view: DatabaseView) => Promise<DatabaseViewId>;
  put: (
    id: DatabaseViewId,
    partialView: Partial<DatabaseView>,
  ) => Promise<void>;
  remove: (id: DatabaseViewId) => Promise<void>;
  update: (
    id: DatabaseViewId,
    mutation: (view: DatabaseView) => unknown,
  ) => Promise<void>;
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

  const put = async (
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

  const entries = computed(() => viewMap.value?.entries);
  const keys = computed(() => viewMap.value?.keys);
  const values = computed(() => viewMap.value?.values);

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

  const list = computed(() =>
    shallowClone(entries.value)?.sort(
      ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
    ),
  );

  const remove = async (id: DatabaseViewId) => {
    await updateDatabaseDocument.value((d) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- it's for automerge
      delete d.views[id];
    });
  };

  const defaultView = computed(() => list.value?.at(0));

  const update = (
    viewId: DatabaseViewId,
    mutation: (view: DatabaseView) => unknown,
  ) => {
    return updateDatabaseDocument.value((doc) => {
      const view = doc.views[viewId];
      if (view) {
        mutation(view);
      }
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
    defaultView,

    set,
    create,
    put,
    remove,
    update,
  });
};
