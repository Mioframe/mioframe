import type { AMDocumentId } from '@shared/lib/automerge';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
  type PatchSource,
} from '@shared/lib/changeObject';
import { DELETE_MARKER } from '@shared/lib/changeObject/deepPatchJsonObject';
import type {
  DatabaseFilter,
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { set } from 'es-toolkit/compat';

export const setupDatabaseViewFilterService = (
  getView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => Promise<undefined | DatabaseView>,
  changeView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => unknown,
) => {
  const get = async (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => {
    const view = await getView(path, documentId, viewId);

    return view?.filter;
  };

  const change = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseFilter) => unknown,
  ) =>
    changeView(path, documentId, viewId, (view) => {
      if (!view.filter) {
        view.filter = {};
      }

      cb(view.filter);
    });

  const patch = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    source: PatchSource<DatabaseFilter>,
  ) =>
    change(path, documentId, viewId, (filter) => {
      deepPatchJsonObject(filter, source, { trimString: true });
    });

  const post = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    source: DatabaseFilter,
  ) =>
    change(path, documentId, viewId, (filter) => {
      deepPutJsonObject(filter, source, { trimString: true });
    });

  const remove = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    sourcePath: PropertyKey[],
  ) =>
    change(path, documentId, viewId, (filter) => {
      const deletePatch = {};

      set(deletePatch, sourcePath, DELETE_MARKER);

      // todo: добавить удаление пустых родительских структур

      deepPatchJsonObject(filter, deletePatch);
    });

  return {
    get,

    patch,
    post,
    remove,
  };
};
