import type { AMDocumentId } from '@shared/lib/automerge';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
  DELETE_MARKER,
  type PatchSource,
} from '@shared/lib/changeObject';
import type { DatabaseFilter, DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { isEqual, set } from 'es-toolkit/compat';
import { removeEmptyStructures } from '@shared/lib/removeEmptyStructures';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

export const setupDatabaseViewFilterService = (
  databaseView$: (q: {
    documentId: AMDocumentId;
    path: string;
    viewId?: DatabaseViewId | undefined;
  }) => Observable<DatabaseView | undefined>,
  changeView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => unknown,
) => {
  const filter$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      documentId: AMDocumentId;
      path: string;
      viewId?: DatabaseViewId | undefined;
    }) =>
      databaseView$({ documentId, path, viewId }).pipe(
        map((view) => view?.filter),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

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

      deepPatchJsonObject(filter, deletePatch);

      removeEmptyStructures(filter);
    });

  return {
    filter$,
    filter: defineObservableQuery(filter$),

    patch,
    post,
    remove,
  };
};
